import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { users, clients, projects, payments, documents, messages, clientUploads } from "@shared/schema";
import { loginSchema, changePasswordSchema, insertClientSchema, insertProjectSchema, insertMessageSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import {
  isEmailConfigured,
  sendWelcomeEmail,
  sendPaymentReminderEmail,
  sendDocumentSignatureRequestEmail,
  sendProjectStatusUpdateEmail,
  sendPaymentConfirmationEmail,
  sendNewMessageNotificationEmail,
  sendWorkflowEmail,
  sendPasswordResetCodeEmail,
  sendQuoteNotificationEmail,
  notifyClientActivity,
  notifyAdminActivity,
} from "./emailService";
import { generateInvoicePdf, generateInvoiceNumber } from "./invoiceService";
import { generateQuestionnairePdf } from "./questionnairePdfService";
import { generateTosPdf, generateSignedTosPdf, TosGenerationResult } from "./tosPdfService";
import {
  initializeWebSocket,
  notifyNewMessage,
  notifyProjectStatusUpdate,
  notifyPaymentUpdate,
  notifyDocumentUpdate,
} from "./websocketService";

const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required for JWT signing");
}

const createClientRequestSchema = z.object({
  businessLegalName: z.string().min(1, "Business name is required"),
  businessEmail: z.string().email().optional().or(z.literal("")),
  businessPhone: z.string().optional(),
  industry: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
  existingWebsite: z.string().optional(),
  secondaryContactName: z.string().optional(),
  secondaryContactEmail: z.string().email().optional().or(z.literal("")),
  secondaryContactPhone: z.string().optional(),
  secondaryContactRelationship: z.string().optional(),
});

const createProjectRequestSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  projectType: z.enum(["new_website", "redesign", "landing_page", "ecommerce", "other"]),
  projectTypeOther: z.string().optional(),
  servicesIncluded: z.array(z.string()).optional(),
  numberOfPages: z.number().optional(),
  specialRequirements: z.string().optional(),
  totalCost: z.string().min(1, "Total cost is required"),
  paymentStructure: z.enum(["50_50", "custom", "full_upfront"]).optional(),
  startDate: z.string().optional(),
  expectedCompletionDate: z.string().optional(),
  estimatedDurationWeeks: z.number().optional(),
});

const updateProjectStatusSchema = z.object({
  status: z.enum([
    "draft",
    "created",
    "questionnaire_pending",
    "questionnaire_complete",
    "quote_draft",
    "quote_sent",
    "quote_approved",
    "tos_pending",
    "tos_signed",
    "deposit_pending",
    "deposit_paid",
    "design_pending",
    "design_sent",
    "design_approved",
    "in_development",
    "ready_for_review",
    "client_review",
    "revisions_pending",
    "revisions_complete",
    "awaiting_final_payment",
    "payment_complete",
    "hosting_setup_pending",
    "hosting_configured",
    "completed",
    "on_hold",
    "cancelled"
  ]),
});

const sendMessageSchema = z.object({
  messageText: z.string().min(1, "Message cannot be empty"),
  category: z.enum(["general", "development_feedback", "revision_request", "support"]).optional().default("general"),
  projectId: z.string().optional(),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
});

const signDocumentSchema = z.object({
  signatureData: z.string().min(1, "Signature data is required"),
  signatureType: z.enum(["drawn", "typed"]),
});

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "admin" | "client";
    firstName: string;
    lastName: string;
    clientId?: string;
  };
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = decoded as AuthRequest["user"];
    next();
  });
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

function requireClient(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "client") {
    return res.status(403).json({ error: "Client access required" });
  }
  next();
}

// Helper to check if admin can edit a specific client
async function canAdminEditClientHelper(adminId: string, clientId: string): Promise<boolean> {
  const client = await storage.getClient(clientId);
  if (!client) return false;
  
  // Owner can always edit
  if (client.createdBy === adminId) return true;
  
  // Check for granted edit access
  return await storage.canAdminEditClient(adminId, clientId);
}

// Helper to calculate project progress percentage based on status
// Returns -1 for on_hold/cancelled to indicate "paused" state (UI should handle display)
function calculateProjectProgress(status: string): number {
  const progressMap: Record<string, number> = {
    draft: 2,
    created: 5,
    questionnaire_pending: 10,
    questionnaire_complete: 20,
    quote_draft: 25,
    quote_sent: 28,
    quote_approved: 32,
    tos_pending: 35,
    tos_signed: 38,
    deposit_pending: 40,
    deposit_paid: 45,
    design_pending: 48,
    design_sent: 50,
    design_approved: 55,
    in_development: 65,
    ready_for_review: 75,
    client_review: 80,
    revisions_pending: 82,
    revisions_complete: 85,
    awaiting_final_payment: 88,
    payment_complete: 92,
    hosting_setup_pending: 95,
    hosting_configured: 98,
    completed: 100,
    on_hold: -1,
    cancelled: -1,
  };
  return progressMap[status] ?? 0;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Initialize WebSocket server for real-time notifications
  initializeWebSocket(httpServer);

  // ============ AUTH ROUTES ============

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const { email, password } = parsed.data;
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (!user.isActive) {
        return res.status(401).json({ 
          error: "Account closed",
          message: "Your account has been closed. If you have any questions or need assistance, please contact us at hello@mlwebdesign.com. We're always happy to help!",
          accountClosed: true
        });
      }

      await storage.updateUser(user.id, { lastLogin: new Date() as any });

      // Get clientId for client users (needed for WebSocket routing)
      let clientId: string | undefined;
      if (user.role === "client") {
        const client = await storage.getClientByUserId(user.id);
        clientId = client?.id;
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          clientId,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          mustChangePassword: user.mustChangePassword,
          clientId,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/change-password", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid data" });
      }

      const { currentPassword, newPassword } = parsed.data;
      const user = await storage.getUser(req.user!.id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { passwordHash, mustChangePassword: false });

      res.json({ success: true });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);

      if (user && user.isActive) {
        // Generate 6-digit code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetCodeHash = await bcrypt.hash(resetCode, 10);
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await storage.updateUser(user.id, {
          resetToken: resetCodeHash,
          resetTokenExpiry: expiry,
        } as any);

        await storage.createActivityLog({
          userId: user.id,
          action: "password_reset_requested",
          description: "Password reset code sent via email",
          ipAddress: req.ip,
        });

        // Send email with code
        await sendPasswordResetCodeEmail(user.email, user.firstName || "User", resetCode);
      }

      // Always return success to prevent email enumeration
      res.json({ success: true, message: "If the email exists, a reset code has been sent" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Verify reset code and reset password
  app.post("/api/auth/verify-reset-code", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res.status(400).json({ error: "Email, code, and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !user.resetToken || !user.resetTokenExpiry) {
        return res.status(400).json({ error: "Invalid or expired reset code" });
      }

      // Check if code expired
      if (new Date(user.resetTokenExpiry) < new Date()) {
        return res.status(400).json({ error: "Reset code has expired. Please request a new one." });
      }

      // Verify code
      const validCode = await bcrypt.compare(code, user.resetToken);
      if (!validCode) {
        return res.status(400).json({ error: "Invalid reset code" });
      }

      // Update password and clear reset token
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        mustChangePassword: false,
      } as any);

      await storage.createActivityLog({
        userId: user.id,
        action: "password_reset_completed",
        description: "Password reset via email code",
        ipAddress: req.ip,
      });

      res.json({ success: true, message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Verify reset code error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ CLIENT ROUTES ============

  app.get("/api/client/dashboard", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.json({ project: null, pendingPayments: [], unsignedDocuments: [], recentActivity: [] });
      }

      const projectsList = await storage.getProjectsByClientId(client.id);
      const project = projectsList[0];
      const allPayments = await storage.getPaymentsByClientId(client.id);
      const pendingPayments = allPayments.filter(p => p.status === "pending");
      const docs = await storage.getDocumentsByClientId(client.id);
      const unsignedDocuments = docs.filter(d => d.requiresSignature && !d.isSigned);
      const recentActivity = await storage.getActivityLogsByClientId(client.id);

      // Add calculated progress percentage
      const projectWithProgress = project ? {
        ...project,
        client,
        progressPercentage: calculateProjectProgress(project.status),
      } : null;

      res.json({
        project: projectWithProgress,
        pendingPayments,
        unsignedDocuments,
        recentActivity,
      });
    } catch (error) {
      console.error("Client dashboard error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/client/payments", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.json([]);
      }
      const paymentsList = await storage.getPaymentsByClientId(client.id);
      res.json(paymentsList);
    } catch (error) {
      console.error("Client payments error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/client/documents", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.json([]);
      }
      const docs = await storage.getDocumentsByClientId(client.id);
      res.json(docs.filter(d => d.visibleToClient));
    } catch (error) {
      console.error("Client documents error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/client/documents/:id/sign", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const parsed = signDocumentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid data" });
      }
      const { signatureData, signatureType } = parsed.data;

      const doc = await storage.getDocument(id);
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }

      const client = await storage.getClientByUserId(req.user!.id);
      if (!client || doc.clientId !== client.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.updateDocument(id, {
        isSigned: true,
        signatureData,
        signatureType,
        signedAt: new Date() as any,
        signedByIp: req.ip,
      });

      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: client.id,
        action: "document_signed",
        description: `Signed document: ${doc.title}`,
        ipAddress: req.ip,
      });

      if (doc.documentType === "terms_of_service" && doc.projectId) {
        const project = await storage.getProject(doc.projectId);
        if (project && project.status === "tos_pending") {
          await storage.updateProject(doc.projectId, {
            status: "in_development",
            tosSignedAt: new Date(),
          });
          
          sendWorkflowEmail(client.id, doc.projectId, "tos_signed_confirmation").catch(err => 
            console.error("Failed to send TOS signed confirmation email:", err)
          );
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Sign document error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Acknowledge document (for upload documents that just need yes/no confirmation)
  app.post("/api/client/documents/:id/acknowledge", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const doc = await storage.getDocument(id);
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }

      const client = await storage.getClientByUserId(req.user!.id);
      if (!client || doc.clientId !== client.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.updateDocument(id, {
        isAcknowledged: true,
        acknowledgedAt: new Date() as any,
      });

      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: client.id,
        action: "document_acknowledged",
        description: `Acknowledged document: ${doc.title}`,
        ipAddress: req.ip,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Acknowledge document error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Download signed TOS PDF (for clients)
  app.get("/api/client/documents/:id/signed-pdf", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const doc = await storage.getDocument(id);
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }

      const client = await storage.getClientByUserId(req.user!.id);
      if (!client || doc.clientId !== client.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (doc.documentType !== "terms_of_service") {
        return res.status(400).json({ error: "This endpoint is only for Terms of Service documents" });
      }

      if (!doc.isSigned) {
        return res.status(400).json({ error: "Document has not been signed yet" });
      }

      const { generateSignedTosPdf } = await import("./tosPdfService");
      const pdfBuffer = await generateSignedTosPdf(
        client.businessLegalName,
        doc.signatureData,
        doc.signatureType,
        doc.signedAt
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="signed-tos-${client.businessLegalName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Generate client signed TOS PDF error:", error);
      res.status(500).json({ error: "Failed to generate signed PDF" });
    }
  });

  // Get upload URL for client file uploads
  app.post("/api/client/documents/upload-url", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const { filename } = req.body;
      if (!filename || typeof filename !== 'string') {
        return res.status(400).json({ error: "Filename is required" });
      }

      // Security: validate filename and extension (block executable files)
      const blockedExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.dll', '.com', '.scr', '.vbs', '.js', '.jar', '.php', '.py', '.rb', '.pl'];
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255);
      const ext = sanitizedFilename.toLowerCase().slice(sanitizedFilename.lastIndexOf('.'));
      
      if (blockedExtensions.includes(ext)) {
        return res.status(400).json({ error: "This file type is not allowed for security reasons" });
      }

      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const { uploadURL, objectPath } = await objectStorageService.getObjectEntityUploadURL(sanitizedFilename);
      res.json({ uploadURL, objectPath });
    } catch (error) {
      console.error("Get client upload URL error:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Save client uploaded document
  app.post("/api/client/documents/upload", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const { title, fileUrl, description } = req.body;
      if (!title || typeof title !== 'string' || !fileUrl || typeof fileUrl !== 'string') {
        return res.status(400).json({ error: "Title and file are required" });
      }

      // Security: validate fileUrl is from our object storage
      if (!fileUrl.startsWith('/objects/')) {
        return res.status(400).json({ error: "Invalid file URL" });
      }

      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      const project = await storage.getProjectsByClientId(client.id);
      const projectId = project[0]?.id;

      const document = await storage.createDocument({
        clientId: client.id,
        projectId: projectId || null,
        title: title.slice(0, 255),
        documentType: "upload",
        description: (description || `Uploaded by client: ${req.user!.firstName} ${req.user!.lastName}`).slice(0, 1000),
        fileUrl,
        requiresSignature: false,
        requiresAcknowledgment: false,
        visibleToClient: true,
        signatureFields: [],
      });

      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: client.id,
        action: "client_document_upload",
        description: `Client uploaded document: ${title}`,
        ipAddress: req.ip,
      });

      // Notify admin about client upload
      await notifyAdminActivity(
        client.id,
        "document_uploaded",
        `Client uploaded a new document: "${title}"`
      );

      res.json(document);
    } catch (error) {
      console.error("Client document upload error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/client/messages", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.json([]);
      }
      const messagesList = await storage.getMessagesByClientId(client.id);
      
      const messagesWithSender = await Promise.all(
        messagesList.map(async (msg) => {
          const sender = await storage.getUser(msg.senderId);
          return { ...msg, sender: sender ? { firstName: sender.firstName, lastName: sender.lastName } : null };
        })
      );
      
      res.json(messagesWithSender);
    } catch (error) {
      console.error("Client messages error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/client/messages", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const parsed = sendMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid data" });
      }
      const { messageText, category, projectId } = parsed.data;
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      const message = await storage.createMessage({
        clientId: client.id,
        projectId: projectId || undefined,
        senderId: req.user!.id,
        senderType: "client",
        messageText,
        category: category || "general",
      });

      // Send real-time WebSocket notification to admins
      notifyNewMessage(client.id, {
        senderType: "client",
        senderName: `${req.user!.firstName} ${req.user!.lastName}`,
        preview: messageText.substring(0, 100),
      });

      // Notify admin via email
      await notifyAdminActivity(
        client.id,
        "message_sent",
        `New message: "${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}"`
      );

      res.json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/client/profile", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid data" });
      }
      const { firstName, lastName, phone } = parsed.data;
      await storage.updateUser(req.user!.id, { firstName, lastName, phone });
      res.json({ success: true });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/client/questionnaire", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      const questionnaire = await storage.getQuestionnaireByClientId(client.id);
      if (!questionnaire) {
        return res.json({ status: "not_started", responses: {} });
      }
      // Return questionnaire with responses extracted for frontend compatibility
      const status = questionnaire.submittedAt ? "completed" : "in_progress";
      res.json({ 
        status,
        responses: {
          businessDescription: questionnaire.businessDescription || "",
          targetAudience: questionnaire.targetAudienceDescription || "",
          websiteGoal: questionnaire.primaryGoal || "",
          siteSize: questionnaire.requiredPages || "",
          designStyle: questionnaire.stylePreference || "",
          features: questionnaire.specialFeatures ? questionnaire.specialFeatures.split(",").map((f: string) => f.trim()) : [],
          likedWebsites: questionnaire.inspirationWebsites || "",
          preferredColors: questionnaire.preferredColors || "",
          additionalNotes: questionnaire.additionalNotes || "",
        }
      });
    } catch (error) {
      console.error("Get questionnaire error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/client/questionnaire", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const projects = await storage.getProjectsByClientId(client.id);
      if (projects.length === 0) {
        return res.status(404).json({ error: "No project found for this client" });
      }
      
      const project = projects[0];
      const { status, responses } = req.body;
      
      let questionnaire = await storage.getQuestionnaireByClientId(client.id);
      
      // Map frontend response fields to database columns
      const updateData: any = {
        businessDescription: responses?.businessDescription || null,
        targetAudienceDescription: responses?.targetAudience || null,
        primaryGoal: responses?.websiteGoal || null,
        requiredPages: responses?.siteSize || null,
        stylePreference: responses?.designStyle || null,
        specialFeatures: Array.isArray(responses?.features) ? responses.features.join(", ") : null,
        inspirationWebsites: responses?.likedWebsites || null,
        preferredColors: responses?.preferredColors || null,
        additionalNotes: responses?.additionalNotes || null,
      };
      if (status === "completed") {
        updateData.submittedAt = new Date();
      }
      
      if (questionnaire) {
        questionnaire = await storage.updateQuestionnaire(questionnaire.id, updateData);
      } else {
        questionnaire = await storage.createQuestionnaire({
          projectId: project.id,
          clientId: client.id,
          ...updateData,
        });
      }

      if (status === "completed") {
        const projectUpdates: any = {
          questionnaireStatus: "completed",
          questionnaireCompletedAt: new Date(),
        };
        
        if (project.status === "created" || project.status === "questionnaire_pending") {
          projectUpdates.status = "tos_pending";
        }
        
        await storage.updateProject(project.id, projectUpdates);
        
        await storage.createActivityLog({
          clientId: client.id,
          userId: req.user!.id,
          action: "questionnaire_completed",
          description: "Client completed project questionnaire",
        });
        
        if (project.status === "created" || project.status === "questionnaire_pending") {
          sendWorkflowEmail(client.id, project.id, "tos_ready").catch(err => 
            console.error("Failed to send TOS ready email:", err)
          );
        }
      }

      res.json(questionnaire);
    } catch (error) {
      console.error("Update questionnaire error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ ADMIN ROUTES ============

  app.get("/api/admin/dashboard", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getAdminStats();
      const projectsList = await storage.getProjects();
      const recentProjects = projectsList.slice(0, 5);
      
      const projectsWithClients = await Promise.all(
        recentProjects.map(async (project) => {
          const client = await storage.getClient(project.clientId);
          return { 
            ...project, 
            client,
            progressPercentage: calculateProjectProgress(project.status),
          };
        })
      );

      const overduePayments = await storage.getOverduePayments();
      const overdueWithClients = await Promise.all(
        overduePayments.map(async (payment: any) => {
          const client = await storage.getClient(payment.clientId);
          return { ...payment, client };
        })
      );

      const recentActivity = await storage.getActivityLogs();

      res.json({
        stats,
        recentProjects: projectsWithClients,
        overduePayments: overdueWithClients,
        recentActivity,
      });
    } catch (error) {
      console.error("Admin dashboard error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/clients", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const adminId = req.user!.id;
      const clientsList = await storage.getClients();
      
      // Get access levels for this admin
      const accessibleClients = await storage.getAccessibleClientIds(adminId);
      const accessMap = new Map(accessibleClients.map(a => [a.clientId, a.accessLevel]));
      
      const clientsWithUsers = await Promise.all(
        clientsList.map(async (client) => {
          const user = client.userId ? await storage.getUser(client.userId) : null;
          const isOwner = client.createdBy === adminId;
          const accessLevel = accessMap.get(client.id) || "view";
          
          return { 
            ...client, 
            user: user ? { firstName: user.firstName, lastName: user.lastName, email: user.email } : null,
            isOwner,
            editable: isOwner || accessLevel === "edit",
          };
        })
      );
      res.json(clientsWithUsers);
    } catch (error) {
      console.error("Get clients error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/clients", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      console.log("Received client data:", JSON.stringify(req.body));
      const parsed = createClientRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        console.log("Validation errors:", JSON.stringify(parsed.error.errors));
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid data" });
      }
      const { 
        businessLegalName, businessEmail, businessPhone, industry, firstName, lastName, email,
        addressStreet, addressCity, addressState, addressZip, existingWebsite,
        secondaryContactName, secondaryContactEmail, secondaryContactPhone, secondaryContactRelationship
      } = parsed.data;

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "A user with this email address already exists. Please use a different email." });
      }

      const tempPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const user = await storage.createUser({
        email,
        passwordHash,
        role: "client",
        firstName,
        lastName,
        mustChangePassword: true,
      });

      const client = await storage.createClient({
        userId: user.id,
        businessLegalName,
        businessEmail: (businessEmail && businessEmail.trim()) ? businessEmail : email,
        businessPhone,
        industry,
        addressStreet,
        addressCity,
        addressState,
        addressZip,
        existingWebsite,
        secondaryContactName,
        secondaryContactEmail: (secondaryContactEmail && secondaryContactEmail.trim()) ? secondaryContactEmail : undefined,
        secondaryContactPhone,
        secondaryContactRelationship,
        createdBy: req.user!.id,
      });

      // Auto-create project for this client (1 client = 1 website)
      const project = await storage.createProject({
        clientId: client.id,
        projectType: "new_website",
        totalCost: "0.00",
        status: "questionnaire_pending",
        questionnaireStatus: "not_started",
      });

      // Auto-create questionnaire placeholder for the project
      await storage.createQuestionnaire({
        clientId: client.id,
        projectId: project.id,
      });

      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: client.id,
        action: "client_created",
        description: `Created client: ${businessLegalName} with project`,
        ipAddress: req.ip,
      });

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      sendWelcomeEmail(email, firstName, tempPassword, `${baseUrl}/login`).catch(console.error);

      res.json({ ...client, user: { firstName, lastName, email }, tempPassword });
    } catch (error) {
      console.error("Create client error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/clients/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      const user = client.userId ? await storage.getUser(client.userId) : null;
      const projects = await storage.getProjectsByClientId(id);
      const payments = await storage.getPaymentsByClientId(id);
      const documents = await storage.getDocumentsByClientId(id);
      const messages = await storage.getMessagesByClientId(id);
      const activity = await storage.getActivityLogsByClientId(id);
      const uploads = await storage.getClientUploadsByClientId(id);
      
      // Check edit permissions
      const isOwner = client.createdBy === adminId;
      const canEdit = await storage.canAdminEditClient(adminId, id);
      
      // Get owner info
      const owner = client.createdBy ? await storage.getUser(client.createdBy) : null;
      
      // Add progress percentage to each project
      const projectsWithProgress = projects.map(p => ({
        ...p,
        progressPercentage: calculateProjectProgress(p.status),
      }));
      
      res.json({
        ...client,
        user: user ? { firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone } : null,
        projects: projectsWithProgress,
        payments,
        documents,
        messages,
        activity,
        uploads,
        isOwner,
        editable: canEdit,
        owner: owner ? { id: owner.id, firstName: owner.firstName, lastName: owner.lastName } : null,
      });
    } catch (error) {
      console.error("Get client error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Download questionnaire answers as PDF
  app.get("/api/admin/clients/:id/questionnaire/pdf", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      const questionnaire = await storage.getQuestionnaireByClientId(id);
      if (!questionnaire) {
        return res.status(404).json({ error: "Questionnaire not found" });
      }

      const projects = await storage.getProjectsByClientId(id);
      if (projects.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }

      const user = client.userId ? await storage.getUser(client.userId) : null;
      const contactName = user ? `${user.firstName} ${user.lastName}` : "N/A";

      // Map questionnaire columns to the responses format expected by the PDF service
      const responses = {
        businessDescription: questionnaire.businessDescription || undefined,
        targetAudience: questionnaire.targetAudienceDescription || undefined,
        websiteGoal: questionnaire.primaryGoal || undefined,
        siteSize: questionnaire.requiredPages || undefined,
        designStyle: questionnaire.stylePreference || undefined,
        features: questionnaire.specialFeatures ? [questionnaire.specialFeatures] : undefined,
        likedWebsites: questionnaire.inspirationWebsites || undefined,
        preferredColors: questionnaire.preferredColors || undefined,
        additionalNotes: questionnaire.additionalNotes || undefined,
      };

      const pdfBuffer = await generateQuestionnairePdf({
        responses,
        client,
        contactName,
        submittedAt: questionnaire.submittedAt,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="questionnaire-${client.businessLegalName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Download questionnaire PDF error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Generate and preview TOS PDF for a client (returns data URL for signature editor)
  app.get("/api/admin/clients/:id/tos/preview", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      const projects = await storage.getProjectsByClientId(id);
      if (projects.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }

      const user = client.userId ? await storage.getUser(client.userId) : null;
      const contactName = user ? `${user.firstName} ${user.lastName}` : "N/A";

      const tosResult = await generateTosPdf({
        client,
        project: projects[0],
        contactName,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="tos-preview-${client.businessLegalName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf"`
      );
      res.send(tosResult.buffer);
    } catch (error) {
      console.error("Generate TOS preview error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Generate and preview TOS PDF for a client
  app.get("/api/admin/clients/:id/tos/pdf", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      const projects = await storage.getProjectsByClientId(id);
      if (projects.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }

      const user = client.userId ? await storage.getUser(client.userId) : null;
      const contactName = user ? `${user.firstName} ${user.lastName}` : "N/A";

      const tosResult = await generateTosPdf({
        client,
        project: projects[0],
        contactName,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="tos-${client.businessLegalName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf"`
      );
      res.send(tosResult.buffer);
    } catch (error) {
      console.error("Generate TOS PDF error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create TOS document from generated PDF and send to client
  app.post("/api/admin/clients/:id/tos/send", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { signatureFields: customSignatureFields } = req.body;
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      const projects = await storage.getProjectsByClientId(id);
      if (projects.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }

      const project = projects[0];
      const user = client.userId ? await storage.getUser(client.userId) : null;
      const contactName = user ? `${user.firstName} ${user.lastName}` : "N/A";

      const tosResult = await generateTosPdf({
        client,
        project,
        contactName,
      });

      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const sanitizedBusinessName = client.businessLegalName.replace(/[^a-zA-Z0-9]/g, "_");
      const { objectPath } = await objectStorageService.uploadBuffer(
        tosResult.buffer,
        `tos-${sanitizedBusinessName}.pdf`,
        "application/pdf"
      );

      const signatureFields = customSignatureFields && customSignatureFields.length > 0 
        ? customSignatureFields 
        : [
            {
              id: "client-signature",
              page: tosResult.signatureField.page,
              x: tosResult.signatureField.x,
              y: tosResult.signatureField.y,
              width: tosResult.signatureField.width,
              height: tosResult.signatureField.height,
              label: "Client Signature",
            },
          ];

      const document = await storage.createDocument({
        clientId: id,
        projectId: project.id,
        title: `Terms of Service - ${client.businessLegalName}`,
        documentType: "terms_of_service",
        description: `Terms of Service agreement for ${client.businessLegalName}, dated ${new Date().toLocaleDateString()}`,
        fileUrl: objectPath,
        fileName: `tos-${sanitizedBusinessName}.pdf`,
        requiresSignature: true,
        visibleToClient: true,
        signatureFields: JSON.stringify(signatureFields),
      });

      await storage.updateProject(project.id, { status: "tos_pending" });

      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: id,
        action: "tos_sent",
        description: `Terms of Service document sent to ${client.businessLegalName}`,
        ipAddress: req.ip,
      });

      sendWorkflowEmail(id, project.id, "tos_ready").catch(err =>
        console.error("Failed to send TOS ready email:", err)
      );

      notifyDocumentUpdate(id, {
        documentId: document.id,
        title: document.title,
        requiresSignature: true,
      });

      res.json({ success: true, document });
    } catch (error) {
      console.error("Send TOS error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Download signed TOS PDF with embedded signature
  app.get("/api/admin/clients/:id/tos/signed-pdf", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      const projects = await storage.getProjectsByClientId(id);
      if (projects.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }

      const project = projects[0];
      
      // Check if TOS has been signed
      const signedStatuses = ["tos_signed", "in_development", "hosting_setup", "deployed", "delivery", "client_review", "completed"];
      if (!signedStatuses.includes(project.status || "")) {
        return res.status(400).json({ error: "TOS has not been signed yet" });
      }

      // Get the TOS document to find the signature
      const documents = await storage.getDocumentsByClientId(id);
      const tosDocument = documents.find(doc => doc.documentType === "terms_of_service" && doc.isSigned);
      
      if (!tosDocument || !tosDocument.signatureData) {
        return res.status(404).json({ error: "Signed TOS document not found" });
      }

      const user = client.userId ? await storage.getUser(client.userId) : null;
      const contactName = user ? `${user.firstName} ${user.lastName}` : "N/A";

      const pdfBuffer = await generateSignedTosPdf({
        client,
        project,
        contactName,
        signatureData: tosDocument.signatureData,
        signatureType: (tosDocument.signatureType as "drawn" | "typed") || "typed",
        signedAt: tosDocument.signedAt || new Date(),
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="tos-signed-${client.businessLegalName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Generate signed TOS PDF error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/clients/:id/reset-password", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const client = await storage.getClient(id);
      if (!client || !client.userId) {
        return res.status(404).json({ error: "Client not found" });
      }

      const tempPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      await storage.updateUser(client.userId, { passwordHash, mustChangePassword: true });

      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: id,
        action: "password_reset",
        description: "Admin reset client password",
        ipAddress: req.ip,
      });

      res.json({ success: true, tempPassword });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/clients/:id/send-reminder", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { type } = req.body;
      
      if (!type || !["questionnaire", "tos"].includes(type)) {
        return res.status(400).json({ error: "Invalid reminder type. Must be 'questionnaire' or 'tos'" });
      }

      const client = await storage.getClient(id);
      if (!client || !client.userId) {
        return res.status(404).json({ error: "Client not found" });
      }

      const projects = await storage.getProjectsByClientId(id);
      if (projects.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }

      const project = projects[0];

      if (type === "questionnaire") {
        sendWorkflowEmail(id, project.id, "questionnaire_pending").catch(err =>
          console.error("Failed to send questionnaire reminder:", err)
        );

        await storage.createActivityLog({
          userId: req.user!.id,
          clientId: id,
          action: "reminder_sent",
          description: "Questionnaire completion reminder sent to client",
          ipAddress: req.ip,
        });
      } else if (type === "tos") {
        sendWorkflowEmail(id, project.id, "tos_ready").catch(err =>
          console.error("Failed to send TOS reminder:", err)
        );

        await storage.createActivityLog({
          userId: req.user!.id,
          clientId: id,
          action: "reminder_sent",
          description: "Terms of Service signing reminder sent to client",
          ipAddress: req.ip,
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Send reminder error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/clients/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Only owner can delete clients
      if (client.createdBy !== req.user!.id) {
        return res.status(403).json({ error: "Only the owner can delete this client" });
      }

      await storage.deleteClient(id);

      res.json({ success: true, message: "Client and all associated data deleted successfully" });
    } catch (error) {
      console.error("Delete client error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Close client account (archive with details)
  app.post("/api/admin/clients/:id/close", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { reasonForClosing, finalNotes, accountStatus, projectType, budget, timeline } = req.body;
      
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Check edit permissions
      const canEdit = await storage.canAdminEditClient(req.user!.id, id);
      if (!canEdit) {
        return res.status(403).json({ error: "You don't have permission to close this client account" });
      }

      // Update the client status to closed/archived
      const closureNotes = `Account closed by admin. Status: ${accountStatus}. Reason: ${reasonForClosing}. ${finalNotes ? `Notes: ${finalNotes}` : ''}`;
      
      await storage.updateClient(id, {
        status: accountStatus === 'cancelled' ? 'cancelled' : 'completed',
        notes: closureNotes,
      });

      // Update all projects to completed or cancelled
      const projects = await storage.getProjectsByClientId(id);
      for (const project of projects) {
        await storage.updateProject(project.id, {
          status: accountStatus === 'cancelled' ? 'cancelled' : 'completed',
        });
      }

      // Deactivate the user account
      const user = await storage.getUser(client.userId);
      if (user) {
        await storage.updateUser(user.id, { isActive: false });
      }

      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: id,
        action: "account_closed",
        description: `Client account closed. Reason: ${reasonForClosing}`,
        ipAddress: req.ip,
      });

      res.json({ success: true, message: "Client account closed successfully" });
    } catch (error) {
      console.error("Close client account error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/payments", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { clientId, description, amount, dueDate } = req.body;
      if (!clientId || !description || !amount) {
        return res.status(400).json({ error: "Client ID, description, and amount are required" });
      }

      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Check edit permissions
      const canEdit = await canAdminEditClientHelper(req.user!.id, clientId);
      if (!canEdit) {
        return res.status(403).json({ error: "You don't have edit permissions for this client" });
      }

      const payment = await storage.createPayment({
        clientId,
        description,
        amount: amount.toString(),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "pending",
      });

      await storage.createActivityLog({
        userId: req.user!.id,
        clientId,
        action: "payment_created",
        description: `Created payment: ${description} - $${amount}`,
        ipAddress: req.ip,
      });

      notifyPaymentUpdate(clientId, {
        paymentId: payment.id,
        description,
        amount,
        status: "pending",
      });

      // Notify client about new payment request
      await notifyClientActivity(
        clientId,
        "payment_created",
        `A new payment of $${amount} is due${dueDate ? ` by ${new Date(dueDate).toLocaleDateString()}` : ""}: ${description}`
      );

      res.json(payment);
    } catch (error) {
      console.error("Create payment error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete a payment
  app.delete("/api/admin/payments/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const payment = await storage.getPayment(id);
      
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      // Check edit permissions
      const canEdit = await canAdminEditClientHelper(req.user!.id, payment.clientId);
      if (!canEdit) {
        return res.status(403).json({ error: "You don't have edit permissions for this client" });
      }

      // Don't allow deleting paid payments
      if (payment.status === "paid") {
        return res.status(400).json({ error: "Cannot delete a paid payment" });
      }

      await storage.deletePayment(id);

      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: payment.clientId,
        action: "payment_deleted",
        description: `Deleted payment: ${payment.description} - $${payment.amount}`,
        ipAddress: req.ip,
      });

      res.json({ success: true, message: "Payment deleted" });
    } catch (error) {
      console.error("Delete payment error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/documents", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { clientId, title, documentType, description, fileUrl, requiresSignature, visibleToClient, signatureFields } = req.body;
      if (!clientId || !title) {
        return res.status(400).json({ error: "Client ID and title are required" });
      }

      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Check edit permissions
      const canEdit = await canAdminEditClientHelper(req.user!.id, clientId);
      if (!canEdit) {
        return res.status(403).json({ error: "You don't have edit permissions for this client" });
      }

      // Extract filename from URL if provided
      let fileName = null;
      if (fileUrl) {
        try {
          const urlObj = new URL(fileUrl);
          fileName = urlObj.pathname.split('/').pop() || "document.pdf";
        } catch {
          fileName = "document.pdf";
        }
      }

      const document = await storage.createDocument({
        clientId,
        title,
        documentType: documentType || "other",
        description,
        fileUrl: fileUrl || null,
        fileName,
        requiresSignature: requiresSignature || false,
        visibleToClient: visibleToClient !== false,
        signatureFields: signatureFields ? JSON.stringify(signatureFields) : null,
      });

      await storage.createActivityLog({
        userId: req.user!.id,
        clientId,
        action: "document_created",
        description: `Created document: ${title}`,
        ipAddress: req.ip,
      });

      if (visibleToClient) {
        notifyDocumentUpdate(clientId, {
          documentId: document.id,
          title,
          requiresSignature: requiresSignature || false,
        });

        // Notify client about new document
        await notifyClientActivity(
          clientId,
          requiresSignature ? "document_ready" : "document_uploaded",
          requiresSignature 
            ? `A document "${title}" is ready for your review and signature.`
            : `A new document "${title}" has been added to your portal.`
        );
      }

      res.json(document);
    } catch (error) {
      console.error("Create document error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete a document
  app.delete("/api/admin/documents/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const doc = await storage.getDocument(id);
      
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Check edit permissions
      const canEdit = await canAdminEditClientHelper(req.user!.id, doc.clientId);
      if (!canEdit) {
        return res.status(403).json({ error: "You don't have edit permissions for this client" });
      }

      await storage.deleteDocument(id);

      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: doc.clientId,
        action: "document_deleted",
        description: `Deleted document: ${doc.title}`,
        ipAddress: req.ip,
      });

      res.json({ success: true, message: "Document deleted" });
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Save signature from document to client profile
  app.post("/api/admin/documents/:id/save-signature", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const doc = await storage.getDocument(id);
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Check edit permissions
      const canEdit = await canAdminEditClientHelper(req.user!.id, doc.clientId);
      if (!canEdit) {
        return res.status(403).json({ error: "You don't have edit permissions for this client" });
      }

      if (!doc.isSigned || !doc.signatureData) {
        return res.status(400).json({ error: "Document is not signed" });
      }

      await storage.updateClient(doc.clientId, {
        savedSignature: doc.signatureData,
        savedSignatureType: doc.signatureType,
        signatureSavedAt: new Date() as any,
      });

      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: doc.clientId,
        action: "signature_saved",
        description: `Saved signature from document: ${doc.title} to client profile`,
        ipAddress: req.ip,
      });

      res.json({ success: true, message: "Signature saved to client profile" });
    } catch (error) {
      console.error("Save signature error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/projects", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const projectsList = await storage.getProjects();
      const projectsWithClients = await Promise.all(
        projectsList.map(async (project) => {
          const client = await storage.getClient(project.clientId);
          return { ...project, client };
        })
      );
      res.json(projectsWithClients);
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/projects", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const parsed = createProjectRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid data" });
      }
      
      // Check edit permissions before creating project
      const canEdit = await canAdminEditClientHelper(req.user!.id, parsed.data.clientId);
      if (!canEdit) {
        return res.status(403).json({ error: "You don't have edit permissions for this client" });
      }
      
      const project = await storage.createProject(parsed.data);

      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: project.clientId,
        action: "project_created",
        description: `Created project for client`,
        ipAddress: req.ip,
      });

      res.json(project);
    } catch (error) {
      console.error("Create project error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // General project update endpoint
  app.patch("/api/admin/projects/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const existingProject = await storage.getProject(id);
      if (!existingProject) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Check edit permissions
      const canEdit = await canAdminEditClientHelper(req.user!.id, existingProject.clientId);
      if (!canEdit) {
        return res.status(403).json({ error: "You don't have edit permissions for this client" });
      }

      const project = await storage.updateProject(id, req.body);
      if (!project) {
        return res.status(404).json({ error: "Failed to update project" });
      }

      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: project.clientId,
        action: "project_updated",
        description: `Updated project settings`,
        ipAddress: req.ip,
      });

      res.json(project);
    } catch (error) {
      console.error("Update project error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/admin/projects/:id/status", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const parsed = updateProjectStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid data" });
      }
      const { status } = parsed.data;
      const { onHoldReason, resumptionDate } = req.body;

      const existingProject = await storage.getProject(id);
      if (!existingProject) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Check edit permissions
      const canEdit = await canAdminEditClientHelper(req.user!.id, existingProject.clientId);
      if (!canEdit) {
        return res.status(403).json({ error: "You don't have edit permissions for this client" });
      }
      
      const oldStatus = existingProject.status;
      
      // Deposit gating: require deposit payment before advancing to development
      const developmentPhases = ["development", "hosting_setup", "ready_for_delivery", "completed"];
      if (developmentPhases.includes(status) && !developmentPhases.includes(oldStatus)) {
        const skipDepositCheck = req.body.skipDepositCheck === true; // Admin can override
        if (!skipDepositCheck) {
          const depositPaid = await storage.isDepositPaidForProject(id);
          if (!depositPaid) {
            return res.status(400).json({ 
              error: "Deposit payment required", 
              message: "The deposit must be paid before advancing to the development phase. Set skipDepositCheck: true to override." 
            });
          }
        }
      }
      
      // Prepare update data, including warranty dates if completing project
      const updateData: any = { status };
      if (status === "completed" && oldStatus !== "completed") {
        const warrantyStart = new Date();
        const warrantyEnd = new Date();
        warrantyEnd.setDate(warrantyEnd.getDate() + 25); // 25-day warranty period
        updateData.completedAt = warrantyStart;
        updateData.warrantyStartDate = warrantyStart;
        updateData.warrantyEndDate = warrantyEnd;
        updateData.warrantyReminderSent = false;
        updateData.warrantyExpiryNotified = false;
      }
      
      // Handle on-hold status with notes and resumption date
      if (status === "on_hold") {
        updateData.onHoldReason = onHoldReason || null;
        updateData.onHoldAt = new Date();
        updateData.onHoldByUserId = req.user!.id;
        updateData.resumptionDate = resumptionDate || null;
      } else if (oldStatus === "on_hold" && status !== "on_hold") {
        // Resuming from on-hold - clear on-hold fields
        updateData.onHoldReason = null;
        updateData.onHoldAt = null;
        updateData.onHoldByUserId = null;
        updateData.resumptionDate = null;
      }

      const project = await storage.updateProject(id, updateData);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: project.clientId,
        action: "project_status_updated",
        description: `Updated project status to ${status}`,
        ipAddress: req.ip,
      });
      
      // Auto-create final payment when transitioning to awaiting_final_payment
      if (status === "awaiting_final_payment" && oldStatus !== "awaiting_final_payment") {
        // Check if a final payment already exists for this project
        const existingPayments = await storage.getPaymentsByProjectId(id);
        const hasFinalPayment = existingPayments.some(p => p.paymentType === "final" && p.status === "pending");
        
        if (!hasFinalPayment) {
          // Calculate final payment amount (50% of total cost, or use remaining balance)
          const totalCost = parseFloat(project.totalCost || "0");
          const paidAmount = existingPayments
            .filter(p => p.status === "paid")
            .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
          const finalAmount = Math.max(totalCost - paidAmount, totalCost / 2);
          
          // Only create payment if there's an amount to pay
          if (finalAmount > 0) {
            const paymentNumber = existingPayments.length + 1;
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days
            
            await storage.createPayment({
              projectId: id,
              clientId: project.clientId,
              paymentNumber,
              amount: finalAmount.toFixed(2),
              description: "Final Payment - Website Delivery",
              paymentType: "final",
              status: "pending",
              dueDate: dueDate.toISOString().split('T')[0],
            });
            
            console.log(`[Payments] Auto-created final payment of $${finalAmount.toFixed(2)} for project ${id}`);
          }
        }
      }
      
      // Send warranty start email if project just completed
      if (status === "completed" && oldStatus !== "completed") {
        const client = await storage.getClient(project.clientId);
        if (client?.userId) {
          const user = await storage.getUser(client.userId);
          if (user?.email && project.warrantyEndDate) {
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const projectName = project.projectType === "other" 
              ? project.projectTypeOther || "Custom Project" 
              : project.projectType.replace(/_/g, " ");
            import("./emailService").then(emailService => {
              emailService.sendWarrantyStartEmail(
                user.email,
                user.firstName || "Client",
                projectName,
                project.warrantyEndDate!,
                `${baseUrl}/client`
              ).catch(console.error);
            }).catch(console.error);
          }
        }
      }

      const client = await storage.getClient(project.clientId);
      const projectName = project.projectType === "other" 
        ? project.projectTypeOther || "Custom Project" 
        : project.projectType.replace(/_/g, " ");
      
      // Send real-time WebSocket notification
      notifyProjectStatusUpdate(project.clientId, projectName, oldStatus, status);
      
      if (client?.userId) {
        const user = await storage.getUser(client.userId);
        if (user && client.businessEmail) {
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          sendProjectStatusUpdateEmail(
            client.businessEmail,
            user.firstName,
            projectName,
            oldStatus,
            status,
            `${baseUrl}/client/dashboard`
          ).catch(console.error);
        }
      }

      res.json(project);
    } catch (error) {
      console.error("Update project status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Send welcome email to client with login credentials
  app.post("/api/admin/projects/:id/send-welcome", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id: projectId } = req.params;
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const client = await storage.getClient(project.clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      // Check edit permissions
      const canEdit = await canAdminEditClientHelper(req.user!.id, project.clientId);
      if (!canEdit) {
        return res.status(403).json({ error: "You don't have edit permissions for this client" });
      }
      
      const user = client.userId ? await storage.getUser(client.userId) : null;
      if (!user) {
        return res.status(400).json({ error: "No user account associated with this client" });
      }
      
      // Generate a temporary password if needed (user should already have one from creation)
      const tempPassword = Math.random().toString(36).slice(-8) + "A1!";
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      
      // Update user with new temp password and set mustChangePassword
      await storage.updateUser(user.id, {
        passwordHash,
        mustChangePassword: true,
      } as any);
      
      // Send welcome email using the workflow email function
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      await sendWelcomeEmail(
        user.email,
        user.firstName,
        tempPassword,
        `${baseUrl}/login`
      );
      
      // Update project status to created (welcome email sent)
      await storage.updateProject(projectId, { status: "created" });
      
      // Also update to questionnaire_pending
      await storage.updateProject(projectId, { status: "questionnaire_pending" });
      
      // Log the activity
      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: project.clientId,
        action: "welcome_email_sent",
        description: "Sent welcome email with login credentials",
        ipAddress: req.ip,
      });
      
      res.json({ success: true, message: "Welcome email sent successfully" });
    } catch (error) {
      console.error("Send welcome email error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Send reminder email for questionnaire or other actions
  app.post("/api/admin/projects/:id/send-reminder", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id: projectId } = req.params;
      const { type } = req.body; // "questionnaire", "quote", "tos", "payment"
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const client = await storage.getClient(project.clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      // Check edit permissions
      const canEdit = await canAdminEditClientHelper(req.user!.id, project.clientId);
      if (!canEdit) {
        return res.status(403).json({ error: "You don't have edit permissions for this client" });
      }
      
      // Send appropriate reminder based on type
      await sendWorkflowEmail(client.id, projectId, type || project.status);
      
      // Log the activity
      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: project.clientId,
        action: "reminder_sent",
        description: `Sent ${type || "workflow"} reminder email`,
        ipAddress: req.ip,
      });
      
      res.json({ success: true, message: "Reminder sent successfully" });
    } catch (error) {
      console.error("Send reminder error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/analytics", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const [stats, projectsByStatus, revenueByMonth, clientAcquisition, projectMetrics] = await Promise.all([
        storage.getAdminStats(),
        storage.getProjectsByStatus(),
        storage.getRevenueByMonth(),
        storage.getClientAcquisitionByMonth(),
        storage.getProjectCompletionMetrics(),
      ]);

      const clientsList = await storage.getClients();
      const topClients = await Promise.all(
        clientsList.slice(0, 5).map(async (client) => {
          const projectsList = await storage.getProjectsByClientId(client.id);
          const totalValue = projectsList.reduce((sum, p) => sum + parseFloat(p.totalCost || "0"), 0);
          return { ...client, projectCount: projectsList.length, totalValue };
        })
      );
      topClients.sort((a, b) => b.totalValue - a.totalValue);

      const cancelledCount = projectsByStatus.find(p => p.status === "cancelled")?.count || 0;

      // Get quote metrics
      const allQuotes = await storage.getQuotes();
      const quoteMetrics = {
        total: allQuotes.length,
        draft: allQuotes.filter(q => q.status === "draft").length,
        sent: allQuotes.filter(q => q.status === "sent" || q.status === "viewed").length,
        approved: allQuotes.filter(q => q.status === "approved").length,
        rejected: allQuotes.filter(q => q.status === "rejected").length,
        totalValue: allQuotes.filter(q => q.status === "approved").reduce((sum, q) => sum + parseFloat(q.totalAmount || "0"), 0),
        conversionRate: allQuotes.filter(q => ["approved", "rejected"].includes(q.status)).length > 0
          ? Math.round((allQuotes.filter(q => q.status === "approved").length / allQuotes.filter(q => ["approved", "rejected"].includes(q.status)).length) * 100)
          : 0,
      };

      // Get admin leaderboard
      const admins = await storage.getAdminUsers();
      const leaderboard = await Promise.all(
        admins.map(async (admin) => {
          const adminClients = clientsList.filter(c => c.assignedTo === admin.id);
          const adminClientIds = adminClients.map(c => c.id);
          
          // Get projects for admin's clients
          const adminProjects = (await Promise.all(
            adminClientIds.map(clientId => storage.getProjectsByClientId(clientId))
          )).flat();
          
          // Get payments for admin's clients
          const adminPayments = (await Promise.all(
            adminClientIds.map(clientId => storage.getPaymentsByClientId(clientId))
          )).flat();
          
          const paidPayments = adminPayments.filter(p => p.status === "paid");
          const totalRevenue = paidPayments.reduce((sum, p) => sum + parseFloat(p.paidAmount || p.amount || "0"), 0);
          const completedProjects = adminProjects.filter(p => p.status === "completed").length;
          
          return {
            id: admin.id,
            name: `${admin.firstName} ${admin.lastName}`,
            email: admin.email,
            clientCount: adminClients.length,
            projectCount: adminProjects.length,
            completedProjects,
            totalRevenue,
            activeProjects: adminProjects.filter(p => !["completed", "cancelled", "on_hold"].includes(p.status)).length,
          };
        })
      );
      leaderboard.sort((a, b) => b.totalRevenue - a.totalRevenue);

      // Get payments overview
      const allPayments = await storage.getAllPayments();
      const paymentMetrics = {
        totalPaid: allPayments.filter(p => p.status === "paid").reduce((sum, p) => sum + parseFloat(p.paidAmount || p.amount || "0"), 0),
        totalPending: allPayments.filter(p => p.status === "pending").reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0),
        totalOverdue: allPayments.filter(p => p.status === "overdue").reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0),
        pendingCount: allPayments.filter(p => p.status === "pending").length,
        overdueCount: allPayments.filter(p => p.status === "overdue").length,
      };

      // Client sources breakdown
      const clientSources = clientsList.reduce((acc: Record<string, number>, client) => {
        const source = client.source || "unknown";
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});

      res.json({
        stats,
        projectsByStatus,
        topClients,
        revenueByMonth,
        clientAcquisition,
        projectMetrics,
        cancelledProjects: cancelledCount,
        quoteMetrics,
        leaderboard,
        paymentMetrics,
        clientSources,
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Per-admin analytics endpoint
  app.get("/api/admin/analytics/:adminId", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { adminId } = req.params;
      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== "admin") {
        return res.status(404).json({ error: "Admin not found" });
      }

      const allClients = await storage.getClients();
      const adminClients = allClients.filter(c => c.assignedTo === adminId);
      const adminClientIds = adminClients.map(c => c.id);

      // Get all projects for admin's clients
      const adminProjects = (await Promise.all(
        adminClientIds.map(clientId => storage.getProjectsByClientId(clientId))
      )).flat();

      // Get all payments for admin's clients
      const adminPayments = (await Promise.all(
        adminClientIds.map(clientId => storage.getPaymentsByClientId(clientId))
      )).flat();

      // Get all quotes created by this admin
      const allQuotes = await storage.getQuotes();
      const adminQuotes = allQuotes.filter(q => q.createdBy === adminId);

      // Calculate stats
      const paidPayments = adminPayments.filter(p => p.status === "paid");
      const pendingPayments = adminPayments.filter(p => p.status === "pending");
      const overduePayments = adminPayments.filter(p => p.status === "overdue");

      const stats = {
        totalClients: adminClients.length,
        activeProjects: adminProjects.filter(p => !["completed", "cancelled", "on_hold"].includes(p.status)).length,
        completedProjects: adminProjects.filter(p => p.status === "completed").length,
        totalRevenue: paidPayments.reduce((sum, p) => sum + parseFloat(p.paidAmount || p.amount || "0"), 0),
        pendingRevenue: pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0),
        overdueRevenue: overduePayments.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0),
        averageProjectValue: adminProjects.length > 0
          ? adminProjects.reduce((sum, p) => sum + parseFloat(p.totalCost || "0"), 0) / adminProjects.length
          : 0,
        completionRate: adminProjects.length > 0
          ? Math.round((adminProjects.filter(p => p.status === "completed").length / adminProjects.length) * 100)
          : 0,
        cancelledProjects: adminProjects.filter(p => p.status === "cancelled").length,
        onHoldProjects: adminProjects.filter(p => p.status === "on_hold").length,
      };

      // Projects by status
      const projectsByStatus = Object.entries(
        adminProjects.reduce((acc: Record<string, number>, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {})
      ).map(([status, count]) => ({ status, count }));

      // Projects by type
      const projectsByType = Object.entries(
        adminProjects.reduce((acc: Record<string, number>, p) => {
          acc[p.projectType] = (acc[p.projectType] || 0) + 1;
          return acc;
        }, {})
      ).map(([type, count]) => ({ type, count }));

      // Revenue by month (last 12 months)
      const now = new Date();
      const revenueByMonth = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthPayments = paidPayments.filter(p => {
          if (!p.paidAt) return false;
          const paidDate = new Date(p.paidAt);
          return paidDate >= monthDate && paidDate <= monthEnd;
        });
        const monthRevenue = monthPayments.reduce((sum, p) => sum + parseFloat(p.paidAmount || p.amount || "0"), 0);
        revenueByMonth.push({
          month: monthDate.toISOString().substring(0, 7),
          revenue: monthRevenue,
        });
      }

      // Client acquisition by month
      const clientAcquisition = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthClients = adminClients.filter(c => {
          if (!c.createdAt) return false;
          const createdDate = new Date(c.createdAt);
          return createdDate >= monthDate && createdDate <= monthEnd;
        });
        clientAcquisition.push({
          month: monthDate.toISOString().substring(0, 7),
          count: monthClients.length,
        });
      }

      // Quote metrics
      const quoteMetrics = {
        total: adminQuotes.length,
        draft: adminQuotes.filter(q => q.status === "draft").length,
        sent: adminQuotes.filter(q => q.status === "sent" || q.status === "viewed").length,
        approved: adminQuotes.filter(q => q.status === "approved").length,
        rejected: adminQuotes.filter(q => q.status === "rejected").length,
        totalValue: adminQuotes.filter(q => q.status === "approved").reduce((sum, q) => sum + parseFloat(q.totalAmount || "0"), 0),
        conversionRate: adminQuotes.filter(q => ["approved", "rejected"].includes(q.status)).length > 0
          ? Math.round((adminQuotes.filter(q => q.status === "approved").length / adminQuotes.filter(q => ["approved", "rejected"].includes(q.status)).length) * 100)
          : 0,
      };

      // Client sources
      const clientSources = Object.entries(
        adminClients.reduce((acc: Record<string, number>, c) => {
          const source = c.source || "unknown";
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        }, {})
      ).map(([source, count]) => ({ source, count }));

      // Top clients by revenue
      const topClients = await Promise.all(
        adminClients.slice(0, 10).map(async (client) => {
          const clientProjects = adminProjects.filter(p => p.clientId === client.id);
          const clientPayments = adminPayments.filter(p => p.clientId === client.id && p.status === "paid");
          const totalValue = clientPayments.reduce((sum, p) => sum + parseFloat(p.paidAmount || p.amount || "0"), 0);
          return { ...client, projectCount: clientProjects.length, totalValue };
        })
      );
      topClients.sort((a, b) => b.totalValue - a.totalValue);

      // Active projects list
      const activeProjectsList = adminProjects
        .filter(p => !["completed", "cancelled", "on_hold"].includes(p.status))
        .map(p => ({
          id: p.id,
          clientId: p.clientId,
          status: p.status,
          totalCost: p.totalCost,
          progressPercentage: p.progressPercentage,
          startDate: p.startDate,
          expectedCompletionDate: p.expectedCompletionDate,
        }));

      // Pending payments
      const pendingPaymentsList = adminPayments
        .filter(p => p.status === "pending" || p.status === "overdue")
        .map(p => ({
          id: p.id,
          clientId: p.clientId,
          amount: p.amount,
          status: p.status,
          dueDate: p.dueDate,
        }));

      res.json({
        admin: {
          id: admin.id,
          name: `${admin.firstName} ${admin.lastName}`,
          email: admin.email,
        },
        stats,
        projectsByStatus,
        projectsByType,
        revenueByMonth,
        clientAcquisition,
        quoteMetrics,
        clientSources,
        topClients: topClients.slice(0, 5),
        activeProjectsList,
        pendingPaymentsList,
      });
    } catch (error) {
      console.error("Admin analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get admin users for analytics selection
  app.get("/api/admin/users", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const admins = await storage.getAdminUsers();
      res.json(admins.map(a => ({
        id: a.id,
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
      })));
    } catch (error) {
      console.error("Get admin users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/admin/profile", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid data" });
      }
      const { firstName, lastName, phone } = parsed.data;
      await storage.updateUser(req.user!.id, { firstName, lastName, phone });
      res.json({ success: true });
    } catch (error) {
      console.error("Update admin profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/payments/:id/send-reminder", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const payment = await storage.getPayment(id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      // Check edit permissions
      const canEdit = await canAdminEditClientHelper(req.user!.id, payment.clientId);
      if (!canEdit) {
        return res.status(403).json({ error: "You don't have edit permissions for this client" });
      }

      if (payment.status === "paid") {
        return res.status(400).json({ error: "Payment already completed" });
      }

      const client = await storage.getClient(payment.clientId);
      if (!client?.userId) {
        return res.status(400).json({ error: "Client not found" });
      }

      const user = await storage.getUser(client.userId);
      if (!user || !client.businessEmail) {
        return res.status(400).json({ error: "Client email not available" });
      }

      if (!isEmailConfigured()) {
        return res.status(400).json({ error: "Email not configured" });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const dueDate = payment.dueDate 
        ? new Date(payment.dueDate).toLocaleDateString() 
        : "Not specified";

      const sent = await sendPaymentReminderEmail(
        client.businessEmail,
        user.firstName,
        payment.amount,
        payment.description || `Payment #${payment.paymentNumber}`,
        dueDate,
        `${baseUrl}/client/payments`
      );

      if (sent) {
        await storage.createActivityLog({
          userId: req.user!.id,
          clientId: client.id,
          action: "payment_reminder_sent",
          description: `Payment reminder sent for $${payment.amount}`,
          ipAddress: req.ip,
        });
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error) {
      console.error("Send payment reminder error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/email/status", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    res.json({ configured: isEmailConfigured() });
  });

  // ============ STRIPE ROUTES ============

  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Get publishable key error:", error);
      res.status(500).json({ error: "Stripe not configured" });
    }
  });

  // Create Payment Intent for embedded payment form
  app.post("/api/payments/:id/create-payment-intent", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const payment = await storage.getPayment(id);
      
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      const client = await storage.getClientByUserId(req.user!.id);
      if (!client || payment.clientId !== client.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (payment.status === "paid") {
        return res.status(400).json({ error: "Payment already completed" });
      }

      const stripe = await getUncachableStripeClient();
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(payment.amount) * 100),
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          payment_id: id,
          client_id: client.id,
        },
        description: payment.description || `Payment #${payment.paymentNumber}`,
        receipt_email: client.businessEmail || undefined,
      });

      await storage.updatePayment(id, {
        stripePaymentIntentId: paymentIntent.id,
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.error("Create payment intent error:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  // Confirm Payment Intent after embedded payment
  app.post("/api/payments/:id/confirm-payment", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment intent ID required" });
      }

      const payment = await storage.getPayment(id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      const client = await storage.getClientByUserId(req.user!.id);
      if (!client || payment.clientId !== client.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Security: Verify the payment intent ID matches what we stored
      if (payment.stripePaymentIntentId && payment.stripePaymentIntentId !== paymentIntentId) {
        return res.status(403).json({ error: "Payment intent ID mismatch" });
      }

      if (payment.status === "paid") {
        return res.json({ success: true, status: "paid" });
      }

      const stripe = await getUncachableStripeClient();
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === "succeeded" && 
          paymentIntent.metadata?.payment_id === id &&
          paymentIntent.metadata?.client_id === client.id) {
        
        await storage.updatePayment(id, {
          status: "paid",
          stripePaymentIntentId: paymentIntentId,
          paidAt: new Date() as any,
          paidAmount: (paymentIntent.amount / 100).toString(),
        });

        await storage.createActivityLog({
          clientId: client.id,
          action: "payment_completed",
          description: `Payment #${payment.paymentNumber} of $${payment.amount} completed`,
        });

        const user = await storage.getUser(client.userId!);
        if (user && client.businessEmail) {
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          sendPaymentConfirmationEmail(
            client.businessEmail,
            user.firstName,
            payment.amount,
            payment.description || `Payment #${payment.paymentNumber}`,
            new Date().toLocaleDateString(),
            `${baseUrl}/client/payments`
          ).catch(console.error);
        }

        // Notify admin about payment received
        await notifyAdminActivity(
          client.id,
          "payment_completed",
          `Payment of $${payment.amount} received for "${payment.description || `Payment #${payment.paymentNumber}`}"`
        );

        return res.json({ success: true, status: "paid" });
      }

      res.json({ success: false, status: paymentIntent.status });
    } catch (error) {
      console.error("Confirm payment error:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // Legacy checkout session route (kept for backwards compatibility)
  app.post("/api/payments/:id/checkout", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const payment = await storage.getPayment(id);
      
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      const client = await storage.getClientByUserId(req.user!.id);
      if (!client || payment.clientId !== client.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (payment.status === "paid") {
        return res.status(400).json({ error: "Payment already completed" });
      }

      const stripe = await getUncachableStripeClient();
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: payment.description || `Payment #${payment.paymentNumber}`,
                description: `Project payment for ${client.businessLegalName}`,
              },
              unit_amount: Math.round(parseFloat(payment.amount) * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/client/payments/success?session_id={CHECKOUT_SESSION_ID}&payment_id=${id}`,
        cancel_url: `${baseUrl}/client/payments/cancel?payment_id=${id}`,
        client_reference_id: client.id,
        metadata: {
          payment_id: id,
          client_id: client.id,
        },
        customer_email: client.businessEmail || undefined,
      });

      await storage.updatePayment(id, {
        stripeCheckoutSessionId: session.id,
      });

      res.json({ checkoutUrl: session.url });
    } catch (error) {
      console.error("Create checkout session error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/api/payments/verify-session", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const { sessionId, paymentId } = req.body;
      
      if (!sessionId || !paymentId) {
        return res.status(400).json({ error: "Session ID and Payment ID required" });
      }

      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      const client = await storage.getClientByUserId(req.user!.id);
      if (!client || payment.clientId !== client.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Security: If we already have a stored session ID, it must match
      if (payment.stripeCheckoutSessionId && payment.stripeCheckoutSessionId !== sessionId) {
        return res.status(403).json({ error: "Session ID mismatch" });
      }

      // Security: If no session ID is stored, the checkout was never initiated for this payment
      if (!payment.stripeCheckoutSessionId) {
        return res.status(403).json({ error: "No checkout session found for this payment" });
      }

      if (payment.status === "paid") {
        return res.json({ verified: true, status: "paid" });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // Security: Verify both payment_id AND client_id from session metadata
      if (session.payment_status === "paid" && 
          session.metadata?.payment_id === paymentId &&
          session.metadata?.client_id === client.id) {
        await storage.updatePayment(paymentId, {
          status: "paid",
          stripePaymentIntentId: session.payment_intent as string,
          paidAt: new Date() as any,
          paidAmount: ((session.amount_total || 0) / 100).toString(),
        });

        await storage.createActivityLog({
          clientId: client.id,
          action: "payment_completed",
          description: `Payment #${payment.paymentNumber} of $${payment.amount} completed`,
        });

        const user = await storage.getUser(client.userId!);
        if (user && client.businessEmail) {
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          sendPaymentConfirmationEmail(
            client.businessEmail,
            user.firstName,
            payment.amount,
            payment.description || `Payment #${payment.paymentNumber}`,
            new Date().toLocaleDateString(),
            `${baseUrl}/client/payments`
          ).catch(console.error);
        }

        return res.json({ verified: true, status: "paid" });
      }

      res.json({ verified: false, status: session.payment_status });
    } catch (error) {
      console.error("Verify session error:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  // ============ INVOICE ROUTES ============

  app.get("/api/payments/:id/invoice", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const payment = await storage.getPayment(id);
      
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      if (req.user!.role === "client") {
        const client = await storage.getClientByUserId(req.user!.id);
        if (!client || payment.clientId !== client.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      const client = await storage.getClient(payment.clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      const project = await storage.getProject(payment.projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (!payment.invoiceNumber) {
        const invoiceNumber = generateInvoiceNumber(payment.id, payment.createdAt);
        await storage.updatePayment(id, { invoiceNumber });
        payment.invoiceNumber = invoiceNumber;
      }

      const pdfBuffer = await generateInvoicePdf({
        payment,
        client,
        project,
        companyInfo: {
          name: process.env.COMPANY_NAME || "Web Design Studio",
          address: process.env.COMPANY_ADDRESS || "123 Design Street, Creative City, ST 12345",
          phone: process.env.COMPANY_PHONE || "(555) 123-4567",
          email: process.env.COMPANY_EMAIL || "hello@webdesignstudio.com",
          website: process.env.COMPANY_WEBSITE || "www.webdesignstudio.com",
        },
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${payment.invoiceNumber}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Generate invoice error:", error);
      res.status(500).json({ error: "Failed to generate invoice" });
    }
  });

  app.get("/api/admin/payments/:id/invoice/preview", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const payment = await storage.getPayment(id);
      
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      const client = await storage.getClient(payment.clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      const project = await storage.getProject(payment.projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const invoiceNumber = payment.invoiceNumber || generateInvoiceNumber(payment.id, payment.createdAt);

      const pdfBuffer = await generateInvoicePdf({
        payment: { ...payment, invoiceNumber },
        client,
        project,
        companyInfo: {
          name: process.env.COMPANY_NAME || "Web Design Studio",
          address: process.env.COMPANY_ADDRESS || "123 Design Street, Creative City, ST 12345",
          phone: process.env.COMPANY_PHONE || "(555) 123-4567",
          email: process.env.COMPANY_EMAIL || "hello@webdesignstudio.com",
          website: process.env.COMPANY_WEBSITE || "www.webdesignstudio.com",
        },
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${invoiceNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Preview invoice error:", error);
      res.status(500).json({ error: "Failed to generate invoice preview" });
    }
  });

  // ============ CLIENT UPLOADS ROUTES ============

  app.get("/api/client/uploads", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      const uploads = await db.select().from(clientUploads)
        .where(eq(clientUploads.clientId, client.id))
        .orderBy(desc(clientUploads.createdAt));

      res.json({ uploads });
    } catch (error) {
      console.error("Get client uploads error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/client/uploads", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      const { category, description, fileName, fileUrl, fileSize, fileType } = req.body;

      if (!category || !fileName || !fileUrl) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const [upload] = await db.insert(clientUploads).values({
        clientId: client.id,
        category,
        description: description || null,
        fileName,
        fileUrl,
        fileSize: fileSize || null,
        fileType: fileType || null,
        uploadedBy: req.user!.id,
      }).returning();

      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: client.id,
        action: "file_uploaded",
        description: `Uploaded ${fileName}`,
        ipAddress: req.ip,
      });

      res.json({ upload });
    } catch (error) {
      console.error("Create client upload error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/client/uploads/:id", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      const [upload] = await db.select().from(clientUploads)
        .where(and(eq(clientUploads.id, id), eq(clientUploads.clientId, client.id)));

      if (!upload) {
        return res.status(404).json({ error: "Upload not found" });
      }

      await db.delete(clientUploads).where(eq(clientUploads.id, id));

      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: client.id,
        action: "file_deleted",
        description: `Deleted ${upload.fileName}`,
        ipAddress: req.ip,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Delete client upload error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin route to view client uploads
  app.get("/api/admin/clients/:id/uploads", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const uploads = await db.select().from(clientUploads)
        .where(eq(clientUploads.clientId, id))
        .orderBy(desc(clientUploads.createdAt));

      res.json({ uploads });
    } catch (error) {
      console.error("Get client uploads error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ ADMIN LEADERBOARD ============
  
  app.get("/api/admin/leaderboard", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const leaderboard = await storage.getAdminLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Get leaderboard error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ ADMIN ACCESS CONTROL ============
  
  // Get all admins (for sharing UI)
  app.get("/api/admin/admins", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const admins = await storage.getAdmins();
      res.json(admins.map(a => ({ id: a.id, firstName: a.firstName, lastName: a.lastName, email: a.email })));
    } catch (error) {
      console.error("Get admins error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get access list for a client
  app.get("/api/admin/clients/:id/access", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      // Only owner can view/manage access
      if (client.createdBy !== req.user!.id) {
        return res.status(403).json({ error: "Only the client owner can manage access" });
      }
      
      const accessList = await storage.getAdminClientAccess(id);
      
      // Enrich with admin names
      const enrichedAccess = await Promise.all(accessList.map(async (access) => {
        const admin = await storage.getUser(access.adminId);
        return {
          ...access,
          adminName: admin ? `${admin.firstName} ${admin.lastName}` : "Unknown",
        };
      }));
      
      res.json(enrichedAccess);
    } catch (error) {
      console.error("Get client access error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Grant access to another admin
  app.post("/api/admin/clients/:id/access", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { adminId, accessLevel } = req.body;
      
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      // Only owner can grant access
      if (client.createdBy !== req.user!.id) {
        return res.status(403).json({ error: "Only the client owner can grant access" });
      }
      
      if (!adminId || !["view", "edit"].includes(accessLevel)) {
        return res.status(400).json({ error: "Invalid admin ID or access level" });
      }
      
      const access = await storage.grantClientAccess({
        clientId: id,
        adminId,
        accessLevel,
        grantedBy: req.user!.id,
      });
      
      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: id,
        action: "access_granted",
        description: `Granted ${accessLevel} access to admin`,
        ipAddress: req.ip,
      });
      
      res.json(access);
    } catch (error) {
      console.error("Grant access error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Revoke access from another admin
  app.delete("/api/admin/access/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await storage.revokeClientAccess(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Revoke access error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ QUOTES ============
  
  // Get quotes for a client
  app.get("/api/admin/clients/:id/quotes", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const quotes = await storage.getQuotesByClientId(id);
      res.json(quotes);
    } catch (error) {
      console.error("Get quotes error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create a quote
  app.post("/api/admin/clients/:id/quotes", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { title, description, lineItems, subtotal, discountAmount, discountDescription, taxRate, taxAmount, totalAmount, validUntil, notes, termsAndConditions } = req.body;
      
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      // Check edit permissions
      const canEdit = await storage.canAdminEditClient(req.user!.id, id);
      if (!canEdit) {
        return res.status(403).json({ error: "You don't have permission to create quotes for this client" });
      }
      
      const projects = await storage.getProjectsByClientId(id);
      
      const quote = await storage.createQuote({
        clientId: id,
        projectId: projects[0]?.id || null,
        title,
        description,
        lineItems: JSON.stringify(lineItems),
        subtotal,
        discountAmount: discountAmount || "0",
        discountDescription,
        taxRate: taxRate || "0",
        taxAmount: taxAmount || "0",
        totalAmount,
        validUntil,
        notes,
        termsAndConditions,
        createdBy: req.user!.id,
        status: "draft",
      });
      
      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: id,
        action: "quote_created",
        description: `Created quote: ${title}`,
        ipAddress: req.ip,
      });
      
      res.json(quote);
    } catch (error) {
      console.error("Create quote error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update a quote
  app.patch("/api/admin/quotes/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const quote = await storage.getQuote(id);
      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }
      
      const canEdit = await storage.canAdminEditClient(req.user!.id, quote.clientId);
      if (!canEdit) {
        return res.status(403).json({ error: "You don't have permission to edit this quote" });
      }
      
      const updateData: any = { ...req.body };
      if (updateData.lineItems) {
        updateData.lineItems = JSON.stringify(updateData.lineItems);
      }
      
      const updated = await storage.updateQuote(id, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Update quote error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Send quote to client
  app.post("/api/admin/quotes/:id/send", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const quote = await storage.getQuote(id);
      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }
      
      // Check edit permissions
      const canEdit = await canAdminEditClientHelper(req.user!.id, quote.clientId);
      if (!canEdit) {
        return res.status(403).json({ error: "You don't have edit permissions for this client" });
      }
      
      const updated = await storage.updateQuote(id, {
        status: "sent",
        sentAt: new Date() as any,
      });
      
      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: quote.clientId,
        action: "quote_sent",
        description: `Sent quote: ${quote.title}`,
        ipAddress: req.ip,
      });

      // Send email notification to client
      const client = await storage.getClient(quote.clientId);
      if (client?.userId) {
        const user = await storage.getUser(client.userId);
        if (user?.email) {
          const totalAmount = typeof quote.totalAmount === 'string' ? quote.totalAmount : String(quote.totalAmount || 0);
          const baseUrl = process.env.APP_URL || "https://your-app.replit.app";
          await sendQuoteNotificationEmail(
            user.email,
            user.firstName || "Client",
            quote.title,
            totalAmount,
            baseUrl
          );
        }
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Send quote error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete a quote
  app.delete("/api/admin/quotes/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const quote = await storage.getQuote(id);
      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }
      
      const canEdit = await storage.canAdminEditClient(req.user!.id, quote.clientId);
      if (!canEdit) {
        return res.status(403).json({ error: "You don't have permission to delete this quote" });
      }
      
      await storage.deleteQuote(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete quote error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ CLIENT QUOTE ROUTES ============
  
  // Get quotes for client to review
  app.get("/api/client/quotes", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const quotes = await storage.getQuotesByClientId(client.id);
      // Only show sent quotes to clients
      const visibleQuotes = quotes.filter(q => q.status !== "draft");
      res.json(visibleQuotes);
    } catch (error) {
      console.error("Get client quotes error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // View a quote (marks as viewed)
  app.get("/api/client/quotes/:id", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const quote = await storage.getQuote(id);
      if (!quote || quote.clientId !== client.id) {
        return res.status(404).json({ error: "Quote not found" });
      }
      
      // Mark as viewed if not already
      if (quote.status === "sent" && !quote.viewedAt) {
        await storage.updateQuote(id, {
          status: "viewed",
          viewedAt: new Date() as any,
        });
      }
      
      res.json(quote);
    } catch (error) {
      console.error("Get client quote error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Respond to quote (approve/reject)
  app.post("/api/client/quotes/:id/respond", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { response, message } = req.body;
      
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const quote = await storage.getQuote(id);
      if (!quote || quote.clientId !== client.id) {
        return res.status(404).json({ error: "Quote not found" });
      }
      
      if (!["approved", "rejected"].includes(response)) {
        return res.status(400).json({ error: "Invalid response" });
      }
      
      const updated = await storage.updateQuote(id, {
        status: response,
        clientResponse: message,
        respondedAt: new Date() as any,
      });
      
      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: client.id,
        action: `quote_${response}`,
        description: `${response === "approved" ? "Approved" : "Rejected"} quote: ${quote.title}`,
        ipAddress: req.ip,
      });

      // Notify admin about quote response
      await notifyAdminActivity(
        client.id,
        response === "approved" ? "quote_approved" : "quote_rejected",
        `Client ${response === "approved" ? "approved" : "rejected"} quote "${quote.title}"${message ? `: ${message}` : ""}`
      );
      
      res.json(updated);
    } catch (error) {
      console.error("Quote response error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ PIN LOGIN ============
  
  // Set PIN for admin
  app.post("/api/admin/pin/set", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { pin, password } = req.body;
      
      if (!pin || !/^\d{5}$/.test(pin)) {
        return res.status(400).json({ error: "PIN must be exactly 5 digits" });
      }
      
      // Verify password first
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid password" });
      }
      
      const pinHash = await bcrypt.hash(pin, 10);
      await storage.updateUser(req.user!.id, {
        pinHash,
        pinEnabled: true,
        pinFailedAttempts: 0,
      } as any);
      
      res.json({ success: true, message: "PIN set successfully" });
    } catch (error) {
      console.error("Set PIN error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Disable PIN
  app.post("/api/admin/pin/disable", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      await storage.updateUser(req.user!.id, {
        pinEnabled: false,
        pinHash: null,
      } as any);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Disable PIN error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // PIN login endpoint
  app.post("/api/auth/pin-login", async (req: AuthRequest, res) => {
    try {
      const { email, pin } = req.body;
      
      if (!email || !pin) {
        return res.status(400).json({ error: "Email and PIN are required" });
      }
      
      // Validate PIN is exactly 5 digits
      if (!/^\d{5}$/.test(pin)) {
        return res.status(400).json({ error: "PIN must be exactly 5 digits" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.role !== "admin") {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      if (!user.pinEnabled || !user.pinHash) {
        return res.status(400).json({ error: "PIN login not enabled for this account" });
      }
      
      // Check if locked out
      if (user.pinLockedUntil && new Date(user.pinLockedUntil) > new Date()) {
        const remainingMinutes = Math.ceil((new Date(user.pinLockedUntil).getTime() - Date.now()) / 60000);
        return res.status(429).json({ error: `Too many attempts. Try again in ${remainingMinutes} minutes.` });
      }
      
      const validPin = await bcrypt.compare(pin, user.pinHash);
      if (!validPin) {
        // Increment failed attempts
        const attempts = (user.pinFailedAttempts || 0) + 1;
        const updates: any = { pinFailedAttempts: attempts };
        
        // Lock after 5 failed attempts for 15 minutes
        if (attempts >= 5) {
          updates.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        }
        
        await storage.updateUser(user.id, updates);
        return res.status(401).json({ error: "Invalid PIN" });
      }
      
      // Success - reset failed attempts
      await storage.updateUser(user.id, {
        pinFailedAttempts: 0,
        pinLockedUntil: null,
        lastLogin: new Date(),
      } as any);
      
      const token = jwt.sign({ id: user.id, role: user.role }, process.env.SESSION_SECRET!, { expiresIn: "7d" });
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        },
      });
    } catch (error) {
      console.error("PIN login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Check if admin has PIN enabled
  app.get("/api/auth/pin-status", async (req, res) => {
    try {
      const { email } = req.query;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email required" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.role !== "admin") {
        return res.json({ pinEnabled: false });
      }
      
      res.json({ pinEnabled: user.pinEnabled || false });
    } catch (error) {
      console.error("Check PIN status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Verify PIN for phase skipping (requires authenticated admin)
  app.post("/api/admin/pin/verify", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { pin } = req.body;
      
      if (!pin || !/^\d{5}$/.test(pin)) {
        return res.status(400).json({ error: "PIN must be exactly 5 digits" });
      }
      
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (!user.pinEnabled || !user.pinHash) {
        return res.status(400).json({ error: "PIN not set up for this account" });
      }
      
      // Check if locked out
      if (user.pinLockedUntil && new Date(user.pinLockedUntil) > new Date()) {
        const remainingMinutes = Math.ceil((new Date(user.pinLockedUntil).getTime() - Date.now()) / 60000);
        return res.status(429).json({ error: `Too many attempts. Try again in ${remainingMinutes} minutes.` });
      }
      
      const validPin = await bcrypt.compare(pin, user.pinHash);
      if (!validPin) {
        // Increment failed attempts
        const attempts = (user.pinFailedAttempts || 0) + 1;
        const updates: any = { pinFailedAttempts: attempts };
        
        if (attempts >= 5) {
          updates.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        }
        
        await storage.updateUser(user.id, updates);
        return res.status(401).json({ error: "Invalid PIN" });
      }
      
      // Success - reset failed attempts
      await storage.updateUser(user.id, {
        pinFailedAttempts: 0,
        pinLockedUntil: null,
      } as any);
      
      res.json({ success: true, verified: true });
    } catch (error) {
      console.error("Verify PIN error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ WARRANTY ROUTES ============
  
  // Get warranty status for all completed projects (admin)
  app.get("/api/admin/warranty", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const allProjects = await storage.getProjects();
      const completedProjects = allProjects.filter(p => 
        p.status === "completed" && p.warrantyStartDate && p.warrantyEndDate
      );
      
      const warrantyData = await Promise.all(completedProjects.map(async (project) => {
        const client = await storage.getClient(project.clientId);
        const warrantyEnd = new Date(project.warrantyEndDate!);
        const now = new Date();
        const daysRemaining = Math.ceil((warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isExpired = daysRemaining <= 0;
        const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;
        
        return {
          projectId: project.id,
          projectType: project.projectType,
          clientId: project.clientId,
          clientName: client?.businessLegalName || "Unknown",
          warrantyStartDate: project.warrantyStartDate,
          warrantyEndDate: project.warrantyEndDate,
          daysRemaining: Math.max(0, daysRemaining),
          isExpired,
          isExpiringSoon,
          warrantyReminderSent: project.warrantyReminderSent,
          warrantyExpiryNotified: project.warrantyExpiryNotified,
        };
      }));
      
      res.json(warrantyData.sort((a, b) => a.daysRemaining - b.daysRemaining));
    } catch (error) {
      console.error("Get warranty status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Send warranty reminder email (admin)
  app.post("/api/admin/warranty/:projectId/remind", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { projectId } = req.params;
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      if (!project.warrantyEndDate) {
        return res.status(400).json({ error: "Project has no warranty period" });
      }
      
      const client = await storage.getClient(project.clientId);
      if (!client?.userId) {
        return res.status(400).json({ error: "Client not found" });
      }
      
      const user = await storage.getUser(client.userId);
      if (!user?.email) {
        return res.status(400).json({ error: "Client email not found" });
      }
      
      const warrantyEnd = new Date(project.warrantyEndDate);
      const daysRemaining = Math.ceil((warrantyEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining <= 0) {
        return res.status(400).json({ error: "Warranty has already expired" });
      }
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const projectName = project.projectType === "other" 
        ? project.projectTypeOther || "Custom Project" 
        : project.projectType.replace(/_/g, " ");
      
      const emailService = await import("./emailService");
      const sent = await emailService.sendWarrantyReminderEmail(
        user.email,
        user.firstName || "Client",
        projectName,
        daysRemaining,
        warrantyEnd,
        `${baseUrl}/client`
      );
      
      if (sent) {
        await storage.updateProject(projectId, { warrantyReminderSent: true });
        res.json({ success: true, message: "Warranty reminder sent" });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error) {
      console.error("Send warranty reminder error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Get warranty status for client's project
  app.get("/api/client/warranty", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.json({ warranty: null });
      }
      
      const projectsList = await storage.getProjectsByClientId(client.id);
      const completedProject = projectsList.find(p => 
        p.status === "completed" && p.warrantyStartDate && p.warrantyEndDate
      );
      
      if (!completedProject) {
        return res.json({ warranty: null });
      }
      
      const warrantyEnd = new Date(completedProject.warrantyEndDate!);
      const now = new Date();
      const daysRemaining = Math.ceil((warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      res.json({
        warranty: {
          projectId: completedProject.id,
          startDate: completedProject.warrantyStartDate,
          endDate: completedProject.warrantyEndDate,
          daysRemaining: Math.max(0, daysRemaining),
          isExpired: daysRemaining <= 0,
          isExpiringSoon: daysRemaining > 0 && daysRemaining <= 7,
        }
      });
    } catch (error) {
      console.error("Get client warranty error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Client approves website and moves to awaiting_final_payment
  app.post("/api/client/projects/:id/approve", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const client = await storage.getClientByUserId(req.user!.id);
      
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const project = await storage.getProject(id);
      if (!project || project.clientId !== client.id) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      if (project.status !== "client_review") {
        return res.status(400).json({ error: "Project is not in review status" });
      }
      
      // Update project status to awaiting_final_payment
      await storage.updateProject(id, { status: "awaiting_final_payment" });
      
      // Log activity
      await storage.createActivityLog({
        clientId: client.id,
        userId: req.user!.id,
        action: "project_approved",
        description: "Client approved website design",
        metadata: { projectId: id },
      });
      
      res.json({ success: true, message: "Website approved! Proceeding to final payment." });
    } catch (error) {
      console.error("Client approve project error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Client requests changes - moves to revisions_pending
  app.post("/api/client/projects/:id/request-changes", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { feedback } = req.body;
      const client = await storage.getClientByUserId(req.user!.id);
      
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const project = await storage.getProject(id);
      if (!project || project.clientId !== client.id) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      if (project.status !== "client_review") {
        return res.status(400).json({ error: "Project is not in review status" });
      }
      
      // Save feedback as a message if provided
      if (feedback && feedback.trim()) {
        await storage.createMessage({
          clientId: client.id,
          projectId: id,
          userId: req.user!.id,
          messageText: feedback.trim(),
          direction: "client_to_admin",
          category: "development_feedback",
        });
      }
      
      // Update project status to revisions_pending
      await storage.updateProject(id, { status: "revisions_pending" });
      
      // Log activity
      await storage.createActivityLog({
        clientId: client.id,
        userId: req.user!.id,
        action: "revisions_requested",
        description: feedback?.trim() 
          ? `Client requested website revisions: ${feedback.trim().substring(0, 100)}${feedback.trim().length > 100 ? '...' : ''}`
          : "Client requested website revisions",
        metadata: { projectId: id, hasFeedback: !!feedback?.trim() },
      });
      
      res.json({ success: true, message: "Revision request submitted. We'll get to work on the changes." });
    } catch (error) {
      console.error("Client request changes error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Client submits Hostinger credentials for Phase 7A
  app.post("/api/client/projects/:id/hosting-credentials", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { email, tempPassword } = req.body;
      
      if (!email || !tempPassword) {
        return res.status(400).json({ error: "Email and temporary password are required" });
      }
      
      // Verify project belongs to client
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.status(404).json({ error: "Client profile not found" });
      }
      
      const project = await storage.getProject(id);
      if (!project || project.clientId !== client.id) {
        return res.status(403).json({ error: "You do not have access to this project" });
      }
      
      // Verify project is in correct phase
      if (project.status !== "hosting_setup_pending") {
        return res.status(400).json({ error: "Project is not in hosting setup phase" });
      }
      
      // Update project with Hostinger credentials
      await storage.updateProject(id, {
        hostingerEmail: email,
        hostingerTempPassword: tempPassword,
        hostingerCredentialsSubmittedAt: new Date(),
        hostingCredentialsReceived: true,
        hostingCredentialsReceivedAt: new Date(),
      });
      
      // Log activity
      await storage.createActivityLog({
        clientId: client.id,
        userId: req.user!.id,
        action: "hosting_credentials_submitted",
        description: `Client submitted Hostinger credentials for ${project.domainName || "project"}`,
      });
      
      res.json({ success: true, message: "Hosting credentials submitted successfully. We'll begin configuration shortly." });
    } catch (error) {
      console.error("Submit hosting credentials error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ CANCELLATION ROUTES ============
  
  // Get all cancellations (admin)
  app.get("/api/admin/cancellations", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const cancellationList = await storage.getCancellations();
      
      const enrichedCancellations = await Promise.all(cancellationList.map(async (cancellation) => {
        const client = await storage.getClient(cancellation.clientId);
        const project = await storage.getProject(cancellation.projectId);
        const cancelledByUser = cancellation.cancelledBy ? await storage.getUser(cancellation.cancelledBy) : null;
        return {
          ...cancellation,
          clientName: client?.businessLegalName || "Unknown",
          projectName: project?.projectType || "Unknown",
          cancelledByName: cancelledByUser ? `${cancelledByUser.firstName} ${cancelledByUser.lastName}` : "Unknown",
        };
      }));
      
      res.json(enrichedCancellations);
    } catch (error) {
      console.error("Get cancellations error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Cancel a project and log cancellation (admin)
  app.post("/api/admin/projects/:id/cancel", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { reason, reasonNotes, cancellationFeePercentage = 25, workCompletedPercentage = 0 } = req.body;
      
      if (!reason) {
        return res.status(400).json({ error: "Cancellation reason is required" });
      }
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Check edit permissions
      const canEdit = await canAdminEditClientHelper(req.user!.id, project.clientId);
      if (!canEdit) {
        return res.status(403).json({ error: "You don't have edit permissions for this client" });
      }
      
      // Calculate total paid for this project
      const projectPayments = await storage.getPaymentsByProjectId(id);
      const totalPaid = projectPayments
        .filter(p => p.status === "paid")
        .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
      
      // Calculate cancellation fee
      const feePercentage = Math.min(Math.max(cancellationFeePercentage, 0), 100);
      const cancellationFeeAmount = (totalPaid * feePercentage) / 100;
      const refundAmount = totalPaid - cancellationFeeAmount;
      
      // Create cancellation record
      const cancellation = await storage.createCancellation({
        projectId: id,
        clientId: project.clientId,
        reason,
        reasonNotes,
        totalPaid: totalPaid.toString(),
        workCompleted: workCompletedPercentage,
        cancellationFeePercentage: feePercentage,
        cancellationFeeAmount: cancellationFeeAmount.toString(),
        refundAmount: refundAmount.toString(),
        refundStatus: refundAmount > 0 ? "pending" : "paid",
        cancelledBy: req.user!.id,
        cancelledAt: new Date(),
      });
      
      // Update project status to cancelled
      await storage.updateProject(id, { status: "cancelled" });
      
      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: project.clientId,
        action: "project_cancelled",
        description: `Project cancelled. Reason: ${reason}. Fee: $${cancellationFeeAmount.toFixed(2)}, Refund: $${refundAmount.toFixed(2)}`,
        ipAddress: req.ip,
      });
      
      res.json({
        cancellation,
        summary: {
          totalPaid,
          cancellationFeeAmount,
          refundAmount,
          feePercentage,
        }
      });
    } catch (error) {
      console.error("Cancel project error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Mark refund as processed (admin)
  app.patch("/api/admin/cancellations/:id/refund", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { refundStatus, stripeRefundId, refundNotes } = req.body;
      
      const cancellation = await storage.getCancellation(id);
      if (!cancellation) {
        return res.status(404).json({ error: "Cancellation not found" });
      }
      
      const updateData: any = {};
      if (refundStatus) updateData.refundStatus = refundStatus;
      if (stripeRefundId) updateData.stripeRefundId = stripeRefundId;
      if (refundNotes) updateData.refundNotes = refundNotes;
      if (refundStatus === "paid" || refundStatus === "refunded") updateData.refundedAt = new Date();
      
      const updated = await storage.updateCancellation(id, updateData);
      
      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: cancellation.clientId,
        action: "refund_processed",
        description: `Refund status updated to ${refundStatus}`,
        ipAddress: req.ip,
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Update cancellation refund error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ RESOURCE LIBRARY ROUTES ============
  
  // Get all resources (admin)
  app.get("/api/admin/resources", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const resourceList = await storage.getResources();
      res.json(resourceList);
    } catch (error) {
      console.error("Get resources error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Get single resource (admin)
  app.get("/api/admin/resources/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const resource = await storage.getResource(id);
      if (!resource) {
        return res.status(404).json({ error: "Resource not found" });
      }
      res.json(resource);
    } catch (error) {
      console.error("Get resource error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Create resource (admin)
  app.post("/api/admin/resources", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { title, description, category, fileUrl, fileName, fileSize, fileType, externalUrl, content, sortOrder, isPublished, isClientVisible } = req.body;
      
      if (!title || !category) {
        return res.status(400).json({ error: "Title and category are required" });
      }
      
      const resource = await storage.createResource({
        title,
        description,
        category,
        fileUrl,
        fileName,
        fileSize,
        fileType,
        externalUrl,
        content,
        sortOrder: sortOrder || 0,
        isPublished: isPublished !== false,
        isClientVisible: isClientVisible !== false,
        createdBy: req.user!.id,
      });
      
      res.json(resource);
    } catch (error) {
      console.error("Create resource error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Update resource (admin)
  app.patch("/api/admin/resources/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const resource = await storage.updateResource(id, req.body);
      if (!resource) {
        return res.status(404).json({ error: "Resource not found" });
      }
      res.json(resource);
    } catch (error) {
      console.error("Update resource error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Delete resource (admin)
  app.delete("/api/admin/resources/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await storage.deleteResource(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete resource error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Get published resources for clients
  app.get("/api/client/resources", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const resourceList = await storage.getPublishedResources();
      res.json(resourceList);
    } catch (error) {
      console.error("Get client resources error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ PROJECT MESSAGES / FEEDBACK ROUTES ============
  
  // Get messages for a project (admin) - optionally filter by category
  app.get("/api/admin/projects/:id/messages", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { category } = req.query;
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Get all messages for the client associated with this project
      const allMessages = await storage.getMessagesByClientId(project.clientId);
      
      // Filter by project and optionally by category
      let projectMessages = allMessages.filter(m => m.projectId === id);
      if (category && typeof category === "string") {
        projectMessages = projectMessages.filter(m => m.category === category);
      }
      
      // Enrich with sender info
      const enrichedMessages = await Promise.all(projectMessages.map(async (msg) => {
        const sender = await storage.getUser(msg.senderId);
        return {
          ...msg,
          senderName: sender ? `${sender.firstName} ${sender.lastName}` : "Unknown",
        };
      }));
      
      res.json(enrichedMessages);
    } catch (error) {
      console.error("Get project messages error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all messages for a client (admin - for chat panel)
  app.get("/api/admin/clients/:id/messages", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const messagesList = await storage.getMessagesByClientId(id);
      
      // Mark client messages as read when admin views them
      await storage.markMessagesAsReadByClient(id, "client");
      
      const enrichedMessages = await Promise.all(messagesList.map(async (msg) => {
        const sender = await storage.getUser(msg.senderId);
        return {
          ...msg,
          senderName: sender ? `${sender.firstName} ${sender.lastName}` : "Unknown",
        };
      }));
      
      res.json(enrichedMessages);
    } catch (error) {
      console.error("Get client messages error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Send message to client (admin)
  app.post("/api/admin/clients/:id/messages", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { messageText, projectId } = req.body;
      
      if (!messageText || typeof messageText !== "string" || messageText.trim().length === 0) {
        return res.status(400).json({ error: "Message text is required" });
      }
      
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      // Get project ID if not provided (use first project)
      let msgProjectId = projectId;
      if (!msgProjectId) {
        const projects = await storage.getProjectsByClientId(id);
        if (projects.length > 0) {
          msgProjectId = projects[0].id;
        }
      }
      
      const message = await storage.createMessage({
        clientId: id,
        projectId: msgProjectId,
        senderId: req.user!.id,
        senderType: "admin",
        messageText: messageText.trim(),
        category: "general",
      });
      
      // Send real-time WebSocket notification to client
      notifyNewMessage(id, {
        senderType: "admin",
        senderName: `${req.user!.firstName} ${req.user!.lastName}`,
        preview: messageText.substring(0, 100),
      });
      
      // Send email notification to client
      const user = client.userId ? await storage.getUser(client.userId) : null;
      if (user?.email) {
        try {
          await sendNewMessageNotificationEmail(
            user.email,
            `${user.firstName} ${user.lastName}`,
            client.businessLegalName || "Your Project",
            `${req.user!.firstName} ${req.user!.lastName}`,
            messageText.substring(0, 200) + (messageText.length > 200 ? '...' : '')
          );
        } catch (emailErr) {
          console.error("Failed to send message notification email:", emailErr);
        }
      }
      
      res.json(message);
    } catch (error) {
      console.error("Send admin message error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get unread message count for a client (admin)
  app.get("/api/admin/clients/:id/messages/unread", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const count = await storage.getUnreadMessageCount(id, "admin");
      res.json({ unreadCount: count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Mark messages as read (admin viewing client messages)
  app.post("/api/admin/clients/:id/messages/mark-read", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await storage.markMessagesAsReadByClient(id, "client");
      res.json({ success: true });
    } catch (error) {
      console.error("Mark messages read error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get total unread messages for admin dashboard
  app.get("/api/admin/messages/unread-total", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const count = await storage.getTotalUnreadMessagesForAdmin();
      res.json({ unreadCount: count });
    } catch (error) {
      console.error("Get total unread count error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all client conversations for admin messages page
  app.get("/api/admin/messages/conversations", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const clients = await storage.getClients();
      
      const conversations = await Promise.all(clients.map(async (client) => {
        const user = await storage.getUser(client.userId);
        if (!user) return null;
        
        // Use optimized single-message query instead of loading all messages
        const lastMessage = await storage.getLastMessageByClient(client.id);
        const unreadCount = await storage.getUnreadMessageCount(client.id, "admin");
        
        return {
          id: client.id,
          businessLegalName: client.businessLegalName || "Unknown Business",
          user: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          },
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            messageText: lastMessage.messageText,
            senderType: lastMessage.senderType,
            createdAt: lastMessage.createdAt,
            isRead: lastMessage.isRead,
          } : undefined,
          unreadCount,
          totalMessages: 0, // Don't count all messages for performance
        };
      }));
      
      // Filter out null values
      const validConversations = conversations.filter(c => c !== null);
      res.json(validConversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Mark messages as read (client)
  app.post("/api/client/messages/mark-read", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      await storage.markMessagesAsReadByClient(client.id, "admin");
      res.json({ success: true });
    } catch (error) {
      console.error("Mark messages read error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get unread count for client
  app.get("/api/client/messages/unread", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.json({ unreadCount: 0 });
      }
      const count = await storage.getUnreadMessageCount(client.id, "client");
      res.json({ unreadCount: count });
    } catch (error) {
      console.error("Get client unread count error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ REVISION ROUTES ============
  
  // Get all pending revisions (admin)
  app.get("/api/admin/revisions", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const pendingRevisions = await storage.getPendingRevisions();
      
      const enrichedRevisions = await Promise.all(pendingRevisions.map(async (revision) => {
        const client = await storage.getClient(revision.clientId);
        const requestedBy = await storage.getUser(revision.requestedBy);
        return {
          ...revision,
          clientName: client?.businessLegalName || "Unknown",
          requestedByName: requestedBy ? `${requestedBy.firstName} ${requestedBy.lastName}` : "Unknown",
        };
      }));
      
      res.json(enrichedRevisions);
    } catch (error) {
      console.error("Get pending revisions error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Get revisions for a project (admin)
  app.get("/api/admin/projects/:id/revisions", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const revisionList = await storage.getRevisionsByProjectId(id);
      
      const enrichedRevisions = await Promise.all(revisionList.map(async (revision) => {
        const requestedBy = await storage.getUser(revision.requestedBy);
        const reviewedBy = revision.reviewedBy ? await storage.getUser(revision.reviewedBy) : null;
        const completedBy = revision.completedBy ? await storage.getUser(revision.completedBy) : null;
        return {
          ...revision,
          requestedByName: requestedBy ? `${requestedBy.firstName} ${requestedBy.lastName}` : "Unknown",
          reviewedByName: reviewedBy ? `${reviewedBy.firstName} ${reviewedBy.lastName}` : null,
          completedByName: completedBy ? `${completedBy.firstName} ${completedBy.lastName}` : null,
        };
      }));
      
      res.json(enrichedRevisions);
    } catch (error) {
      console.error("Get project revisions error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Create a revision request (client or admin)
  app.post("/api/revisions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { projectId, type, title, description, affectedPages } = req.body;
      
      if (!projectId || !type || !title || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      if (!["minor", "major"].includes(type)) {
        return res.status(400).json({ error: "Invalid revision type" });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const client = await storage.getClient(project.clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      // Authorization check: clients can only create revisions for their own projects
      if (req.user!.role === "client") {
        const userClient = await storage.getClientByUserId(req.user!.id);
        if (!userClient || userClient.id !== client.id) {
          return res.status(403).json({ error: "You can only request revisions for your own project" });
        }
      }
      
      const revision = await storage.createRevision({
        clientId: client.id,
        projectId,
        requestedBy: req.user!.id,
        type,
        title,
        description,
        affectedPages,
        status: "pending",
      });
      
      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: client.id,
        action: "revision_requested",
        description: `${type === "major" ? "Major" : "Minor"} revision requested: ${title}`,
        ipAddress: req.ip,
      });
      
      res.json(revision);
    } catch (error) {
      console.error("Create revision error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Review a revision (admin approve/decline)
  app.patch("/api/admin/revisions/:id/review", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { action, adminNotes, declineReason, estimatedHours, additionalCost } = req.body;
      
      if (!["approve", "decline"].includes(action)) {
        return res.status(400).json({ error: "Invalid action" });
      }
      
      const revision = await storage.getRevision(id);
      if (!revision) {
        return res.status(404).json({ error: "Revision not found" });
      }
      
      const updatedRevision = await storage.updateRevision(id, {
        status: action === "approve" ? "approved" : "declined",
        reviewedBy: req.user!.id,
        reviewedAt: new Date(),
        adminNotes,
        declineReason: action === "decline" ? declineReason : null,
        estimatedHours: action === "approve" ? estimatedHours : null,
        additionalCost: action === "approve" ? additionalCost : null,
      });
      
      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: revision.clientId,
        action: action === "approve" ? "revision_approved" : "revision_declined",
        description: `Revision "${revision.title}" ${action === "approve" ? "approved" : "declined"}`,
        ipAddress: req.ip,
      });
      
      res.json(updatedRevision);
    } catch (error) {
      console.error("Review revision error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Start working on a revision (admin)
  app.patch("/api/admin/revisions/:id/start", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const revision = await storage.getRevision(id);
      if (!revision) {
        return res.status(404).json({ error: "Revision not found" });
      }
      
      if (revision.status !== "approved") {
        return res.status(400).json({ error: "Revision must be approved first" });
      }
      
      const updatedRevision = await storage.updateRevision(id, {
        status: "in_progress",
      });
      
      res.json(updatedRevision);
    } catch (error) {
      console.error("Start revision error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Complete a revision (admin)
  app.patch("/api/admin/revisions/:id/complete", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { completionNotes } = req.body;
      
      const revision = await storage.getRevision(id);
      if (!revision) {
        return res.status(404).json({ error: "Revision not found" });
      }
      
      if (revision.status !== "in_progress" && revision.status !== "approved") {
        return res.status(400).json({ error: "Revision must be in progress or approved" });
      }
      
      const updatedRevision = await storage.updateRevision(id, {
        status: "completed",
        completedBy: req.user!.id,
        completedAt: new Date(),
        completionNotes,
      });
      
      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: revision.clientId,
        action: "revision_completed",
        description: `Revision "${revision.title}" completed`,
        ipAddress: req.ip,
      });
      
      res.json(updatedRevision);
    } catch (error) {
      console.error("Complete revision error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Delete a revision (admin only, for pending revisions)
  app.delete("/api/admin/revisions/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const revision = await storage.getRevision(id);
      if (!revision) {
        return res.status(404).json({ error: "Revision not found" });
      }
      
      if (revision.status !== "pending" && revision.status !== "declined") {
        return res.status(400).json({ error: "Can only delete pending or declined revisions" });
      }
      
      await storage.deleteRevision(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete revision error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Get revisions for client's project
  app.get("/api/client/revisions", authenticateToken, requireClient, async (req: AuthRequest, res) => {
    try {
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.json([]);
      }
      
      const revisionList = await storage.getRevisionsByClientId(client.id);
      res.json(revisionList);
    } catch (error) {
      console.error("Get client revisions error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ OBJECT STORAGE ROUTES ============

  // Get upload URL for document files (admin only)
  app.post("/api/admin/documents/upload-url", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { filename } = req.body;
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const { uploadURL, objectPath } = await objectStorageService.getObjectEntityUploadURL(filename);
      res.json({ uploadURL, objectPath });
    } catch (error) {
      console.error("Get upload URL error:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Serve uploaded objects
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      const { ObjectNotFoundError } = await import("./objectStorage");
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ PUBLIC ROUTES ============

  app.get("/api/portfolio", async (req, res) => {
    try {
      const items = await storage.getPortfolioItems();
      res.json(items);
    } catch (error) {
      console.error("Get portfolio error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}

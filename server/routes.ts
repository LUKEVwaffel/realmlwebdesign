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
} from "./emailService";
import { generateInvoicePdf, generateInvoiceNumber } from "./invoiceService";
import { generateQuestionnairePdf } from "./questionnairePdfService";
import { generateTosPdf, TosGenerationResult } from "./tosPdfService";
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
    "created",
    "questionnaire_pending",
    "questionnaire_complete",
    "tos_pending",
    "tos_signed",
    "in_development",
    "hosting_setup",
    "deployed",
    "delivery",
    "client_review",
    "completed",
    "on_hold",
    "cancelled"
  ]),
});

const sendMessageSchema = z.object({
  messageText: z.string().min(1, "Message cannot be empty"),
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
        return res.status(401).json({ error: "Account is disabled" });
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

      if (user) {
        await storage.createActivityLog({
          userId: user.id,
          action: "password_reset_requested",
          description: "Password reset requested",
          ipAddress: req.ip,
        });
      }

      res.json({ success: true, message: "If the email exists, a reset link has been sent" });
    } catch (error) {
      console.error("Forgot password error:", error);
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

      res.json({
        project: project ? { ...project, client } : null,
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
      const { messageText } = parsed.data;
      const client = await storage.getClientByUserId(req.user!.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      const message = await storage.createMessage({
        clientId: client.id,
        senderId: req.user!.id,
        senderType: "client",
        messageText,
      });

      // Send real-time WebSocket notification to admins
      notifyNewMessage(client.id, {
        senderType: "client",
        senderName: `${req.user!.firstName} ${req.user!.lastName}`,
        preview: messageText.substring(0, 100),
      });

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
      res.json(questionnaire);
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
      const { status, ...questionnaireFields } = req.body;
      
      let questionnaire = await storage.getQuestionnaireByClientId(client.id);
      
      const updateData: any = {
        ...questionnaireFields,
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
        if (questionnaireFields.preferredColors) projectUpdates.primaryColor = questionnaireFields.preferredColors;
        
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
          return { ...project, client };
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
      const clientsList = await storage.getClients();
      const clientsWithUsers = await Promise.all(
        clientsList.map(async (client) => {
          const user = client.userId ? await storage.getUser(client.userId) : null;
          return { ...client, user: user ? { firstName: user.firstName, lastName: user.lastName, email: user.email } : null };
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
      
      res.json({
        ...client,
        user: user ? { firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone } : null,
        projects,
        payments,
        documents,
        messages,
        activity,
        uploads,
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

      const pdfBuffer = await generateQuestionnairePdf({
        questionnaire,
        client,
        project: projects[0],
        contactName,
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

      await storage.deleteClient(id);

      res.json({ success: true, message: "Client and all associated data deleted successfully" });
    } catch (error) {
      console.error("Delete client error:", error);
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

      res.json(payment);
    } catch (error) {
      console.error("Create payment error:", error);
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
      }

      res.json(document);
    } catch (error) {
      console.error("Create document error:", error);
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

      const existingProject = await storage.getProject(id);
      if (!existingProject) {
        return res.status(404).json({ error: "Project not found" });
      }
      const oldStatus = existingProject.status;

      const project = await storage.updateProject(id, { status });
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

      res.json({
        stats,
        projectsByStatus,
        topClients,
        revenueByMonth,
        clientAcquisition,
        projectMetrics,
        cancelledProjects: cancelledCount,
      });
    } catch (error) {
      console.error("Analytics error:", error);
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

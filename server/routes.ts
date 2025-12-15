import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { users, clients, projects, payments, documents, messages } from "@shared/schema";
import { loginSchema, changePasswordSchema, insertClientSchema, insertProjectSchema, insertMessageSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required for JWT signing");
}

const createClientRequestSchema = z.object({
  businessLegalName: z.string().min(1, "Business name is required"),
  businessEmail: z.string().email().optional(),
  businessPhone: z.string().optional(),
  industry: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
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
  status: z.enum(["pending_payment", "in_progress", "design_review", "development", "client_review", "revisions", "completed", "on_hold", "cancelled"]),
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

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
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

      res.json({ success: true });
    } catch (error) {
      console.error("Sign document error:", error);
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
      const parsed = createClientRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid data" });
      }
      const { businessLegalName, businessEmail, businessPhone, industry, firstName, lastName, email } = parsed.data;

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
        businessEmail: businessEmail || email,
        businessPhone,
        industry,
        createdBy: req.user!.id,
      });

      await storage.createActivityLog({
        userId: req.user!.id,
        clientId: client.id,
        action: "client_created",
        description: `Created client: ${businessLegalName}`,
        ipAddress: req.ip,
      });

      res.json({ ...client, user: { firstName, lastName, email }, tempPassword });
    } catch (error) {
      console.error("Create client error:", error);
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

  app.patch("/api/admin/projects/:id/status", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const parsed = updateProjectStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid data" });
      }
      const { status } = parsed.data;

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

      res.json(project);
    } catch (error) {
      console.error("Update project status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/analytics", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getAdminStats();
      const projectsByStatus = await storage.getProjectsByStatus();

      const clientsList = await storage.getClients();
      const topClients = await Promise.all(
        clientsList.slice(0, 5).map(async (client) => {
          const projectsList = await storage.getProjectsByClientId(client.id);
          const totalValue = projectsList.reduce((sum, p) => sum + parseFloat(p.totalCost || "0"), 0);
          return { ...client, projectCount: projectsList.length, totalValue };
        })
      );
      topClients.sort((a, b) => b.totalValue - a.totalValue);

      res.json({
        stats,
        projectsByStatus,
        topClients,
        revenueByMonth: [],
        cancelledProjects: 0,
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

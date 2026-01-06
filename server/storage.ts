import { db } from "./db";
import { eq, and, desc, sql, count, sum, or, inArray } from "drizzle-orm";
import {
  users,
  clients,
  projects,
  payments,
  documents,
  messages,
  activityLogs,
  portfolioItems,
  questionnaireResponses,
  clientUploads,
  closingQuestionnaires,
  emailNotifications,
  hostingCredentials,
  adminClientAccess,
  quotes,
  revisions,
  resources,
  cancellations,
  type User,
  type InsertUser,
  type Client,
  type InsertClient,
  type Project,
  type InsertProject,
  type Payment,
  type InsertPayment,
  type Document,
  type InsertDocument,
  type Message,
  type InsertMessage,
  type ActivityLog,
  type InsertActivityLog,
  type PortfolioItem,
  type InsertPortfolioItem,
  type QuestionnaireResponse,
  type InsertQuestionnaireResponse,
  type ClientUpload,
  type InsertClientUpload,
  type ClosingQuestionnaire,
  type InsertClosingQuestionnaire,
  type EmailNotification,
  type InsertEmailNotification,
  type HostingCredentials,
  type InsertHostingCredentials,
  type AdminClientAccess,
  type InsertAdminClientAccess,
  type Quote,
  type InsertQuote,
  type Revision,
  type InsertRevision,
  type Resource,
  type InsertResource,
  type Cancellation,
  type InsertCancellation,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;

  // Clients
  getClient(id: string): Promise<Client | undefined>;
  getClientByUserId(userId: string): Promise<Client | undefined>;
  getClients(): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, data: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<void>;

  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByClientId(clientId: string): Promise<Project[]>;
  getProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined>;

  // Payments
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByClientId(clientId: string): Promise<Payment[]>;
  getPaymentsByProjectId(projectId: string): Promise<Payment[]>;
  getPayments(): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | undefined>;
  deletePayment(id: string): Promise<void>;

  // Documents
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByClientId(clientId: string): Promise<Document[]>;
  getDocuments(): Promise<Document[]>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<void>;

  // Messages
  getMessagesByClientId(clientId: string): Promise<Message[]>;
  getMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<void>;

  // Activity Logs
  getActivityLogsByClientId(clientId: string): Promise<ActivityLog[]>;
  getActivityLogs(): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // Portfolio Items
  getPortfolioItems(): Promise<PortfolioItem[]>;
  createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem>;

  // Questionnaire
  getQuestionnaireByProjectId(projectId: string): Promise<QuestionnaireResponse | undefined>;
  getQuestionnaireByClientId(clientId: string): Promise<QuestionnaireResponse | undefined>;
  createQuestionnaire(data: InsertQuestionnaireResponse): Promise<QuestionnaireResponse>;
  updateQuestionnaire(id: string, data: Partial<InsertQuestionnaireResponse>): Promise<QuestionnaireResponse | undefined>;

  // Client Uploads
  getClientUploadsByClientId(clientId: string): Promise<ClientUpload[]>;
  getClientUploadsByProjectId(projectId: string): Promise<ClientUpload[]>;
  getClientUploads(): Promise<ClientUpload[]>;
  createClientUpload(upload: InsertClientUpload): Promise<ClientUpload>;
  updateClientUpload(id: string, data: Partial<InsertClientUpload>): Promise<ClientUpload | undefined>;
  deleteClientUpload(id: string): Promise<void>;

  // Closing Questionnaires
  getClosingQuestionnaireByProjectId(projectId: string): Promise<ClosingQuestionnaire | undefined>;
  createClosingQuestionnaire(data: InsertClosingQuestionnaire): Promise<ClosingQuestionnaire>;
  updateClosingQuestionnaire(id: string, data: Partial<InsertClosingQuestionnaire>): Promise<ClosingQuestionnaire | undefined>;

  // Email Notifications
  createEmailNotification(data: InsertEmailNotification): Promise<EmailNotification>;
  getEmailNotificationsByClientId(clientId: string): Promise<EmailNotification[]>;

  // Hosting Credentials
  getHostingCredentialsByProjectId(projectId: string): Promise<HostingCredentials | undefined>;
  createHostingCredentials(data: InsertHostingCredentials): Promise<HostingCredentials>;
  updateHostingCredentials(id: string, data: Partial<InsertHostingCredentials>): Promise<HostingCredentials | undefined>;

  // Admin Client Access (for multi-admin ownership)
  getClientsByAdminId(adminId: string): Promise<Client[]>;
  getAccessibleClientIds(adminId: string): Promise<{ clientId: string; accessLevel: string }[]>;
  canAdminEditClient(adminId: string, clientId: string): Promise<boolean>;
  getAdminClientAccess(clientId: string): Promise<AdminClientAccess[]>;
  grantClientAccess(data: InsertAdminClientAccess): Promise<AdminClientAccess>;
  revokeClientAccess(id: string): Promise<void>;
  getAdmins(): Promise<User[]>;

  // Quotes
  getQuote(id: string): Promise<Quote | undefined>;
  getQuotesByClientId(clientId: string): Promise<Quote[]>;
  getQuotesByAdminId(adminId: string): Promise<Quote[]>;
  createQuote(data: InsertQuote): Promise<Quote>;
  updateQuote(id: string, data: Partial<InsertQuote>): Promise<Quote | undefined>;
  deleteQuote(id: string): Promise<void>;

  // Revisions
  getRevision(id: string): Promise<Revision | undefined>;
  getRevisionsByProjectId(projectId: string): Promise<Revision[]>;
  getRevisionsByClientId(clientId: string): Promise<Revision[]>;
  createRevision(data: InsertRevision): Promise<Revision>;
  updateRevision(id: string, data: Partial<InsertRevision>): Promise<Revision | undefined>;
  deleteRevision(id: string): Promise<void>;
  getPendingRevisions(): Promise<Revision[]>;

  // Admin Users
  getAdminUsers(): Promise<User[]>;
  
  // All Payments
  getAllPayments(): Promise<Payment[]>;
  
  // All Quotes
  getQuotes(): Promise<Quote[]>;

  // Leaderboard
  getAdminLeaderboard(): Promise<{
    adminId: string;
    adminName: string;
    totalClients: number;
    totalRevenue: number;
    completedProjects: number;
    activeProjects: number;
  }[]>;

  // Analytics & Dashboard
  getAdminStats(): Promise<{
    totalClients: number;
    activeProjects: number;
    completedProjects: number;
    totalRevenue: number;
    pendingRevenue: number;
    completionRate: number;
    averageProjectValue: number;
    averageProjectDuration: number;
  }>;
  getProjectsByStatus(): Promise<{ status: string | null; count: number }[]>;
  getOverduePayments(): Promise<Payment[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(sql`LOWER(${users.email}) = LOWER(${email})`);
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return updated;
  }

  // Clients
  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getClientByUserId(userId: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.userId, userId));
    return client;
  }

  async getClients(): Promise<Client[]> {
    return db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: string, data: Partial<InsertClient>): Promise<Client | undefined> {
    const [updated] = await db.update(clients).set({ ...data, updatedAt: new Date() }).where(eq(clients.id, id)).returning();
    return updated;
  }

  async deleteClient(id: string): Promise<void> {
    const client = await this.getClient(id);
    if (!client) return;

    await db.delete(clientUploads).where(eq(clientUploads.clientId, id));
    await db.delete(activityLogs).where(eq(activityLogs.clientId, id));
    await db.delete(messages).where(eq(messages.clientId, id));
    await db.delete(documents).where(eq(documents.clientId, id));
    await db.delete(payments).where(eq(payments.clientId, id));
    await db.delete(questionnaireResponses).where(eq(questionnaireResponses.clientId, id));
    await db.delete(projects).where(eq(projects.clientId, id));
    await db.delete(clients).where(eq(clients.id, id));
    
    if (client.userId) {
      await db.delete(users).where(eq(users.id, client.userId));
    }
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjectsByClientId(clientId: string): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.clientId, clientId)).orderBy(desc(projects.createdAt));
  }

  async getProjects(): Promise<Project[]> {
    return db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db.update(projects).set({ ...data, updatedAt: new Date() }).where(eq(projects.id, id)).returning();
    return updated;
  }

  // Payments
  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getPaymentsByClientId(clientId: string): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.clientId, clientId)).orderBy(desc(payments.createdAt));
  }

  async getPaymentsByProjectId(projectId: string): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.projectId, projectId)).orderBy(payments.paymentNumber);
  }

  async getPayments(): Promise<Payment[]> {
    return db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [updated] = await db.update(payments).set({ ...data, updatedAt: new Date() }).where(eq(payments.id, id)).returning();
    return updated;
  }

  async deletePayment(id: string): Promise<void> {
    await db.delete(payments).where(eq(payments.id, id));
  }

  // Documents
  async getDocument(id: string): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async getDocumentsByClientId(clientId: string): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.clientId, clientId)).orderBy(desc(documents.createdAt));
  }

  async getDocuments(): Promise<Document[]> {
    return db.select().from(documents).orderBy(desc(documents.createdAt));
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [newDoc] = await db.insert(documents).values(doc).returning();
    return newDoc;
  }

  async updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document | undefined> {
    const [updated] = await db.update(documents).set({ ...data, updatedAt: new Date() }).where(eq(documents.id, id)).returning();
    return updated;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Messages
  async getMessagesByClientId(clientId: string): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.clientId, clientId)).orderBy(messages.createdAt);
  }

  async getMessages(): Promise<Message[]> {
    return db.select().from(messages).orderBy(desc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async markMessageAsRead(id: string): Promise<void> {
    await db.update(messages).set({ isRead: true, readAt: new Date() }).where(eq(messages.id, id));
  }

  async markMessagesAsReadByClient(clientId: string, senderType: "admin" | "client"): Promise<void> {
    await db.update(messages)
      .set({ isRead: true, readAt: new Date() })
      .where(and(
        eq(messages.clientId, clientId),
        eq(messages.senderType, senderType),
        eq(messages.isRead, false)
      ));
  }

  async getUnreadMessageCount(clientId: string, forRole: "admin" | "client"): Promise<number> {
    // For admin: count unread messages from client
    // For client: count unread messages from admin
    const senderType = forRole === "admin" ? "client" : "admin";
    const [result] = await db.select({ count: count() })
      .from(messages)
      .where(and(
        eq(messages.clientId, clientId),
        eq(messages.senderType, senderType),
        eq(messages.isRead, false)
      ));
    return result?.count || 0;
  }

  async getTotalUnreadMessagesForAdmin(): Promise<number> {
    const [result] = await db.select({ count: count() })
      .from(messages)
      .where(and(
        eq(messages.senderType, "client"),
        eq(messages.isRead, false)
      ));
    return result?.count || 0;
  }

  async getLastMessageByClient(clientId: string): Promise<Message | null> {
    const result = await db.select()
      .from(messages)
      .where(eq(messages.clientId, clientId))
      .orderBy(desc(messages.createdAt))
      .limit(1);
    return result[0] || null;
  }

  // Activity Logs
  async getActivityLogsByClientId(clientId: string): Promise<ActivityLog[]> {
    return db.select().from(activityLogs).where(eq(activityLogs.clientId, clientId)).orderBy(desc(activityLogs.createdAt)).limit(20);
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(50);
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  // Portfolio Items
  async getPortfolioItems(): Promise<PortfolioItem[]> {
    return db.select().from(portfolioItems).where(eq(portfolioItems.isVisible, true)).orderBy(portfolioItems.displayOrder);
  }

  async createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem> {
    const [newItem] = await db.insert(portfolioItems).values(item).returning();
    return newItem;
  }

  // Dashboard aggregations
  async getAdminStats() {
    const [clientCount] = await db.select({ count: count() }).from(clients);
    const [activeProjects] = await db.select({ count: count() }).from(projects).where(
      and(
        sql`${projects.status} NOT IN ('completed', 'cancelled')`
      )
    );
    const [completedProjects] = await db.select({ count: count() }).from(projects).where(eq(projects.status, "completed"));
    const [revenueResult] = await db.select({ total: sum(payments.paidAmount) }).from(payments).where(eq(payments.status, "paid"));
    const [pendingResult] = await db.select({ total: sum(payments.amount) }).from(payments).where(eq(payments.status, "pending"));

    const totalRevenue = parseFloat(revenueResult?.total || "0");
    const pendingRevenue = parseFloat(pendingResult?.total || "0");
    const totalProjects = (activeProjects?.count || 0) + (completedProjects?.count || 0);
    const completionRate = totalProjects > 0 ? Math.round((completedProjects?.count || 0) / totalProjects * 100) : 0;

    return {
      totalClients: clientCount?.count || 0,
      activeProjects: activeProjects?.count || 0,
      completedProjects: completedProjects?.count || 0,
      totalRevenue,
      pendingRevenue,
      completionRate,
      averageProjectValue: totalProjects > 0 ? Math.round(totalRevenue / totalProjects) : 0,
      averageProjectDuration: 6,
    };
  }

  async getProjectsByStatus() {
    const result = await db.select({
      status: projects.status,
      count: count(),
    }).from(projects).groupBy(projects.status);
    return result;
  }

  async getOverduePayments(): Promise<Payment[]> {
    return db.select().from(payments)
      .where(and(
        eq(payments.status, "pending"),
        sql`${payments.dueDate} < CURRENT_DATE`
      ))
      .orderBy(payments.dueDate)
      .limit(10);
  }

  async getRevenueByMonth(): Promise<{ month: string; revenue: number }[]> {
    const result = await db.execute(sql`
      SELECT 
        TO_CHAR(paid_at, 'YYYY-MM') as month,
        COALESCE(SUM(paid_amount), 0) as revenue
      FROM ${payments}
      WHERE status = 'paid' AND paid_at IS NOT NULL
      GROUP BY TO_CHAR(paid_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `);
    return (result.rows as any[]).map(row => ({
      month: row.month,
      revenue: parseFloat(row.revenue || "0"),
    })).reverse();
  }

  async getClientAcquisitionByMonth(): Promise<{ month: string; count: number }[]> {
    const result = await db.execute(sql`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as count
      FROM ${clients}
      WHERE created_at IS NOT NULL
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `);
    return (result.rows as any[]).map(row => ({
      month: row.month,
      count: parseInt(row.count || "0"),
    })).reverse();
  }

  async getProjectCompletionMetrics(): Promise<{
    averageCompletionDays: number;
    projectsByType: { type: string; count: number }[];
    completionRateByMonth: { month: string; completed: number; total: number }[];
  }> {
    const projectsByType = await db.select({
      type: projects.projectType,
      count: count(),
    }).from(projects).groupBy(projects.projectType);

    const completionRateResult = await db.execute(sql`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) as total
      FROM ${projects}
      WHERE created_at IS NOT NULL
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `);

    const completionRateByMonth = (completionRateResult.rows as any[]).map(row => ({
      month: row.month,
      completed: parseInt(row.completed || "0"),
      total: parseInt(row.total || "0"),
    })).reverse();

    return {
      averageCompletionDays: 45,
      projectsByType: projectsByType.map(p => ({ type: p.type, count: p.count })),
      completionRateByMonth,
    };
  }

  // Questionnaire
  async getQuestionnaireByProjectId(projectId: string): Promise<QuestionnaireResponse | undefined> {
    const [response] = await db.select().from(questionnaireResponses).where(eq(questionnaireResponses.projectId, projectId));
    return response;
  }

  async getQuestionnaireByClientId(clientId: string): Promise<QuestionnaireResponse | undefined> {
    const [response] = await db.select().from(questionnaireResponses).where(eq(questionnaireResponses.clientId, clientId));
    return response;
  }

  async createQuestionnaire(data: InsertQuestionnaireResponse): Promise<QuestionnaireResponse> {
    const [response] = await db.insert(questionnaireResponses).values(data).returning();
    return response;
  }

  async updateQuestionnaire(id: string, data: Partial<InsertQuestionnaireResponse>): Promise<QuestionnaireResponse | undefined> {
    const [updated] = await db.update(questionnaireResponses).set({ ...data, updatedAt: new Date() }).where(eq(questionnaireResponses.id, id)).returning();
    return updated;
  }

  // Client Uploads
  async getClientUploadsByClientId(clientId: string): Promise<ClientUpload[]> {
    return db.select().from(clientUploads).where(eq(clientUploads.clientId, clientId)).orderBy(desc(clientUploads.createdAt));
  }

  async getClientUploadsByProjectId(projectId: string): Promise<ClientUpload[]> {
    return db.select().from(clientUploads).where(eq(clientUploads.projectId, projectId)).orderBy(desc(clientUploads.createdAt));
  }

  async getClientUploads(): Promise<ClientUpload[]> {
    return db.select().from(clientUploads).orderBy(desc(clientUploads.createdAt));
  }

  async createClientUpload(upload: InsertClientUpload): Promise<ClientUpload> {
    const [newUpload] = await db.insert(clientUploads).values(upload).returning();
    return newUpload;
  }

  async updateClientUpload(id: string, data: Partial<InsertClientUpload>): Promise<ClientUpload | undefined> {
    const [updated] = await db.update(clientUploads).set(data).where(eq(clientUploads.id, id)).returning();
    return updated;
  }

  async deleteClientUpload(id: string): Promise<void> {
    await db.delete(clientUploads).where(eq(clientUploads.id, id));
  }

  // Closing Questionnaires
  async getClosingQuestionnaireByProjectId(projectId: string): Promise<ClosingQuestionnaire | undefined> {
    const [response] = await db.select().from(closingQuestionnaires).where(eq(closingQuestionnaires.projectId, projectId));
    return response;
  }

  async createClosingQuestionnaire(data: InsertClosingQuestionnaire): Promise<ClosingQuestionnaire> {
    const [response] = await db.insert(closingQuestionnaires).values(data).returning();
    return response;
  }

  async updateClosingQuestionnaire(id: string, data: Partial<InsertClosingQuestionnaire>): Promise<ClosingQuestionnaire | undefined> {
    const [updated] = await db.update(closingQuestionnaires).set(data).where(eq(closingQuestionnaires.id, id)).returning();
    return updated;
  }

  // Email Notifications
  async createEmailNotification(data: InsertEmailNotification): Promise<EmailNotification> {
    const [notification] = await db.insert(emailNotifications).values(data).returning();
    return notification;
  }

  async getEmailNotificationsByClientId(clientId: string): Promise<EmailNotification[]> {
    return db.select().from(emailNotifications).where(eq(emailNotifications.clientId, clientId)).orderBy(desc(emailNotifications.createdAt));
  }

  // Hosting Credentials
  async getHostingCredentialsByProjectId(projectId: string): Promise<HostingCredentials | undefined> {
    const [credentials] = await db.select().from(hostingCredentials).where(eq(hostingCredentials.projectId, projectId));
    return credentials;
  }

  async createHostingCredentials(data: InsertHostingCredentials): Promise<HostingCredentials> {
    const [credentials] = await db.insert(hostingCredentials).values(data).returning();
    return credentials;
  }

  async updateHostingCredentials(id: string, data: Partial<InsertHostingCredentials>): Promise<HostingCredentials | undefined> {
    const [updated] = await db.update(hostingCredentials).set({ ...data, updatedAt: new Date() }).where(eq(hostingCredentials.id, id)).returning();
    return updated;
  }

  // Admin Client Access (for multi-admin ownership)
  async getClientsByAdminId(adminId: string): Promise<Client[]> {
    return db.select().from(clients).where(eq(clients.createdBy, adminId)).orderBy(desc(clients.createdAt));
  }

  async getAccessibleClientIds(adminId: string): Promise<{ clientId: string; accessLevel: string }[]> {
    // Get clients owned by this admin (they have full edit access)
    const ownedClients = await db.select({ clientId: clients.id }).from(clients).where(eq(clients.createdBy, adminId));
    const ownedWithAccess = ownedClients.map(c => ({ clientId: c.clientId, accessLevel: "edit" }));

    // Get clients granted access to
    const grantedAccess = await db.select({
      clientId: adminClientAccess.clientId,
      accessLevel: adminClientAccess.accessLevel,
    }).from(adminClientAccess).where(
      and(
        eq(adminClientAccess.adminId, adminId),
        or(
          sql`${adminClientAccess.expiresAt} IS NULL`,
          sql`${adminClientAccess.expiresAt} > NOW()`
        )
      )
    );

    // Combine and dedupe, preferring edit over view
    const accessMap = new Map<string, string>();
    for (const item of [...ownedWithAccess, ...grantedAccess]) {
      const existing = accessMap.get(item.clientId);
      if (!existing || (existing === "view" && item.accessLevel === "edit")) {
        accessMap.set(item.clientId, item.accessLevel);
      }
    }

    return Array.from(accessMap.entries()).map(([clientId, accessLevel]) => ({ clientId, accessLevel }));
  }

  async canAdminEditClient(adminId: string, clientId: string): Promise<boolean> {
    // Check if admin owns the client
    const client = await this.getClient(clientId);
    if (client?.createdBy === adminId) return true;

    // Check for granted edit access
    const [access] = await db.select().from(adminClientAccess).where(
      and(
        eq(adminClientAccess.adminId, adminId),
        eq(adminClientAccess.clientId, clientId),
        eq(adminClientAccess.accessLevel, "edit"),
        or(
          sql`${adminClientAccess.expiresAt} IS NULL`,
          sql`${adminClientAccess.expiresAt} > NOW()`
        )
      )
    );

    return !!access;
  }

  async getAdminClientAccess(clientId: string): Promise<AdminClientAccess[]> {
    return db.select().from(adminClientAccess).where(eq(adminClientAccess.clientId, clientId));
  }

  async grantClientAccess(data: InsertAdminClientAccess): Promise<AdminClientAccess> {
    // Remove existing access first to avoid duplicates
    await db.delete(adminClientAccess).where(
      and(
        eq(adminClientAccess.clientId, data.clientId),
        eq(adminClientAccess.adminId, data.adminId)
      )
    );
    const [access] = await db.insert(adminClientAccess).values(data).returning();
    return access;
  }

  async revokeClientAccess(id: string): Promise<void> {
    await db.delete(adminClientAccess).where(eq(adminClientAccess.id, id));
  }

  async getAdmins(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, "admin")).orderBy(users.firstName);
  }

  // Quotes
  async getQuote(id: string): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote;
  }

  async getQuotesByClientId(clientId: string): Promise<Quote[]> {
    return db.select().from(quotes).where(eq(quotes.clientId, clientId)).orderBy(desc(quotes.createdAt));
  }

  async getQuotesByAdminId(adminId: string): Promise<Quote[]> {
    return db.select().from(quotes).where(eq(quotes.createdBy, adminId)).orderBy(desc(quotes.createdAt));
  }

  async createQuote(data: InsertQuote): Promise<Quote> {
    const [quote] = await db.insert(quotes).values(data).returning();
    return quote;
  }

  async updateQuote(id: string, data: Partial<InsertQuote>): Promise<Quote | undefined> {
    const [updated] = await db.update(quotes).set({ ...data, updatedAt: new Date() }).where(eq(quotes.id, id)).returning();
    return updated;
  }

  async deleteQuote(id: string): Promise<void> {
    await db.delete(quotes).where(eq(quotes.id, id));
  }

  // Admin Users (alias for getAdmins for clarity)
  async getAdminUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, "admin")).orderBy(users.firstName);
  }

  // All Payments
  async getAllPayments(): Promise<Payment[]> {
    return db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  // All Quotes
  async getQuotes(): Promise<Quote[]> {
    return db.select().from(quotes).orderBy(desc(quotes.createdAt));
  }

  // Leaderboard
  async getAdminLeaderboard(): Promise<{
    adminId: string;
    adminName: string;
    totalClients: number;
    totalRevenue: number;
    completedProjects: number;
    activeProjects: number;
  }[]> {
    // Get all admins
    const admins = await this.getAdmins();
    
    const leaderboard = await Promise.all(admins.map(async (admin) => {
      // Count clients created by this admin
      const clientList = await db.select({ id: clients.id }).from(clients).where(eq(clients.createdBy, admin.id));
      const clientIds = clientList.map(c => c.id);
      
      let totalRevenue = 0;
      let completedProjects = 0;
      let activeProjects = 0;

      if (clientIds.length > 0) {
        // Get payments for these clients
        const paidPayments = await db.select({ amount: payments.amount })
          .from(payments)
          .where(and(
            inArray(payments.clientId, clientIds),
            eq(payments.status, "paid")
          ));
        totalRevenue = paidPayments.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);

        // Get project counts
        const projectStats = await db.select({ status: projects.status })
          .from(projects)
          .where(inArray(projects.clientId, clientIds));
        
        for (const p of projectStats) {
          if (p.status === "completed") completedProjects++;
          else if (p.status !== "cancelled" && p.status !== "on_hold") activeProjects++;
        }
      }

      return {
        adminId: admin.id,
        adminName: `${admin.firstName} ${admin.lastName}`,
        totalClients: clientIds.length,
        totalRevenue,
        completedProjects,
        activeProjects,
      };
    }));

    // Sort by total revenue descending
    return leaderboard.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  // Revisions
  async getRevision(id: string): Promise<Revision | undefined> {
    const [revision] = await db.select().from(revisions).where(eq(revisions.id, id));
    return revision;
  }

  async getRevisionsByProjectId(projectId: string): Promise<Revision[]> {
    return db.select().from(revisions).where(eq(revisions.projectId, projectId)).orderBy(desc(revisions.createdAt));
  }

  async getRevisionsByClientId(clientId: string): Promise<Revision[]> {
    return db.select().from(revisions).where(eq(revisions.clientId, clientId)).orderBy(desc(revisions.createdAt));
  }

  async createRevision(data: InsertRevision): Promise<Revision> {
    const [revision] = await db.insert(revisions).values(data).returning();
    return revision;
  }

  async updateRevision(id: string, data: Partial<InsertRevision>): Promise<Revision | undefined> {
    const [updated] = await db.update(revisions).set({ ...data, updatedAt: new Date() }).where(eq(revisions.id, id)).returning();
    return updated;
  }

  async deleteRevision(id: string): Promise<void> {
    await db.delete(revisions).where(eq(revisions.id, id));
  }

  async getPendingRevisions(): Promise<Revision[]> {
    return db.select().from(revisions).where(eq(revisions.status, "pending")).orderBy(desc(revisions.createdAt));
  }

  // Resources
  async getResource(id: string): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }

  async getResources(): Promise<Resource[]> {
    return db.select().from(resources).orderBy(resources.sortOrder, resources.title);
  }

  async getPublishedResources(): Promise<Resource[]> {
    return db.select().from(resources)
      .where(and(eq(resources.isPublished, true), eq(resources.isClientVisible, true)))
      .orderBy(resources.sortOrder, resources.title);
  }

  async getResourcesByCategory(category: string): Promise<Resource[]> {
    return db.select().from(resources)
      .where(eq(resources.category, category as any))
      .orderBy(resources.sortOrder, resources.title);
  }

  async createResource(data: InsertResource): Promise<Resource> {
    const [resource] = await db.insert(resources).values(data).returning();
    return resource;
  }

  async updateResource(id: string, data: Partial<InsertResource>): Promise<Resource | undefined> {
    const [updated] = await db.update(resources).set({ ...data, updatedAt: new Date() }).where(eq(resources.id, id)).returning();
    return updated;
  }

  async deleteResource(id: string): Promise<void> {
    await db.delete(resources).where(eq(resources.id, id));
  }

  // Payment helpers
  async isDepositPaidForProject(projectId: string): Promise<boolean> {
    const depositPayments = await db.select()
      .from(payments)
      .where(and(
        eq(payments.projectId, projectId),
        eq(payments.paymentType, "deposit"),
        eq(payments.status, "paid")
      ));
    return depositPayments.length > 0;
  }

  // Cancellations
  async getCancellation(id: string): Promise<Cancellation | undefined> {
    const [cancellation] = await db.select().from(cancellations).where(eq(cancellations.id, id));
    return cancellation;
  }

  async getCancellationByProjectId(projectId: string): Promise<Cancellation | undefined> {
    const [cancellation] = await db.select().from(cancellations).where(eq(cancellations.projectId, projectId));
    return cancellation;
  }

  async getCancellations(): Promise<Cancellation[]> {
    return db.select().from(cancellations).orderBy(desc(cancellations.createdAt));
  }

  async createCancellation(data: InsertCancellation): Promise<Cancellation> {
    const [cancellation] = await db.insert(cancellations).values(data).returning();
    return cancellation;
  }

  async updateCancellation(id: string, data: Partial<InsertCancellation>): Promise<Cancellation | undefined> {
    const [updated] = await db.update(cancellations).set({ ...data, updatedAt: new Date() }).where(eq(cancellations.id, id)).returning();
    return updated;
  }

  async deleteCancellation(id: string): Promise<void> {
    await db.delete(cancellations).where(eq(cancellations.id, id));
  }
}

export const storage = new DatabaseStorage();

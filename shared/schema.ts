import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, decimal, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "client"]);
export const businessTypeEnum = pgEnum("business_type", ["sole_proprietor", "llc", "corporation", "partnership", "other"]);
export const contactMethodEnum = pgEnum("contact_method", ["email", "phone", "text", "no_preference"]);
export const clientSourceEnum = pgEnum("client_source", ["referral", "cold_call", "social_media", "previous_client", "networking", "other"]);
export const priorityEnum = pgEnum("priority", ["high", "normal", "low"]);
export const projectTypeEnum = pgEnum("project_type", ["new_website", "redesign", "landing_page", "ecommerce", "other"]);
export const paymentStructureEnum = pgEnum("payment_structure", ["50_50", "custom", "full_upfront"]);
export const projectStatusEnum = pgEnum("project_status", [
  // Phase 1: Client Onboarding
  "draft",                      // Phase 1: Admin created client, not yet sent welcome email
  "created",                    // Phase 1: Client account created, welcome email sent
  
  // Phase 2: Client Questionnaire
  "questionnaire_pending",      // Phase 2: Waiting for client to complete questionnaire
  "questionnaire_complete",     // Phase 2: Client completed questionnaire
  
  // Phase 3: Quote & Agreement
  "quote_draft",               // Phase 3: Admin is drafting quote
  "quote_sent",                // Phase 3: Quote sent to client
  "quote_approved",            // Phase 3: Client approved quote, awaiting TOS + deposit
  "tos_pending",               // Phase 3: Awaiting TOS signature
  "tos_signed",                // Phase 3: TOS signed, awaiting deposit
  "deposit_pending",           // Phase 3: Awaiting 50% deposit payment
  "deposit_paid",              // Phase 3: 50% deposit received - Phase 3 complete
  
  // Phase 4: Design Consultation
  "design_pending",            // Phase 4: Awaiting design template selection
  "design_sent",               // Phase 4: Admin sent design options to client
  "design_approved",           // Phase 4: Client approved design - Phase 4 complete
  
  // Phase 5: Website Development
  "in_development",            // Phase 5: Website actively being built
  
  // Phase 6: Ready for Review
  "ready_for_review",          // Phase 6: Development complete, ready for client preview
  
  // Phase 7: Client Review & Delivery
  "client_review",             // Phase 7: Client reviewing the site
  "revisions_pending",         // Phase 7: Client requested revisions
  "revisions_complete",        // Phase 7: All revisions done
  "awaiting_final_payment",    // Phase 7: Awaiting 50% final payment
  "payment_complete",          // Phase 7: Final payment received
  
  // Phase 7A: Hosting & Domain Setup
  "hosting_setup_pending",     // Phase 7A: Awaiting client hosting credentials
  "hosting_configured",        // Phase 7A: Hosting configured, ready for final delivery
  
  // Final
  "completed",                 // Project fully delivered
  
  // Special States
  "on_hold",                   // Project paused
  "cancelled"                  // Project cancelled
]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "overdue", "cancelled", "failed", "refunded"]);
export const paymentTypeEnum = pgEnum("payment_type", ["deposit", "milestone", "final", "addon", "revision", "other"]);
export const documentTypeEnum = pgEnum("document_type", [
  "contract",
  "invoice", 
  "deliverable",
  "mockup",
  "asset",
  "upload",
  "terms_of_service",      // Auto-generated TOS
  "design_requirements",   // Design consultation document
  "hosting_instructions",  // Hosting setup guide
  "completion_document",   // Final project completion doc
  "resource",              // Global resource library item (guides, PDFs, templates)
  "other"
]);
export const signatureTypeEnum = pgEnum("signature_type", ["drawn", "typed"]);
export const senderTypeEnum = pgEnum("sender_type", ["admin", "client"]);
export const messageCategoryEnum = pgEnum("message_category", ["general", "development_feedback", "revision_request", "support"]);
export const siteTypeEnum = pgEnum("site_type", ["business", "portfolio", "ecommerce", "blog", "landing_page", "nonprofit", "restaurant", "real_estate", "other"]);
export const designStyleEnum = pgEnum("design_style", ["modern", "minimal", "bold", "elegant", "playful", "corporate", "creative", "classic"]);
export const uploadCategoryEnum = pgEnum("upload_category", ["logo", "brand_assets", "photos", "content", "documents", "inspiration", "other"]);
export const questionnaireStatusEnum = pgEnum("questionnaire_status", ["not_started", "in_progress", "completed"]);
export const documentStatusEnum = pgEnum("document_status", ["draft", "ready_for_signature", "pending_signature", "signed"]);
export const quoteStatusEnum = pgEnum("quote_status", ["draft", "sent", "viewed", "approved", "rejected", "expired"]);
export const accessLevelEnum = pgEnum("access_level", ["view", "edit"]);
export const revisionTypeEnum = pgEnum("revision_type", ["minor", "major"]);
export const revisionStatusEnum = pgEnum("revision_status", ["pending", "approved", "declined", "in_progress", "completed"]);

// Users Table
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("client"),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true),
  mustChangePassword: boolean("must_change_password").default(true),
  resetToken: varchar("reset_token", { length: 255 }),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  
  // Fast login PIN for admins
  pinHash: varchar("pin_hash", { length: 255 }),
  pinEnabled: boolean("pin_enabled").default(false),
  pinFailedAttempts: integer("pin_failed_attempts").default(0),
  pinLockedUntil: timestamp("pin_locked_until"),
});

// Clients Table
export const clients = pgTable("clients", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  
  // Business Information
  businessLegalName: varchar("business_legal_name", { length: 255 }).notNull(),
  businessDba: varchar("business_dba", { length: 255 }),
  businessType: businessTypeEnum("business_type"),
  industry: varchar("industry", { length: 100 }),
  taxId: varchar("tax_id", { length: 20 }),
  businessPhone: varchar("business_phone", { length: 20 }),
  businessEmail: varchar("business_email", { length: 255 }),
  
  // Business Address
  addressStreet: varchar("address_street", { length: 255 }),
  addressCity: varchar("address_city", { length: 100 }),
  addressState: varchar("address_state", { length: 50 }),
  addressZip: varchar("address_zip", { length: 10 }),
  addressCountry: varchar("address_country", { length: 50 }).default("USA"),
  
  // Online Presence
  existingWebsite: varchar("existing_website", { length: 255 }),
  facebookUrl: varchar("facebook_url", { length: 255 }),
  instagramUrl: varchar("instagram_url", { length: 255 }),
  otherSocial: text("other_social"),
  
  // Primary Contact
  primaryContactTitle: varchar("primary_contact_title", { length: 100 }),
  primaryContactPreferredMethod: contactMethodEnum("primary_contact_preferred_method"),
  primaryContactBestTime: varchar("primary_contact_best_time", { length: 100 }),
  
  // Secondary Contact
  secondaryContactName: varchar("secondary_contact_name", { length: 200 }),
  secondaryContactRelationship: varchar("secondary_contact_relationship", { length: 100 }),
  secondaryContactEmail: varchar("secondary_contact_email", { length: 255 }),
  secondaryContactPhone: varchar("secondary_contact_phone", { length: 20 }),
  
  // Project Assignment
  assignedTo: varchar("assigned_to", { length: 36 }).references(() => users.id),
  
  // Client Source
  source: clientSourceEnum("source"),
  sourceDetails: varchar("source_details", { length: 255 }),
  
  // Priority
  priority: priorityEnum("priority").default("normal"),
  
  // Internal Notes
  internalNotes: text("internal_notes"),
  
  // Saved Signature (from signed documents)
  savedSignature: text("saved_signature"),
  savedSignatureType: signatureTypeEnum("saved_signature_type"),
  signatureSavedAt: timestamp("signature_saved_at"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by", { length: 36 }).references(() => users.id),
});

// Projects Table
export const projects = pgTable("projects", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id", { length: 36 }).references(() => clients.id).notNull(),
  
  // Project Type
  projectType: projectTypeEnum("project_type").notNull(),
  projectTypeOther: varchar("project_type_other", { length: 255 }),
  
  // Site Settings (filled from questionnaire or admin)
  siteType: siteTypeEnum("site_type"),
  designStyle: designStyleEnum("design_style"),
  primaryColor: varchar("primary_color", { length: 7 }),
  secondaryColor: varchar("secondary_color", { length: 7 }),
  targetAudience: text("target_audience"),
  mainGoals: text("main_goals"),
  competitors: text("competitors"),
  uniqueSellingPoints: text("unique_selling_points"),
  
  // Content Settings
  hasExistingContent: boolean("has_existing_content").default(false),
  needsCopywriting: boolean("needs_copywriting").default(false),
  needsPhotography: boolean("needs_photography").default(false),
  
  // Technical Settings
  needsHosting: boolean("needs_hosting").default(true),
  needsDomain: boolean("needs_domain").default(false),
  domainName: varchar("domain_name", { length: 255 }),
  needsEmail: boolean("needs_email").default(false),
  needsSsl: boolean("needs_ssl").default(true),
  
  // Features Needed
  needsContactForm: boolean("needs_contact_form").default(true),
  needsBlog: boolean("needs_blog").default(false),
  needsGallery: boolean("needs_gallery").default(false),
  needsBooking: boolean("needs_booking").default(false),
  needsPayments: boolean("needs_payments").default(false),
  needsSocialIntegration: boolean("needs_social_integration").default(false),
  additionalFeatures: text("additional_features"),
  
  // SEO & Marketing
  needsSeo: boolean("needs_seo").default(true),
  needsAnalytics: boolean("needs_analytics").default(true),
  existingGoogleAnalytics: varchar("existing_google_analytics", { length: 50 }),
  
  // Maintenance Settings
  maintenancePlan: varchar("maintenance_plan", { length: 50 }),
  maintenanceStartDate: date("maintenance_start_date"),
  
  // Questionnaire Status
  questionnaireStatus: questionnaireStatusEnum("questionnaire_status").default("not_started"),
  
  // Services (stored as JSON array)
  servicesIncluded: text("services_included").array(),
  
  // Scope
  numberOfPages: integer("number_of_pages"),
  specialRequirements: text("special_requirements"),
  
  // Pricing
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  paymentStructure: paymentStructureEnum("payment_structure").default("50_50"),
  
  // Timeline
  startDate: date("start_date"),
  expectedCompletionDate: date("expected_completion_date"),
  estimatedDurationWeeks: integer("estimated_duration_weeks"),
  actualCompletionDate: date("actual_completion_date"),
  
  // Status
  status: projectStatusEnum("status").default("created"),
  progressPercentage: integer("progress_percentage").default(0),
  
  // Phase Timestamps (for workflow tracking)
  questionnaireCompletedAt: timestamp("questionnaire_completed_at"),
  tosSignedAt: timestamp("tos_signed_at"),
  designApprovedAt: timestamp("design_approved_at"),
  developmentStartedAt: timestamp("development_started_at"),
  hostingSetupAt: timestamp("hosting_setup_at"),
  deployedAt: timestamp("deployed_at"),
  deliveryStartedAt: timestamp("delivery_started_at"),
  completedAt: timestamp("completed_at"),
  
  // Warranty Tracking (25-day support period after completion)
  warrantyStartDate: timestamp("warranty_start_date"),
  warrantyEndDate: timestamp("warranty_end_date"),
  warrantyReminderSent: boolean("warranty_reminder_sent").default(false),
  warrantyExpiryNotified: boolean("warranty_expiry_notified").default(false),
  warrantyNotes: text("warranty_notes"),
  
  // On-Hold Tracking
  onHoldReason: text("on_hold_reason"),
  onHoldAt: timestamp("on_hold_at"),
  resumptionDate: date("resumption_date"),
  onHoldByUserId: varchar("on_hold_by_user_id", { length: 36 }),
  
  // Phase 4: Design Template Selection
  designTemplateUrls: text("design_template_urls").array(),  // Array of 4 template screenshot URLs
  designTemplatesSentAt: timestamp("design_templates_sent_at"),
  selectedTemplateIndex: integer("selected_template_index"),  // Which template client selected (0-3)
  selectedTemplateUrl: varchar("selected_template_url", { length: 500 }),
  
  // Phase 5: Development
  stagingUrl: varchar("staging_url", { length: 500 }),
  developmentProgress: integer("development_progress").default(0),  // 0-100%
  developmentNotes: text("development_notes"),
  websitePlatform: varchar("website_platform", { length: 50 }),  // wix, shopify, custom
  
  // Phase 7A: Hosting Setup
  hostingProvider: varchar("hosting_provider", { length: 100 }),  // hostinger, etc.
  hostingCredentialsReceived: boolean("hosting_credentials_received").default(false),
  hostingCredentialsReceivedAt: timestamp("hosting_credentials_received_at"),
  domainConnected: boolean("domain_connected").default(false),
  sslConfigured: boolean("ssl_configured").default(false),
  dnsConfigured: boolean("dns_configured").default(false),
  hostingNotes: text("hosting_notes"),
  
  // Final Delivery Checklist
  liveSiteTested: boolean("live_site_tested").default(false),
  domainResolving: boolean("domain_resolving").default(false),
  allLinksFunctional: boolean("all_links_functional").default(false),
  seoBasicsConfigured: boolean("seo_basics_configured").default(false),
  credentialsCompiled: boolean("credentials_compiled").default(false),
  deliveredAt: timestamp("delivered_at"),
  
  // Portfolio display
  visibleOnPortfolio: boolean("visible_on_portfolio").default(false),
  portfolioImage: varchar("portfolio_image", { length: 500 }),
  portfolioDescription: text("portfolio_description"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payments Table
export const payments = pgTable("payments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id", { length: 36 }).references(() => projects.id),
  clientId: varchar("client_id", { length: 36 }).references(() => clients.id).notNull(),
  
  // Payment Details
  paymentNumber: integer("payment_number"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: varchar("description", { length: 255 }),
  dueDate: date("due_date"),
  
  // Payment Type (deposit, milestone, final, addon, revision, other)
  paymentType: paymentTypeEnum("payment_type").default("other"),
  
  // Status
  status: paymentStatusEnum("status").default("pending"),
  
  // Stripe Integration
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeCheckoutSessionId: varchar("stripe_checkout_session_id", { length: 255 }),
  stripeTransactionId: varchar("stripe_transaction_id", { length: 255 }),
  
  // Payment Record
  paidAt: timestamp("paid_at"),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
  
  // Invoice
  invoiceNumber: varchar("invoice_number", { length: 50 }).unique(),
  invoicePdfUrl: varchar("invoice_pdf_url", { length: 500 }),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents Table
export const documents = pgTable("documents", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id", { length: 36 }).references(() => clients.id).notNull(),
  projectId: varchar("project_id", { length: 36 }).references(() => projects.id),
  
  // Document Info
  documentType: documentTypeEnum("document_type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // File Storage
  fileUrl: varchar("file_url", { length: 500 }),
  fileName: varchar("file_name", { length: 255 }),
  fileSize: integer("file_size"),
  fileType: varchar("file_type", { length: 50 }),
  
  // Document Status for workflow
  documentStatus: documentStatusEnum("document_status").default("draft"),
  
  // Signature Fields Configuration (JSON for field positions in PDF)
  signatureFields: text("signature_fields"),
  
  // Signature (for contracts)
  requiresSignature: boolean("requires_signature").default(false),
  isSigned: boolean("is_signed").default(false),
  signatureData: text("signature_data"),
  signatureType: signatureTypeEnum("signature_type"),
  signedAt: timestamp("signed_at"),
  signedByIp: varchar("signed_by_ip", { length: 45 }),
  
  // Acknowledgment (for upload documents that just need yes/no confirmation)
  requiresAcknowledgment: boolean("requires_acknowledgment").default(false),
  isAcknowledged: boolean("is_acknowledged").default(false),
  acknowledgedAt: timestamp("acknowledged_at"),
  
  // Visibility
  visibleToClient: boolean("visible_to_client").default(true),
  
  // Metadata
  uploadedBy: varchar("uploaded_by", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Questionnaire Responses Table
export const questionnaireResponses = pgTable("questionnaire_responses", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id", { length: 36 }).references(() => clients.id).notNull(),
  projectId: varchar("project_id", { length: 36 }).references(() => projects.id).notNull(),
  
  // Business Description
  businessDescription: text("business_description"),
  productsServices: text("products_services"),
  uniqueValue: text("unique_value"),
  
  // Target Audience
  targetAudienceDescription: text("target_audience_description"),
  targetAgeRange: varchar("target_age_range", { length: 50 }),
  targetLocation: varchar("target_location", { length: 255 }),
  
  // Design Preferences
  preferredColors: text("preferred_colors"),
  avoidColors: text("avoid_colors"),
  stylePreference: designStyleEnum("style_preference"),
  inspirationWebsites: text("inspiration_websites"),
  competitorWebsites: text("competitor_websites"),
  
  // Content
  hasLogo: boolean("has_logo").default(false),
  hasPhotos: boolean("has_photos").default(false),
  hasWrittenContent: boolean("has_written_content").default(false),
  contentNotes: text("content_notes"),
  
  // Functionality
  requiredPages: text("required_pages"),
  specialFeatures: text("special_features"),
  integrations: text("integrations"),
  
  // Goals
  primaryGoal: text("primary_goal"),
  successMetrics: text("success_metrics"),
  callToAction: text("call_to_action"),
  
  // Timeline & Budget
  preferredLaunchDate: date("preferred_launch_date"),
  budgetRange: varchar("budget_range", { length: 50 }),
  additionalNotes: text("additional_notes"),
  
  // Status
  submittedAt: timestamp("submitted_at"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages Table
export const messages = pgTable("messages", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id", { length: 36 }).references(() => clients.id).notNull(),
  projectId: varchar("project_id", { length: 36 }).references(() => projects.id),
  
  // Message Content
  senderId: varchar("sender_id", { length: 36 }).references(() => users.id).notNull(),
  senderType: senderTypeEnum("sender_type").notNull(),
  messageText: text("message_text").notNull(),
  
  // Status
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  
  // Category for filtering (e.g., development_feedback)
  category: messageCategoryEnum("category").default("general"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
});

// Client Uploads Table (for client-uploaded assets)
export const clientUploads = pgTable("client_uploads", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id", { length: 36 }).references(() => clients.id).notNull(),
  projectId: varchar("project_id", { length: 36 }).references(() => projects.id),
  
  // File Info
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  fileSize: integer("file_size"),
  fileType: varchar("file_type", { length: 100 }),
  
  // Categorization
  category: uploadCategoryEnum("category").notNull(),
  subcategory: varchar("subcategory", { length: 50 }),
  description: text("description"),
  
  // Admin Notes
  adminNotes: text("admin_notes"),
  isApproved: boolean("is_approved").default(false),
  
  // Metadata
  uploadedBy: varchar("uploaded_by", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity Logs Table
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  clientId: varchar("client_id", { length: 36 }).references(() => clients.id),
  
  // Activity Details
  action: varchar("action", { length: 100 }).notNull(),
  description: text("description"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
});

// Portfolio Items (for public display)
export const portfolioItems = pgTable("portfolio_items", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id", { length: 36 }).references(() => projects.id),
  
  // Display Info
  businessName: varchar("business_name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  description: text("description"),
  imageUrl: varchar("image_url", { length: 500 }).notNull(),
  websiteUrl: varchar("website_url", { length: 500 }),
  features: text("features").array(),
  
  // Display Order
  displayOrder: integer("display_order").default(0),
  isVisible: boolean("is_visible").default(true),
  isFeatured: boolean("is_featured").default(false),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Closing Questionnaire (Phase 8 feedback)
export const closingQuestionnaires = pgTable("closing_questionnaires", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id", { length: 36 }).references(() => clients.id).notNull(),
  projectId: varchar("project_id", { length: 36 }).references(() => projects.id).notNull(),
  
  // Satisfaction Ratings (1-5)
  overallSatisfaction: integer("overall_satisfaction"),
  designSatisfaction: integer("design_satisfaction"),
  functionalitySatisfaction: integer("functionality_satisfaction"),
  communicationSatisfaction: integer("communication_satisfaction"),
  timelineSatisfaction: integer("timeline_satisfaction"),
  
  // Feedback
  whatWorkedWell: text("what_worked_well"),
  whatCouldImprove: text("what_could_improve"),
  testimonial: text("testimonial"),
  canUseTestimonial: boolean("can_use_testimonial").default(false),
  
  // Referral
  wouldRefer: boolean("would_refer"),
  referralNotes: text("referral_notes"),
  
  // Additional
  additionalComments: text("additional_comments"),
  
  // Status
  isSkipped: boolean("is_skipped").default(false),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email Notifications Log
export const emailNotifications = pgTable("email_notifications", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id", { length: 36 }).references(() => clients.id),
  projectId: varchar("project_id", { length: 36 }).references(() => projects.id),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  
  // Email Details
  templateType: varchar("template_type", { length: 100 }).notNull(),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  
  // Status
  sentAt: timestamp("sent_at"),
  failedAt: timestamp("failed_at"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
});

// Hosting Credentials (secure storage for Phase 6)
export const hostingCredentials = pgTable("hosting_credentials", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id", { length: 36 }).references(() => clients.id).notNull(),
  projectId: varchar("project_id", { length: 36 }).references(() => projects.id).notNull(),
  
  // Hosting Info
  hostingProvider: varchar("hosting_provider", { length: 100 }),
  accountEmail: varchar("account_email", { length: 255 }),
  temporaryPassword: varchar("temporary_password", { length: 255 }),
  adminUrl: varchar("admin_url", { length: 500 }),
  
  // Domain Info
  domainName: varchar("domain_name", { length: 255 }),
  domainRegistrar: varchar("domain_registrar", { length: 100 }),
  domainExpiryDate: date("domain_expiry_date"),
  
  // Status
  credentialsReceived: boolean("credentials_received").default(false),
  configurationComplete: boolean("configuration_complete").default(false),
  accessReturned: boolean("access_returned").default(false),
  
  // Notes
  adminNotes: text("admin_notes"),
  
  // Metadata
  receivedAt: timestamp("received_at"),
  configuredAt: timestamp("configured_at"),
  returnedAt: timestamp("returned_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin Client Access (for cross-admin permissions)
export const adminClientAccess = pgTable("admin_client_access", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id", { length: 36 }).references(() => clients.id).notNull(),
  adminId: varchar("admin_id", { length: 36 }).references(() => users.id).notNull(),
  
  // Access Level
  accessLevel: accessLevelEnum("access_level").notNull().default("view"),
  
  // Who granted access
  grantedBy: varchar("granted_by", { length: 36 }).references(() => users.id).notNull(),
  
  // Metadata
  grantedAt: timestamp("granted_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Revision Requests Table
export const revisions = pgTable("revisions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id", { length: 36 }).references(() => clients.id).notNull(),
  projectId: varchar("project_id", { length: 36 }).references(() => projects.id).notNull(),
  
  // Request Info
  requestedBy: varchar("requested_by", { length: 36 }).references(() => users.id).notNull(),
  type: revisionTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  
  // Scope & Complexity
  affectedPages: text("affected_pages"),
  estimatedHours: decimal("estimated_hours", { precision: 5, scale: 2 }),
  additionalCost: decimal("additional_cost", { precision: 10, scale: 2 }),
  
  // Status
  status: revisionStatusEnum("status").notNull().default("pending"),
  
  // Admin Response
  reviewedBy: varchar("reviewed_by", { length: 36 }).references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  adminNotes: text("admin_notes"),
  declineReason: text("decline_reason"),
  
  // Completion
  completedBy: varchar("completed_by", { length: 36 }).references(() => users.id),
  completedAt: timestamp("completed_at"),
  completionNotes: text("completion_notes"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quotes (for pricing proposals to clients)
export const quotes = pgTable("quotes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id", { length: 36 }).references(() => clients.id).notNull(),
  projectId: varchar("project_id", { length: 36 }).references(() => projects.id),
  
  // Quote Info
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Line Items (stored as JSON)
  lineItems: text("line_items"), // JSON: [{name, description, quantity, unitPrice, total}]
  
  // Totals
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  discountDescription: varchar("discount_description", { length: 255 }),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  
  // Status
  status: quoteStatusEnum("status").notNull().default("draft"),
  
  // Validity
  validUntil: date("valid_until"),
  
  // Terms
  notes: text("notes"),
  termsAndConditions: text("terms_and_conditions"),
  
  // Client Response
  clientResponse: text("client_response"),
  respondedAt: timestamp("responded_at"),
  
  // Created By
  createdBy: varchar("created_by", { length: 36 }).references(() => users.id).notNull(),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients, { relationName: "userClient" }),
  assignedClients: many(clients, { relationName: "assignedClient" }),
  documents: many(documents),
  messages: many(messages),
  activityLogs: many(activityLogs),
  clientAccess: many(adminClientAccess, { relationName: "adminAccess" }),
  grantedAccess: many(adminClientAccess, { relationName: "grantedAccess" }),
  quotes: many(quotes),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
    relationName: "userClient",
  }),
  assignedTo: one(users, {
    fields: [clients.assignedTo],
    references: [users.id],
    relationName: "assignedClient",
  }),
  createdByUser: one(users, {
    fields: [clients.createdBy],
    references: [users.id],
  }),
  projects: many(projects),
  payments: many(payments),
  documents: many(documents),
  messages: many(messages),
  activityLogs: many(activityLogs),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  payments: many(payments),
  documents: many(documents),
  messages: many(messages),
  clientUploads: many(clientUploads),
  questionnaire: one(questionnaireResponses, {
    fields: [projects.id],
    references: [questionnaireResponses.projectId],
  }),
  portfolioItem: one(portfolioItems, {
    fields: [projects.id],
    references: [portfolioItems.projectId],
  }),
}));

export const questionnaireResponsesRelations = relations(questionnaireResponses, ({ one }) => ({
  client: one(clients, {
    fields: [questionnaireResponses.clientId],
    references: [clients.id],
  }),
  project: one(projects, {
    fields: [questionnaireResponses.projectId],
    references: [projects.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  project: one(projects, {
    fields: [payments.projectId],
    references: [projects.id],
  }),
  client: one(clients, {
    fields: [payments.clientId],
    references: [clients.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  client: one(clients, {
    fields: [documents.clientId],
    references: [clients.id],
  }),
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
  uploadedByUser: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  client: one(clients, {
    fields: [messages.clientId],
    references: [clients.id],
  }),
  project: one(projects, {
    fields: [messages.projectId],
    references: [projects.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [activityLogs.clientId],
    references: [clients.id],
  }),
}));

export const clientUploadsRelations = relations(clientUploads, ({ one }) => ({
  client: one(clients, {
    fields: [clientUploads.clientId],
    references: [clients.id],
  }),
  uploadedByUser: one(users, {
    fields: [clientUploads.uploadedBy],
    references: [users.id],
  }),
}));

export const portfolioItemsRelations = relations(portfolioItems, ({ one }) => ({
  project: one(projects, {
    fields: [portfolioItems.projectId],
    references: [projects.id],
  }),
}));

export const adminClientAccessRelations = relations(adminClientAccess, ({ one }) => ({
  client: one(clients, {
    fields: [adminClientAccess.clientId],
    references: [clients.id],
  }),
  admin: one(users, {
    fields: [adminClientAccess.adminId],
    references: [users.id],
    relationName: "adminAccess",
  }),
  grantedByUser: one(users, {
    fields: [adminClientAccess.grantedBy],
    references: [users.id],
    relationName: "grantedAccess",
  }),
}));

export const revisionsRelations = relations(revisions, ({ one }) => ({
  client: one(clients, {
    fields: [revisions.clientId],
    references: [clients.id],
  }),
  project: one(projects, {
    fields: [revisions.projectId],
    references: [projects.id],
  }),
  requestedByUser: one(users, {
    fields: [revisions.requestedBy],
    references: [users.id],
  }),
  reviewedByUser: one(users, {
    fields: [revisions.reviewedBy],
    references: [users.id],
  }),
  completedByUser: one(users, {
    fields: [revisions.completedBy],
    references: [users.id],
  }),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  client: one(clients, {
    fields: [quotes.clientId],
    references: [clients.id],
  }),
  project: one(projects, {
    fields: [quotes.projectId],
    references: [projects.id],
  }),
  createdByUser: one(users, {
    fields: [quotes.createdBy],
    references: [users.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
  resetToken: true,
  resetTokenExpiry: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertPortfolioItemSchema = createInsertSchema(portfolioItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientUploadSchema = createInsertSchema(clientUploads).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionnaireResponseSchema = createInsertSchema(questionnaireResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClosingQuestionnaireSchema = createInsertSchema(closingQuestionnaires).omit({
  id: true,
  createdAt: true,
});

export const insertEmailNotificationSchema = createInsertSchema(emailNotifications).omit({
  id: true,
  createdAt: true,
});

export const insertHostingCredentialsSchema = createInsertSchema(hostingCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminClientAccessSchema = createInsertSchema(adminClientAccess).omit({
  id: true,
  grantedAt: true,
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRevisionSchema = createInsertSchema(revisions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Resource category for library items
export const resourceCategoryEnum = pgEnum("resource_category", [
  "guide",           // How-to guides and tutorials
  "template",        // Document templates  
  "legal",           // TOS, privacy policy, legal docs
  "faq",             // Frequently asked questions
  "video",           // Video tutorials
  "other"
]);

// Global resource library (accessible to all clients)
export const resources = pgTable("resources", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  
  // Resource Info
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: resourceCategoryEnum("category").notNull(),
  
  // File Storage (optional - some resources are links/text)
  fileUrl: varchar("file_url", { length: 500 }),
  fileName: varchar("file_name", { length: 255 }),
  fileSize: integer("file_size"),
  fileType: varchar("file_type", { length: 50 }),
  
  // External link (for video tutorials, external resources)
  externalUrl: varchar("external_url", { length: 500 }),
  
  // Rich text content (for FAQs, guides without file)
  content: text("content"),
  
  // Display Order and Visibility
  sortOrder: integer("sort_order").default(0),
  isPublished: boolean("is_published").default(true),
  isClientVisible: boolean("is_client_visible").default(true),
  
  // Metadata
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resources.$inferSelect;

// Cancellation reason enum
export const cancellationReasonEnum = pgEnum("cancellation_reason", [
  "client_request",        // Client requested cancellation
  "non_payment",           // Client failed to pay
  "scope_change",          // Major scope changes not agreed
  "unresponsive_client",   // Client stopped communicating
  "mutual_agreement",      // Both parties agreed
  "admin_decision",        // Business decision
  "other"
]);

// Cancellations/Refunds Table
export const cancellations = pgTable("cancellations", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id", { length: 36 }).references(() => projects.id).notNull(),
  clientId: varchar("client_id", { length: 36 }).references(() => clients.id).notNull(),
  
  // Cancellation Details
  reason: cancellationReasonEnum("reason").notNull(),
  reasonNotes: text("reason_notes"),
  
  // Financial Summary at time of cancellation
  totalPaid: decimal("total_paid", { precision: 10, scale: 2 }).default("0"),
  workCompleted: integer("work_completed_percentage").default(0), // % of work done
  
  // Fee Calculation
  cancellationFeePercentage: integer("cancellation_fee_percentage").default(25), // Default 25%
  cancellationFeeAmount: decimal("cancellation_fee_amount", { precision: 10, scale: 2 }),
  
  // Refund Details
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }).default("0"),
  refundStatus: paymentStatusEnum("refund_status").default("pending"),
  refundedAt: timestamp("refunded_at"),
  refundNotes: text("refund_notes"),
  
  // Stripe Refund Tracking
  stripeRefundId: varchar("stripe_refund_id", { length: 255 }),
  
  // Who initiated
  cancelledBy: varchar("cancelled_by", { length: 36 }),
  cancelledAt: timestamp("cancelled_at").defaultNow(),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCancellationSchema = createInsertSchema(cancellations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCancellation = z.infer<typeof insertCancellationSchema>;
export type Cancellation = typeof cancellations.$inferSelect;

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Password change schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// PIN login schema (for fast admin login)
export const pinLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  pin: z.string().length(6, "PIN must be exactly 6 digits").regex(/^\d{6}$/, "PIN must be 6 digits"),
});

// Set PIN schema
export const setPinSchema = z.object({
  pin: z.string().length(6, "PIN must be exactly 6 digits").regex(/^\d{6}$/, "PIN must be 6 digits"),
  confirmPin: z.string().length(6),
  password: z.string().min(6, "Password required to set PIN"),
}).refine((data) => data.pin === data.confirmPin, {
  message: "PINs don't match",
  path: ["confirmPin"],
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;
export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertClientUpload = z.infer<typeof insertClientUploadSchema>;
export type ClientUpload = typeof clientUploads.$inferSelect;
export type InsertQuestionnaireResponse = z.infer<typeof insertQuestionnaireResponseSchema>;
export type QuestionnaireResponse = typeof questionnaireResponses.$inferSelect;
export type InsertClosingQuestionnaire = z.infer<typeof insertClosingQuestionnaireSchema>;
export type ClosingQuestionnaire = typeof closingQuestionnaires.$inferSelect;
export type InsertEmailNotification = z.infer<typeof insertEmailNotificationSchema>;
export type EmailNotification = typeof emailNotifications.$inferSelect;
export type InsertHostingCredentials = z.infer<typeof insertHostingCredentialsSchema>;
export type HostingCredentials = typeof hostingCredentials.$inferSelect;
export type InsertAdminClientAccess = z.infer<typeof insertAdminClientAccessSchema>;
export type AdminClientAccess = typeof adminClientAccess.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertRevision = z.infer<typeof insertRevisionSchema>;
export type Revision = typeof revisions.$inferSelect;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type PinLoginInput = z.infer<typeof pinLoginSchema>;
export type SetPinInput = z.infer<typeof setPinSchema>;

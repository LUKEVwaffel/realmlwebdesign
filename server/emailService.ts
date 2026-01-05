import sgMail from '@sendgrid/mail';
import { storage } from "./storage";

// SendGrid integration helper - uses Replit connection
// WARNING: Never cache this client. Access tokens expire.
// Always call this function again to get a fresh client.
// Reference: connection:conn_sendgrid_01K9PPH4TP3MGMD9HDRC8MWSHC
async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    return null;
  }

  const connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || !connectionSettings.settings?.api_key || !connectionSettings.settings?.from_email) {
    return null;
  }
  
  return {
    apiKey: connectionSettings.settings.api_key,
    email: connectionSettings.settings.from_email
  };
}

async function getUncachableSendGridClient() {
  try {
    const creds = await getCredentials();
    if (!creds) {
      console.log('[Email] SendGrid not configured');
      return null;
    }
    sgMail.setApiKey(creds.apiKey);
    return {
      client: sgMail,
      fromEmail: creds.email
    };
  } catch (error) {
    console.error('[Email] Failed to get SendGrid client:', error);
    return null;
  }
}

// Check if SendGrid appears to be available (no network call)
export function isEmailConfigured(): boolean {
  return !!(process.env.REPLIT_CONNECTORS_HOSTNAME && 
    (process.env.REPL_IDENTITY || process.env.WEB_REPL_RENEWAL));
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const maskedLocal = local.length > 2 ? local[0] + "***" + local.slice(-1) : "***";
  return `${maskedLocal}@${domain}`;
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const sendgrid = await getUncachableSendGridClient();
    if (!sendgrid) {
      console.log('[Email] SendGrid not available, email not sent');
      return false;
    }

    await sendgrid.client.send({
      to: options.to,
      from: {
        email: sendgrid.fromEmail,
        name: 'ML WebDesign'
      },
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    });
    console.log(`[Email] Sent successfully to: ${maskEmail(options.to)}`);
    return true;
  } catch (error: any) {
    console.error("[Email] Failed to send:", error?.response?.body || error?.message || error);
    return false;
  }
}

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ML WebDesign</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%); padding: 30px; border-radius: 8px 8px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 24px;">DUO by ML WebDesign</h1>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    ${content}
  </div>
  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>This is an automated message from ML WebDesign.</p>
    <p>Please do not reply directly to this email.</p>
    <p>Contact us at: hello@mlwebdesign.com</p>
  </div>
</body>
</html>`;
}

// ============ Password Reset Code Email ============
export async function sendPasswordResetCodeEmail(
  email: string,
  firstName: string,
  code: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">Password Reset Code</h2>
    <p>Hi ${firstName},</p>
    <p>You requested to reset your password. Use the code below to complete the process:</p>
    <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">${code}</p>
    </div>
    <p style="color: #dc3545;"><strong>This code expires in 10 minutes.</strong></p>
    <p>If you didn't request this, please ignore this email or contact us if you have concerns.</p>
  `;

  return sendEmail({
    to: email,
    subject: `Your Password Reset Code: ${code}`,
    html: baseTemplate(content),
  });
}

// ============ Client Activity Notifications ============
export async function sendActivityNotificationToClient(
  email: string,
  firstName: string,
  activityType: string,
  activityDescription: string,
  portalUrl: string
): Promise<boolean> {
  const activityLabels: Record<string, string> = {
    document_uploaded: "New Document",
    payment_received: "Payment Confirmation",
    payment_created: "Payment Request",
    message_received: "New Message",
    project_status_updated: "Project Update",
    quote_sent: "New Quote",
    document_ready: "Document Ready",
    milestone_completed: "Milestone Completed"
  };

  const title = activityLabels[activityType] || "Activity Update";

  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">${title}</h2>
    <p>Hi ${firstName},</p>
    <p>${activityDescription}</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View in Portal</a>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `${title} - ML WebDesign`,
    html: baseTemplate(content),
  });
}

// ============ Admin Activity Notifications ============
export async function sendActivityNotificationToAdmin(
  adminEmail: string,
  adminFirstName: string,
  clientName: string,
  activityType: string,
  activityDescription: string,
  dashboardUrl: string
): Promise<boolean> {
  const activityLabels: Record<string, string> = {
    document_uploaded: "Client Uploaded Document",
    payment_completed: "Payment Received",
    message_sent: "New Client Message",
    questionnaire_completed: "Questionnaire Completed",
    document_signed: "Document Signed",
    quote_approved: "Quote Approved",
    quote_rejected: "Quote Rejected"
  };

  const title = activityLabels[activityType] || "Client Activity";

  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">${title}</h2>
    <p>Hi ${adminFirstName},</p>
    <p>There's new activity from your client <strong>${clientName}</strong>:</p>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;">${activityDescription}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View in Dashboard</a>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `[${clientName}] ${title}`,
    html: baseTemplate(content),
  });
}

// ============ Unified Notification Sender ============
export async function notifyClientActivity(
  clientId: string,
  activityType: string,
  description: string
): Promise<void> {
  try {
    const client = await storage.getClient(clientId);
    if (!client?.userId) return;

    const user = await storage.getUser(client.userId);
    if (!user?.email || !user.isActive) return;

    const baseUrl = process.env.APP_URL || "https://your-app.replit.app";
    const portalUrl = `${baseUrl}/client`;

    await sendActivityNotificationToClient(
      user.email,
      user.firstName || "Client",
      activityType,
      description,
      portalUrl
    );
  } catch (error) {
    console.error("[Email] Failed to notify client:", error);
  }
}

export async function notifyAdminActivity(
  clientId: string,
  activityType: string,
  description: string
): Promise<void> {
  try {
    const client = await storage.getClient(clientId);
    if (!client) return;

    // Get the owning admin
    const ownerId = client.createdBy;
    if (!ownerId) return;

    const admin = await storage.getUser(ownerId);
    if (!admin?.email || admin.role !== "admin") return;

    const baseUrl = process.env.APP_URL || "https://your-app.replit.app";
    const dashboardUrl = `${baseUrl}/admin/clients/${clientId}`;

    await sendActivityNotificationToAdmin(
      admin.email,
      admin.firstName || "Admin",
      client.businessLegalName || "Client",
      activityType,
      description,
      dashboardUrl
    );

    // Also notify any editors granted access
    const accessGrants = await storage.getAdminClientAccess(clientId);
    for (const grant of accessGrants) {
      // Skip if this is the same admin as the owner
      if (grant.adminId === ownerId) continue;
      
      const grantedAdmin = await storage.getUser(grant.adminId);
      if (grantedAdmin?.email && grantedAdmin.role === "admin") {
        await sendActivityNotificationToAdmin(
          grantedAdmin.email,
          grantedAdmin.firstName || "Admin",
          client.businessLegalName || "Client",
          activityType,
          description,
          dashboardUrl
        );
      }
    }
  } catch (error) {
    console.error("[Email] Failed to notify admin:", error);
  }
}

// ============ Welcome Email ============
export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  tempPassword: string,
  loginUrl: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">Welcome, ${firstName}!</h2>
    <p>Your client portal account has been created. You can now access your project dashboard, view documents, and track payments.</p>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Your login credentials:</strong></p>
      <p style="margin: 5px 0;">Email: <code style="background: #e9ecef; padding: 2px 6px; border-radius: 4px;">${email}</code></p>
      <p style="margin: 5px 0;">Temporary Password: <code style="background: #e9ecef; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
    </div>
    <p style="color: #dc3545;"><strong>Important:</strong> You will be required to change your password upon first login.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Login to Portal</a>
    </div>
    <p>If you have any questions, please don't hesitate to reach out to our team.</p>
  `;

  return sendEmail({
    to: email,
    subject: "Welcome to Your Client Portal",
    html: baseTemplate(content),
  });
}

// ============ Payment Emails ============
export async function sendPaymentReminderEmail(
  email: string,
  firstName: string,
  amount: string,
  description: string,
  dueDate: string,
  paymentUrl: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">Payment Reminder</h2>
    <p>Hi ${firstName},</p>
    <p>This is a friendly reminder that you have an upcoming payment due.</p>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Description:</strong> ${description}</p>
      <p style="margin: 5px 0;"><strong>Amount:</strong> $${amount}</p>
      <p style="margin: 5px 0;"><strong>Due Date:</strong> ${dueDate}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${paymentUrl}" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Pay Now</a>
    </div>
    <p>If you've already made this payment, please disregard this message.</p>
  `;

  return sendEmail({
    to: email,
    subject: `Payment Reminder: $${amount} due ${dueDate}`,
    html: baseTemplate(content),
  });
}

export async function sendPaymentConfirmationEmail(
  email: string,
  firstName: string,
  amount: string,
  description: string,
  paymentDate: string,
  dashboardUrl: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">Payment Confirmed</h2>
    <p>Hi ${firstName},</p>
    <p>Thank you for your payment! This email confirms that we have received your payment.</p>
    <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
      <p style="margin: 5px 0;"><strong>Description:</strong> ${description}</p>
      <p style="margin: 5px 0;"><strong>Amount Paid:</strong> $${amount}</p>
      <p style="margin: 5px 0;"><strong>Date:</strong> ${paymentDate}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View Receipt</a>
    </div>
    <p>A receipt has been saved to your documents. Thank you for your business!</p>
  `;

  return sendEmail({
    to: email,
    subject: `Payment Confirmed: $${amount}`,
    html: baseTemplate(content),
  });
}

// ============ Document Emails ============
export async function sendDocumentSignatureRequestEmail(
  email: string,
  firstName: string,
  documentTitle: string,
  documentUrl: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">Document Signature Required</h2>
    <p>Hi ${firstName},</p>
    <p>A document requires your signature to proceed with your project.</p>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Document:</strong> ${documentTitle}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${documentUrl}" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Review & Sign Document</a>
    </div>
    <p>Please review the document carefully before signing. If you have any questions, reach out to our team.</p>
  `;

  return sendEmail({
    to: email,
    subject: `Signature Required: ${documentTitle}`,
    html: baseTemplate(content),
  });
}

// ============ Project Status Emails ============
export async function sendProjectStatusUpdateEmail(
  email: string,
  firstName: string,
  projectName: string,
  oldStatus: string,
  newStatus: string,
  dashboardUrl: string
): Promise<boolean> {
  const statusLabels: Record<string, string> = {
    created: "Created",
    questionnaire_pending: "Questionnaire Pending",
    questionnaire_complete: "Questionnaire Complete",
    tos_pending: "Terms of Service Pending",
    tos_signed: "Terms of Service Signed",
    design_pending: "Design Pending",
    design_approved: "Design Approved",
    in_development: "In Development",
    hosting_setup: "Hosting Setup",
    deployed: "Deployed",
    delivery: "Delivery",
    client_review: "Client Review",
    completed: "Completed",
    on_hold: "On Hold",
    cancelled: "Cancelled",
  };

  const newStatusLabel = statusLabels[newStatus] || newStatus;
  const oldStatusLabel = statusLabels[oldStatus] || oldStatus;

  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">Project Update</h2>
    <p>Hi ${firstName},</p>
    <p>Your project status has been updated.</p>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Project:</strong> ${projectName}</p>
      <p style="margin: 5px 0;"><strong>Previous Status:</strong> ${oldStatusLabel}</p>
      <p style="margin: 5px 0;"><strong>New Status:</strong> <span style="background: #1a1a2e; color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 14px;">${newStatusLabel}</span></p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View Dashboard</a>
    </div>
    <p>Log in to your portal for more details about your project progress.</p>
  `;

  return sendEmail({
    to: email,
    subject: `Project Update: ${projectName} - ${newStatusLabel}`,
    html: baseTemplate(content),
  });
}

// ============ Message Notification ============
export async function sendNewMessageNotificationEmail(
  email: string,
  firstName: string,
  senderName: string,
  messagePreview: string,
  messagesUrl: string
): Promise<boolean> {
  const preview = messagePreview.length > 100 
    ? messagePreview.substring(0, 100) + "..." 
    : messagePreview;

  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">New Message</h2>
    <p>Hi ${firstName},</p>
    <p>You have received a new message from ${senderName}.</p>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1a1a2e;">
      <p style="margin: 0; font-style: italic;">"${preview}"</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${messagesUrl}" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View Messages</a>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `New message from ${senderName}`,
    html: baseTemplate(content),
  });
}

// ============ Quote Emails ============
export async function sendQuoteNotificationEmail(
  email: string,
  firstName: string,
  quoteTitle: string,
  totalAmount: string,
  portalUrl: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">New Quote Available</h2>
    <p>Hi ${firstName},</p>
    <p>A new quote has been prepared for your review.</p>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Quote:</strong> ${quoteTitle}</p>
      <p style="margin: 5px 0;"><strong>Total:</strong> $${totalAmount}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}/quotes" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View Quote</a>
    </div>
    <p>Please review and respond to the quote at your earliest convenience.</p>
  `;

  return sendEmail({
    to: email,
    subject: `New Quote: ${quoteTitle}`,
    html: baseTemplate(content),
  });
}

// ============ Workflow Emails ============
export type WorkflowEmailType = 
  | "questionnaire_reminder"
  | "tos_ready"
  | "tos_signed_confirmation"
  | "design_requirements_ready"
  | "design_approved"
  | "development_started"
  | "development_milestone"
  | "hosting_setup_instructions"
  | "project_ready_for_review"
  | "closing_questionnaire_request"
  | "project_completed";

export async function sendQuestionnaireReminderEmail(
  email: string,
  firstName: string,
  portalUrl: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">Reminder: Complete Your Questionnaire</h2>
    <p>Hi ${firstName},</p>
    <p>We noticed you haven't completed your project questionnaire yet. This is an essential step to help us understand your needs and move forward with your project.</p>
    <p>Please take a few minutes to complete it at your earliest convenience.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}/questionnaire" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Complete Questionnaire</a>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Reminder: Complete Your Project Questionnaire",
    html: baseTemplate(content),
  });
}

export async function sendTosReadyEmail(
  email: string,
  firstName: string,
  portalUrl: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">Terms of Service Ready</h2>
    <p>Hi ${firstName},</p>
    <p>Thank you for completing your project questionnaire! We've prepared your Terms of Service agreement based on your requirements.</p>
    <p>Please review and sign the document to proceed with your project.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}/documents" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Review & Sign</a>
    </div>
    <p style="color: #666; font-size: 14px;">Once signed, we'll prepare your design requirements document.</p>
  `;

  return sendEmail({
    to: email,
    subject: "Terms of Service Ready for Review",
    html: baseTemplate(content),
  });
}

export async function sendTosSignedConfirmationEmail(
  email: string,
  firstName: string,
  portalUrl: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">Terms of Service Signed</h2>
    <p>Hi ${firstName},</p>
    <p>Thank you for signing your Terms of Service agreement! Your project is now officially underway.</p>
    <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Next steps:</strong></p>
      <ol style="margin: 10px 0;">
        <li>We'll prepare your Design Requirements document</li>
        <li>You'll receive a notification when it's ready for review</li>
        <li>Once approved, development will begin</li>
      </ol>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}/dashboard" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View Dashboard</a>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Terms of Service Signed - Thank You!",
    html: baseTemplate(content),
  });
}

export async function sendDesignRequirementsReadyEmail(
  email: string,
  firstName: string,
  projectName: string,
  portalUrl: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">Design Requirements Ready</h2>
    <p>Hi ${firstName},</p>
    <p>Based on our discussions and your questionnaire responses, we've prepared your Design Requirements document for <strong>${projectName}</strong>.</p>
    <p>Please review the document and approve it to begin development.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}/documents" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Design Requirements</a>
    </div>
    <p style="color: #666; font-size: 14px;">If you have any questions or need changes, please let us know through the portal.</p>
  `;

  return sendEmail({
    to: email,
    subject: "Design Requirements Document Ready for Review",
    html: baseTemplate(content),
  });
}

export async function sendDesignApprovedEmail(
  email: string,
  firstName: string,
  projectName: string,
  portalUrl: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">Development Starting!</h2>
    <p>Hi ${firstName},</p>
    <p>Thank you for approving your design requirements! We're now beginning development on <strong>${projectName}</strong>.</p>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>What to expect:</strong></p>
      <ul style="margin: 10px 0;">
        <li>Regular progress updates through your dashboard</li>
        <li>Milestone notifications as we complete key features</li>
        <li>Opportunity to provide feedback during development</li>
      </ul>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}/dashboard" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Track Progress</a>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Design Approved - Development Starting!",
    html: baseTemplate(content),
  });
}

export async function sendHostingSetupEmail(
  email: string,
  firstName: string,
  portalUrl: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">Action Required: Hosting Setup</h2>
    <p>Hi ${firstName},</p>
    <p>Your website is nearly complete! Before we can make it live, we need you to set up your hosting account.</p>
    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>What's needed:</strong></p>
      <ul style="margin: 10px 0;">
        <li>Domain registration or transfer instructions</li>
        <li>Hosting account setup steps</li>
        <li>Required credentials to share with us</li>
      </ul>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}/documents" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View Instructions</a>
    </div>
    <p style="color: #666; font-size: 14px;">Once you've completed the setup, please submit your hosting credentials through the secure form in your portal.</p>
  `;

  return sendEmail({
    to: email,
    subject: "Action Required: Hosting Account Setup",
    html: baseTemplate(content),
  });
}

export async function sendProjectReadyForReviewEmail(
  email: string,
  firstName: string,
  projectName: string,
  websiteUrl: string | null,
  portalUrl: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">Your Website is Ready!</h2>
    <p>Hi ${firstName},</p>
    <p>Congratulations! Your website <strong>${projectName}</strong> is now ready for your final review!</p>
    ${websiteUrl ? `
    <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;">Preview your site: <a href="${websiteUrl}" style="color: #1a1a2e;">${websiteUrl}</a></p>
    </div>` : ""}
    <p>Please review everything carefully and let us know if you need any final adjustments.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}/dashboard" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Your Project</a>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Your Website is Ready for Final Review!",
    html: baseTemplate(content),
  });
}

export async function sendClosingQuestionnaireEmail(
  email: string,
  firstName: string,
  portalUrl: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">Please Share Your Feedback</h2>
    <p>Hi ${firstName},</p>
    <p>As we finalize your project, we'd love to hear your feedback! Please take a moment to complete our closing questionnaire.</p>
    <p>Your feedback helps us improve our services and serve you better in the future.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}/questionnaire/closing" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Complete Questionnaire</a>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Please Share Your Feedback",
    html: baseTemplate(content),
  });
}

export async function sendProjectCompletedEmail(
  email: string,
  firstName: string,
  projectName: string,
  websiteUrl: string | null,
  portalUrl: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">Project Completed!</h2>
    <p>Hi ${firstName},</p>
    <p>Your project <strong>${projectName}</strong> has been successfully completed!</p>
    ${websiteUrl ? `
    <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;">Your live website: <a href="${websiteUrl}" style="color: #1a1a2e;">${websiteUrl}</a></p>
    </div>` : ""}
    <p>A completion document has been added to your portal with all the important details about your project, including:</p>
    <ul>
      <li>Project summary and deliverables</li>
      <li>Support information</li>
      <li>Maintenance recommendations</li>
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}/documents" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View Documents</a>
    </div>
    <p>It's been a pleasure working with you. If you need any future assistance, we're just a message away!</p>
  `;

  return sendEmail({
    to: email,
    subject: "Project Completed - Thank You!",
    html: baseTemplate(content),
  });
}

// ============ Warranty Period Emails ============
export async function sendWarrantyStartEmail(
  email: string,
  firstName: string,
  projectName: string,
  warrantyEndDate: Date,
  portalUrl: string
): Promise<boolean> {
  const daysRemaining = Math.ceil((warrantyEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const formattedEndDate = warrantyEndDate.toLocaleDateString("en-US", { 
    month: "long", 
    day: "numeric", 
    year: "numeric" 
  });
  
  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">Your 25-Day Warranty Period Has Started</h2>
    <p>Hi ${firstName},</p>
    <p>Congratulations on completing your project <strong>${projectName}</strong>!</p>
    <div style="background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%); padding: 25px; border-radius: 8px; margin: 20px 0; color: #fff;">
      <h3 style="margin: 0 0 10px 0; color: #fff;">25-Day Warranty Coverage</h3>
      <p style="margin: 5px 0; color: #fff;">You have <strong>${daysRemaining} days</strong> of free support and bug fixes.</p>
      <p style="margin: 5px 0; font-size: 14px; color: rgba(255,255,255,0.9);">Warranty expires: ${formattedEndDate}</p>
    </div>
    <p>During this period, we'll fix any bugs or issues with your website at no additional cost. This includes:</p>
    <ul>
      <li>Bug fixes and technical issues</li>
      <li>Minor adjustments to functionality</li>
      <li>Browser compatibility fixes</li>
    </ul>
    <p style="color: #666; font-size: 14px;"><strong>Note:</strong> This warranty covers fixes only, not new features or major design changes.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}/dashboard" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View Dashboard</a>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Your 25-Day Warranty Period Has Started",
    html: baseTemplate(content),
  });
}

export async function sendWarrantyReminderEmail(
  email: string,
  firstName: string,
  projectName: string,
  daysRemaining: number,
  warrantyEndDate: Date,
  portalUrl: string
): Promise<boolean> {
  const formattedEndDate = warrantyEndDate.toLocaleDateString("en-US", { 
    month: "long", 
    day: "numeric", 
    year: "numeric" 
  });
  
  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">Warranty Period Reminder</h2>
    <p>Hi ${firstName},</p>
    <p>This is a friendly reminder that your warranty period for <strong>${projectName}</strong> is ending soon.</p>
    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <p style="margin: 0; font-size: 18px;"><strong>${daysRemaining} days remaining</strong></p>
      <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Warranty expires: ${formattedEndDate}</p>
    </div>
    <p>If you've noticed any bugs or issues with your website, please let us know before your warranty expires so we can fix them at no additional cost.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}/messages" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Contact Us</a>
    </div>
    <p style="color: #666; font-size: 14px;">After the warranty period, bug fixes and support will be billed separately.</p>
  `;

  return sendEmail({
    to: email,
    subject: `Warranty Reminder: ${daysRemaining} Days Remaining`,
    html: baseTemplate(content),
  });
}

export async function sendWarrantyExpiredEmail(
  email: string,
  firstName: string,
  projectName: string,
  portalUrl: string
): Promise<boolean> {
  const content = `
    <h2 style="color: #1a1a2e; margin-top: 0;">Warranty Period Has Ended</h2>
    <p>Hi ${firstName},</p>
    <p>Your 25-day warranty period for <strong>${projectName}</strong> has now ended.</p>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>What this means:</strong></p>
      <ul style="margin: 10px 0 0 0;">
        <li>Future bug fixes and support will be billed at our standard rates</li>
        <li>You can still reach out to us anytime for paid support</li>
        <li>Consider our maintenance plans for ongoing peace of mind</li>
      </ul>
    </div>
    <p>It's been a pleasure working with you! If you need any future assistance, we're here to help.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}/dashboard" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View Dashboard</a>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Your Warranty Period Has Ended",
    html: baseTemplate(content),
  });
}

export async function sendWorkflowEmail(
  clientId: string,
  projectId: string | null,
  emailType: WorkflowEmailType,
  additionalData?: { milestoneTitle?: string; websiteUrl?: string }
): Promise<boolean> {
  try {
    const client = await storage.getClient(clientId);
    if (!client?.userId) {
      console.error(`[Email] Cannot send ${emailType}: client not found`);
      return false;
    }

    const user = await storage.getUser(client.userId);
    if (!user?.email) {
      console.error(`[Email] Cannot send ${emailType}: user email not found`);
      return false;
    }

    const project = projectId ? await storage.getProject(projectId) : null;
    const firstName = user.firstName || client.businessLegalName?.split(" ")[0] || "Client";
    const projectName = project ? `${client.businessLegalName} ${project.projectType.replace(/_/g, " ")}` : "Your Project";
    const baseUrl = process.env.APP_URL || "https://your-app.replit.app";
    const portalUrl = `${baseUrl}/client`;

    let success = false;

    switch (emailType) {
      case "questionnaire_reminder":
        success = await sendQuestionnaireReminderEmail(user.email, firstName, portalUrl);
        break;
      case "tos_ready":
        success = await sendTosReadyEmail(user.email, firstName, portalUrl);
        break;
      case "tos_signed_confirmation":
        success = await sendTosSignedConfirmationEmail(user.email, firstName, portalUrl);
        break;
      case "design_requirements_ready":
        success = await sendDesignRequirementsReadyEmail(user.email, firstName, projectName, portalUrl);
        break;
      case "design_approved":
        success = await sendDesignApprovedEmail(user.email, firstName, projectName, portalUrl);
        break;
      case "hosting_setup_instructions":
        success = await sendHostingSetupEmail(user.email, firstName, portalUrl);
        break;
      case "project_ready_for_review":
        success = await sendProjectReadyForReviewEmail(
          user.email,
          firstName,
          projectName,
          additionalData?.websiteUrl || (project?.domainName ? `https://${project.domainName}` : null),
          portalUrl
        );
        break;
      case "closing_questionnaire_request":
        success = await sendClosingQuestionnaireEmail(user.email, firstName, portalUrl);
        break;
      case "project_completed":
        success = await sendProjectCompletedEmail(
          user.email,
          firstName,
          projectName,
          additionalData?.websiteUrl || (project?.domainName ? `https://${project.domainName}` : null),
          portalUrl
        );
        break;
      default:
        console.log(`[Email] Unknown email type: ${emailType}`);
        return false;
    }

    await storage.createEmailNotification({
      clientId,
      projectId,
      templateType: emailType,
      subject: emailType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
      recipientEmail: user.email,
      sentAt: success ? new Date() : undefined,
      failedAt: success ? undefined : new Date(),
    });

    return success;
  } catch (error) {
    console.error(`[Email] Error sending ${emailType}:`, error);
    return false;
  }
}

// Contact form email - sends to business email
export async function sendContactFormEmail(
  name: string,
  email: string,
  company: string,
  message: string
): Promise<boolean> {
  const businessEmail = "mlwebdesigntn@gmail.com";
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%); padding: 30px; border-radius: 8px 8px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 24px;">New Website Inquiry</h1>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="margin-bottom: 20px;">You have received a new inquiry from your website contact form:</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${name}</p>
      <p style="margin: 0 0 10px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #8B5CF6;">${email}</a></p>
      <p style="margin: 0 0 10px 0;"><strong>Company:</strong> ${company || 'Not provided'}</p>
    </div>
    
    <h3 style="margin-bottom: 10px;">Message:</h3>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; white-space: pre-wrap;">
${message}
    </div>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      <p style="margin: 0; color: #666; font-size: 14px;">Reply directly to this email or contact them at: <a href="mailto:${email}" style="color: #8B5CF6;">${email}</a></p>
    </div>
  </div>
  <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
    <p>This message was sent from the ML WebDesign website contact form.</p>
  </div>
</body>
</html>`;

  try {
    const sendgrid = await getUncachableSendGridClient();
    if (!sendgrid) {
      console.log('[Email] SendGrid not available for contact form');
      return false;
    }

    await sendgrid.client.send({
      to: businessEmail,
      from: {
        email: sendgrid.fromEmail,
        name: 'ML WebDesign Website'
      },
      replyTo: email,
      subject: `New Website Inquiry from ${name}`,
      html: html,
    });
    console.log(`[Email] Contact form email sent to business`);
    return true;
  } catch (error: any) {
    console.error("[Email] Failed to send contact form email:", error?.response?.body || error?.message || error);
    return false;
  }
}

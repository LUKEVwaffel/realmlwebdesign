import bcrypt from "bcrypt";
import { storage } from "./storage";
import { sendBetaWelcomeEmail } from "./emailService";

const DEFAULT_ADMINS = [
  {
    email: "lukevetsch@mlwebdesign.net",
    password: "Goatbaba12!",
    firstName: "Luke",
    lastName: "Vetsch",
    role: "admin" as const,
  },
];

// Beta tester account — Awaken Creative
const BETA_USERS = [
  {
    email: "Caleb@awakencreativecda.com",
    password: "AwakenBeta2026!",
    firstName: "Caleb",
    lastName: "Awaken",
    role: "client" as const,
    // Client record details
    businessLegalName: "Awaken Creative CDA",
    businessEmail: "Caleb@awakencreativecda.com",
    businessPhone: "",
    industry: "Creative Agency",
    source: "referral" as const,
    internalNotes: "Beta tester — reviewing DUO portal layout directions.",
  },
];

export async function seedDatabase() {
  console.log("[seed] Checking for admin users...");

  // Track admin ID so we can set createdBy on client records
  let adminUserId: string | null = null;

  for (const admin of DEFAULT_ADMINS) {
    try {
      const existingUser = await storage.getUserByEmail(admin.email);

      if (!existingUser) {
        console.log(`[seed] Creating admin user: ${admin.email}`);
        const passwordHash = await bcrypt.hash(admin.password, 10);
        const created = await storage.createUser({
          email: admin.email,
          passwordHash,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: "admin",
          isActive: true,
          mustChangePassword: false,
          pinHash: null,
          pinEnabled: false,
        });
        adminUserId = created.id;
        console.log(`[seed] Created admin user: ${admin.email}`);
      } else {
        adminUserId = existingUser.id;
        console.log(`[seed] Admin user already exists: ${admin.email}`);
      }
    } catch (error) {
      console.error(`[seed] Error creating admin ${admin.email}:`, error);
    }
  }

  // Seed beta users + client records
  console.log("[seed] Checking for beta users...");
  for (const user of BETA_USERS) {
    try {
      const existing = await storage.getUserByEmail(user.email);
      let userId: string;

      if (!existing) {
        console.log(`[seed] Creating beta user: ${user.email}`);
        const passwordHash = await bcrypt.hash(user.password, 10);
        const created = await storage.createUser({
          email: user.email,
          passwordHash,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: true,
          mustChangePassword: false,
          pinHash: null,
          pinEnabled: false,
        });
        userId = created.id;
        console.log(`[seed] Created beta user: ${user.email}`);

        // Send welcome email
        const loginUrl = `${process.env.APP_URL || "https://portal.mlwebdesign.net"}/portal/login`;
        await sendBetaWelcomeEmail(user.email, user.firstName, user.password, loginUrl)
          .then(sent => console.log(`[seed] Beta welcome email ${sent ? "sent" : "skipped (SendGrid not configured)"}: ${user.email}`))
          .catch(err => console.error("[seed] Failed to send beta welcome email:", err));
      } else {
        userId = existing.id;
        console.log(`[seed] Beta user already exists: ${user.email}`);
      }

      // Ensure a client record exists for this user
      const existingClient = await storage.getClientByUserId(userId);
      if (!existingClient) {
        console.log(`[seed] Creating client record for: ${user.email}`);
        await storage.createClient({
          userId,
          businessLegalName: user.businessLegalName,
          businessEmail: user.businessEmail,
          businessPhone: user.businessPhone || null,
          industry: user.industry || null,
          source: user.source || null,
          internalNotes: user.internalNotes || null,
          createdBy: adminUserId || null,
          assignedTo: adminUserId || null,
          priority: "normal",
          isActive: true,
        } as any);
        console.log(`[seed] Created client record for: ${user.email}`);
      } else {
        console.log(`[seed] Client record already exists for: ${user.email}`);
      }
    } catch (error) {
      console.error(`[seed] Error processing beta user ${user.email}:`, error);
    }
  }

  console.log("[seed] Database seeding complete");
}

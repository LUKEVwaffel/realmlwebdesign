import bcrypt from "bcrypt";
import { storage } from "./storage";

const DEFAULT_ADMINS = [
  {
    email: "luke@mlwebdesign.com",
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
  },
];

export async function seedDatabase() {
  console.log("[seed] Checking for admin users...");
  
  for (const admin of DEFAULT_ADMINS) {
    try {
      const existingUser = await storage.getUserByEmail(admin.email);
      
      if (!existingUser) {
        console.log(`[seed] Creating admin user: ${admin.email}`);
        const passwordHash = await bcrypt.hash(admin.password, 10);

        await storage.createUser({
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
        
        console.log(`[seed] Created admin user: ${admin.email}`);
      } else {
        console.log(`[seed] Admin user already exists: ${admin.email}`);
      }
    } catch (error) {
      console.error(`[seed] Error creating admin ${admin.email}:`, error);
    }
  }
  
  // Seed beta users
  console.log("[seed] Checking for beta users...");
  for (const user of BETA_USERS) {
    try {
      const existing = await storage.getUserByEmail(user.email);
      if (!existing) {
        console.log(`[seed] Creating beta user: ${user.email}`);
        const passwordHash = await bcrypt.hash(user.password, 10);
        await storage.createUser({
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
        console.log(`[seed] Created beta user: ${user.email}`);
      } else {
        console.log(`[seed] Beta user already exists: ${user.email}`);
      }
    } catch (error) {
      console.error(`[seed] Error creating beta user ${user.email}:`, error);
    }
  }

  console.log("[seed] Database seeding complete");
}

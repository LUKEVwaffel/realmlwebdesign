import bcrypt from "bcrypt";
import { storage } from "./storage";

const DEFAULT_ADMINS = [
  {
    email: "luke@mlwebdesign.com",
    password: "Goatbaba12!",
    firstName: "Luke",
    lastName: "Vetsch",
    pin: "1234",
  },
  {
    email: "makaio@mlwebdesign.com", 
    password: "Goatbaba12!",
    firstName: "Makaio",
    lastName: "Roos",
    pin: "1234",
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
        const pinHash = await bcrypt.hash(admin.pin, 10);
        
        await storage.createUser({
          email: admin.email,
          passwordHash,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: "admin",
          isActive: true,
          mustChangePassword: false,
          pinHash,
          pinEnabled: true,
        });
        
        console.log(`[seed] Created admin user: ${admin.email}`);
      } else {
        console.log(`[seed] Admin user already exists: ${admin.email}`);
      }
    } catch (error) {
      console.error(`[seed] Error creating admin ${admin.email}:`, error);
    }
  }
  
  console.log("[seed] Database seeding complete");
}

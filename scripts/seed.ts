#!/usr/bin/env tsx

/**
 * Database seeding script for ngantri food court system
 * This script populates the database with initial test data
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import {
  admins,
  merchants,
  menuCategories,
  menus,
  orderItems,
  orderPaymentItems,
  orderPayments,
  orders,
  cartItems,
  buyerSessions,
} from "../src/data/schema";

// Hash password helper
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

// Database connection
const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5433/ngantri";
const sql = postgres(connectionString);
const db = drizzle(sql);

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  try {
    // Clean existing data (in reverse dependency order)
    console.log("🧹 Cleaning existing data...");
    await db.delete(orderItems);
    await db.delete(orderPaymentItems);
    await db.delete(orderPayments);
    await db.delete(orders);
    await db.delete(cartItems);
    await db.delete(buyerSessions);
    await db.delete(menus);
    await db.delete(menuCategories);
    await db.delete(merchants);
    await db.delete(admins);

    // Seed admins
    console.log("👤 Seeding admins...");
    const adminData = [
      {
        username: "admin",
        passwordHash: await hashPassword("admin123"),
        name: "System Administrator",
      },
    ];

    const insertedAdmins = await db
      .insert(admins)
      .values(adminData)
      .returning();
    console.log(`✅ Inserted ${insertedAdmins.length} admin(s)`);

    // Seed merchants
    console.log("🏪 Seeding merchants...");
    const merchantsData = [
      {
        name: "Warung Nasi Padang Sederhana",
        phoneNumber: "+6281234567890",
        merchantNumber: 1,
        passwordHash: await hashPassword("password123"),
        imageUrl:
          "https://media.istockphoto.com/id/1144682898/photo/nasi-padang-with-green-chilli-chicken-padang-rice.jpg?s=612x612&w=0&k=20&c=ld5DSCzy9c3QgGQbocxSwju7XQ1_2AxRsjov8eMBz3Q=",
        description:
          "Authentic Padang cuisine with rich flavors and traditional recipes",
        isAvailable: true,
      },
      {
        name: "Bakso Malang Mas Yanto",
        phoneNumber: "+6281234567891",
        merchantNumber: 2,
        passwordHash: await hashPassword("password123"),
        imageUrl:
          "https://images.unsplash.com/photo-1726375748321-c0ab6377e81a?q=80&w=800&h=800&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        description: "Famous Malang meatball soup with various toppings",
        isAvailable: true,
      },
    ];

    const insertedMerchants = await db
      .insert(merchants)
      .values(merchantsData)
      .returning();
    console.log(`✅ Inserted ${insertedMerchants.length} merchants`);

    // Seed categories
    console.log("📂 Seeding menu categories...");
    const categoriesData = [
      { name: "Nasi & Lauk", merchantId: insertedMerchants[0].id },
      { name: "Minuman", merchantId: insertedMerchants[0].id },
      { name: "Bakso", merchantId: insertedMerchants[1].id },
      { name: "Minuman", merchantId: insertedMerchants[1].id },
    ];

    const insertedCategories = await db
      .insert(menuCategories)
      .values(categoriesData)
      .returning();
    console.log(`✅ Inserted ${insertedCategories.length} categories`);

    // Seed menu items
    console.log("🍽️ Seeding menu items...");

    // Get category IDs
    const padangNasiCategory = insertedCategories.find(
      (c) =>
        c.merchantId === insertedMerchants[0].id && c.name === "Nasi & Lauk"
    );
    const padangMinumanCategory = insertedCategories.find(
      (c) => c.merchantId === insertedMerchants[0].id && c.name === "Minuman"
    );
    const baksoCategory = insertedCategories.find(
      (c) => c.merchantId === insertedMerchants[1].id && c.name === "Bakso"
    );
    const baksoMinumanCategory = insertedCategories.find(
      (c) => c.merchantId === insertedMerchants[1].id && c.name === "Minuman"
    );

    const menuItems = [];

    // Padang menu items
    if (padangNasiCategory) {
      menuItems.push(
        {
          name: "Nasi Rendang",
          description:
            "Nasi putih dengan rendang daging sapi yang gurih dan pedas",
          price: 35000,
          isAvailable: true,
          merchantId: insertedMerchants[0].id,
          categoryId: padangNasiCategory.id,
          imageUrl:
            "https://upload.wikimedia.org/wikipedia/commons/d/d5/Nasi_ramas_rendang.JPG",
        },
        {
          name: "Nasi Gulai Ayam",
          description: "Nasi dengan gulai ayam bumbu rempah khas Padang",
          price: 28000,
          isAvailable: true,
          merchantId: insertedMerchants[0].id,
          categoryId: padangNasiCategory.id,
          imageUrl:
            "https://cdn.rri.co.id/berita/Meulaboh/o/1734509527524-1000158686/dgatdppgmu24t1i.jpeg",
        }
      );
    }

    if (padangMinumanCategory) {
      menuItems.push({
        name: "Es Teh Manis",
        description: "Teh manis dingin segar",
        price: 8000,
        isAvailable: true,
        merchantId: insertedMerchants[0].id,
        categoryId: padangMinumanCategory.id,
        imageUrl:
          "https://majalengka.easydes.id/assets/upload-foto/5d31ef90cd6c389e07bc48a08e583122.jpg",
      });
    }

    // Bakso menu items
    if (baksoCategory) {
      menuItems.push(
        {
          name: "Bakso Jumbo",
          description: "Bakso besar dengan kuah kaldu sapi dan mie",
          price: 25000,
          isAvailable: true,
          merchantId: insertedMerchants[1].id,
          categoryId: baksoCategory.id,
          imageUrl:
            "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300",
        },
        {
          name: "Bakso Urat",
          description: "Bakso dengan urat sapi dan tahu goreng",
          price: 22000,
          isAvailable: true,
          merchantId: insertedMerchants[1].id,
          categoryId: baksoCategory.id,
          imageUrl:
            "https://images.unsplash.com/photo-1726375748321-c0ab6377e81a?q=80&w=800&h=800&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        }
      );
    }

    if (baksoMinumanCategory) {
      menuItems.push({
        name: "Es Jeruk",
        description: "Jus jeruk segar dengan es batu",
        price: 12000,
        isAvailable: true,
        merchantId: insertedMerchants[1].id,
        categoryId: baksoMinumanCategory.id,
        imageUrl:
          "https://d1vbn70lmn1nqe.cloudfront.net/prod/wp-content/uploads/2023/03/09062214/X-Manfaat-Es-Jeruk-dan-Resep-untuk-Membuatnya.jpg",
      });
    }

    const insertedMenus = await db.insert(menus).values(menuItems).returning();
    console.log(`✅ Inserted ${insertedMenus.length} menu items`);

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   • ${insertedAdmins.length} admin(s)`);
    console.log(`   • ${insertedMerchants.length} merchants`);
    console.log(`   • ${insertedCategories.length} categories`);
    console.log(`   • ${insertedMenus.length} menu items`);
    console.log("\n🔑 Admin login credentials:");
    console.log("   Username: admin, Password: admin123");
    console.log("\n🔑 Test merchant login credentials:");
    console.log(
      "   Phone: +6281234567890, Password: password123 (Warung Nasi Padang)"
    );
    console.log(
      "   Phone: +6281234567891, Password: password123 (Bakso Malang)"
    );
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedDatabase().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

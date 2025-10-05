import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../data/schema";

// Database connection string
const connectionString =
  process.env.DATABASE_URL || "postgres://localhost:5432/ngantri";

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

export type DbClient = typeof db;

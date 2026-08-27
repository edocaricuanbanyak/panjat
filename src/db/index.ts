import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set (see .env.example)");
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
export { schema };

export type Database = typeof db;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
/** Accept either the root client or a transaction handle. */
export type DbOrTx = Database | Transaction;

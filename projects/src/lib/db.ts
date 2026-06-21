import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/storage/database/shared/schema";
import * as relations from "@/storage/database/shared/relations";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const pool = new Pool({
  connectionString,
  max: 10,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  options: "-c statement_timeout=15000",
});
export const db = drizzle(pool, { schema: { ...schema, ...relations } });
export { schema };

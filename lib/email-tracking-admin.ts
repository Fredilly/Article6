import { Pool } from "pg";

let pool: Pool | undefined;

function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing POSTGRES_URL or DATABASE_URL environment variable.");
  pool = new Pool({
    connectionString,
    max: 2,
    ...(process.env.NODE_ENV === "production"
      ? { ssl: { rejectUnauthorized: true } }
      : connectionString.includes("localhost")
        ? { ssl: false }
        : {}),
  });
  return pool;
}

export async function clearEmailTrackingHistory(): Promise<{ trackingDeleted: number; eventsDeleted: number }> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const events = await client.query("DELETE FROM sales_email_tracking_events");
    const tracking = await client.query("DELETE FROM sales_email_tracking");
    await client.query("COMMIT");
    return { trackingDeleted: tracking.rowCount || 0, eventsDeleted: events.rowCount || 0 };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

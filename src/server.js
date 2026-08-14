import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkDatabase, closeDriver } from "./db.js";
import { config, missingDatabaseConfig } from "./config.js";
import { findReferrals, findServices, getOverview } from "./repository.js";

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(path.join(here, "../public")));

app.get("/api/health", async (_req, res) => {
  if (missingDatabaseConfig()) return res.status(503).json({ connected: false, message: "Database connection has not been configured." });
  try {
    await checkDatabase();
    res.json({ connected: true });
  } catch {
    res.status(503).json({ connected: false, message: "Unable to reach CognoDB. Check your URI, password, and instance status." });
  }
});

app.get("/api/overview", async (_req, res, next) => {
  try { res.json(await getOverview()); } catch (error) { next(error); }
});

app.get("/api/services", async (req, res, next) => {
  try { res.json(await findServices(req.query)); } catch (error) { next(error); }
});

app.get("/api/referrals", async (req, res, next) => {
  const allowedNeeds = new Set(["food", "housing", "work", "wellbeing"]);
  if (!allowedNeeds.has(req.query.need)) return res.status(400).json({ message: "Choose a valid support need." });
  try { res.json(await findReferrals(req.query)); } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  const unavailable = error.code === "DATABASE_NOT_CONFIGURED" || /connect|auth|database|service unavailable/i.test(error.message);
  console.error(error);
  res.status(unavailable ? 503 : 500).json({
    message: unavailable ? "The support map is temporarily unavailable. Please try again later." : "Something went wrong while loading the map."
  });
});

const server = app.listen(config.port, () => console.log(`Neighbourhood Resilience Map listening on http://localhost:${config.port}`));
process.on("SIGINT", async () => { await closeDriver(); server.close(() => process.exit(0)); });

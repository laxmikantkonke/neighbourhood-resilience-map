import "dotenv/config";
import { closeDriver, runWrite } from "../src/db.js";

const organisations = [
  { id: "harbour", name: "Harbour Community Kitchen", kind: "Community kitchen", verified: true },
  { id: "shelter", name: "Shelter Link", kind: "Housing charity", verified: true },
  { id: "bridge", name: "Bridge Works", kind: "Employment cooperative", verified: true },
  { id: "mindful", name: "Mindful Neighbours", kind: "Wellbeing collective", verified: false },
  { id: "northstar", name: "Northstar Advice", kind: "Advice centre", verified: true }
];
const areas = ["Riverside", "Old Town", "North End"];
const needs = [
  { slug: "food", name: "Food support" }, { slug: "housing", name: "Housing advice" },
  { slug: "work", name: "Work and skills" }, { slug: "wellbeing", name: "Wellbeing" }
];
const services = [
  { id: "hot-meals", name: "Hot meals, no referral", category: "Food", description: "Fresh evening meals and a weekly pantry, with no paperwork required.", availability: "Mon-Sat, 5-8pm", organisation: "harbour", need: "food" },
  { id: "rent-rights", name: "Rent and tenancy clinic", category: "Housing", description: "One-to-one tenancy advice, landlord letters, and emergency housing referrals.", availability: "Tue & Thu, 10am-4pm", organisation: "shelter", need: "housing" },
  { id: "job-lab", name: "Job Lab", category: "Work", description: "CV sessions, practical digital skills, and introductions to local employers.", availability: "Wed-Fri, 11am-5pm", organisation: "bridge", need: "work" },
  { id: "listening-circle", name: "Listening Circle", category: "Wellbeing", description: "A relaxed weekly peer space for connection, stress support, and guided signposting.", availability: "Saturday, 11am", organisation: "mindful", need: "wellbeing" },
  { id: "benefits-check", name: "Benefits and emergency grants", category: "Money", description: "Benefit checks and fast referrals to small hardship grants.", availability: "Mon-Fri, 9am-5pm", organisation: "northstar", need: "housing" },
  { id: "community-fridge", name: "Community fridge", category: "Food", description: "Take-what-you-need groceries and surplus produce for local residents.", availability: "Daily, 9am-7pm", organisation: "harbour", need: "food" }
];
const coverage = [
  ["harbour", "Riverside"], ["harbour", "Old Town"], ["shelter", "Riverside"], ["shelter", "North End"],
  ["bridge", "Old Town"], ["bridge", "North End"], ["mindful", "Old Town"], ["northstar", "Riverside"], ["northstar", "Old Town"]
];
const partnerships = [["harbour", "shelter"], ["shelter", "northstar"], ["northstar", "bridge"], ["bridge", "mindful"], ["harbour", "mindful"]];

async function seed() {
  await runWrite("CREATE CONSTRAINT organisation_id IF NOT EXISTS FOR (o:Organisation) REQUIRE o.id IS UNIQUE");
  await runWrite("CREATE CONSTRAINT service_id IF NOT EXISTS FOR (s:Service) REQUIRE s.id IS UNIQUE");
  await runWrite("CREATE CONSTRAINT need_slug IF NOT EXISTS FOR (n:Need) REQUIRE n.slug IS UNIQUE");
  await runWrite("CREATE CONSTRAINT area_name IF NOT EXISTS FOR (a:Area) REQUIRE a.name IS UNIQUE");
  await runWrite("UNWIND $rows AS row MERGE (o:Organisation {id: row.id}) SET o += row", { rows: organisations });
  await runWrite("UNWIND $rows AS row MERGE (a:Area {name: row})", { rows: areas });
  await runWrite("UNWIND $rows AS row MERGE (n:Need {slug: row.slug}) SET n.name = row.name", { rows: needs });
  await runWrite(`UNWIND $rows AS row MATCH (o:Organisation {id: row.organisation}) MATCH (n:Need {slug: row.need})
    MERGE (s:Service {id: row.id}) SET s.name=row.name, s.category=row.category, s.description=row.description, s.availability=row.availability
    MERGE (o)-[:OFFERS]->(s) MERGE (s)-[:ADDRESSES]->(n)`, { rows: services });
  await runWrite(`UNWIND $rows AS row MATCH (o:Organisation {id: row[0]}) MATCH (a:Area {name: row[1]}) MERGE (o)-[:SERVES]->(a)`, { rows: coverage });
  await runWrite(`UNWIND $rows AS row MATCH (a:Organisation {id: row[0]}) MATCH (b:Organisation {id: row[1]}) MERGE (a)-[:PARTNERS_WITH]->(b)`, { rows: partnerships });
  console.log("Seeded 5 organisations, 6 services, 4 needs, 3 areas, and trusted partnerships.");
}

seed().catch((error) => { console.error("Seed failed:", error.message); process.exitCode = 1; }).finally(closeDriver);

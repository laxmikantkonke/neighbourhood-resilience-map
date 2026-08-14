import { closeDriver, runRead } from "../src/db.js";

async function verify() {
  const result = await runRead(`
    MATCH (node)
    WITH count(node) AS nodes
    MATCH ()-[relationship]->()
    RETURN nodes, count(relationship) AS relationships
  `);
  const record = result.records[0];
  const nodes = record.get("nodes").toNumber();
  const relationships = record.get("relationships").toNumber();

  if (nodes < 18 || relationships < 26) {
    throw new Error(`Seed verification failed: expected at least 18 nodes and 26 relationships, found ${nodes} nodes and ${relationships} relationships.`);
  }
  console.log(`Database verified: ${nodes} nodes and ${relationships} relationships are available.`);
}

verify().catch((error) => {
  console.error("Verification failed:", error.message);
  process.exitCode = 1;
}).finally(closeDriver);

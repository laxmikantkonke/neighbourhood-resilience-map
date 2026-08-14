import neo4j from "neo4j-driver";
import { config, missingDatabaseConfig } from "./config.js";

let driver;

export function getDriver() {
  if (missingDatabaseConfig()) {
    const error = new Error("CognoDB is not configured. Set COGNODB_URI and COGNODB_PASSWORD in .env.");
    error.code = "DATABASE_NOT_CONFIGURED";
    throw error;
  }
  if (!driver) {
    driver = neo4j.driver(config.uri, neo4j.auth.basic(config.username, config.password));
  }
  return driver;
}

export async function runRead(cypher, parameters = {}) {
  const session = getDriver().session({ defaultAccessMode: neo4j.session.READ });
  try {
    return await session.run(cypher, parameters);
  } finally {
    await session.close();
  }
}

export async function runWrite(cypher, parameters = {}) {
  const session = getDriver().session({ defaultAccessMode: neo4j.session.WRITE });
  try {
    return await session.run(cypher, parameters);
  } finally {
    await session.close();
  }
}

export async function checkDatabase() {
  await getDriver().verifyConnectivity();
  return { connected: true };
}

export async function closeDriver() {
  if (driver) await driver.close();
}

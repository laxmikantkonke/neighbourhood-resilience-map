import { runRead } from "./db.js";
import { filtersQuery, overviewQuery, referralQuery, servicesQuery } from "./queries.js";

function toObject(record) {
  return record.toObject();
}

export async function getOverview() {
  const [services, filters] = await Promise.all([runRead(overviewQuery), runRead(filtersQuery)]);
  return {
    services: services.records.map(toObject),
    categories: filters.records[0]?.get("categories") || []
  };
}

export async function findServices({ category = "All", area = "All" }) {
  const result = await runRead(servicesQuery, { category, area });
  return result.records.map(toObject);
}

export async function findReferrals({ need, area = "All" }) {
  const result = await runRead(referralQuery, { need, area });
  return result.records.map(toObject);
}

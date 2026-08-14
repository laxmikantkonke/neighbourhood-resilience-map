export const overviewQuery = `
MATCH (o:Organisation)-[:OFFERS]->(s:Service)-[:ADDRESSES]->(n:Need)
OPTIONAL MATCH (o)-[:SERVES]->(a:Area)
RETURN o.name AS organisation, o.kind AS organisationKind, o.verified AS verified,
       s.id AS id, s.name AS name, s.category AS category, s.description AS description,
       s.availability AS availability, collect(DISTINCT a.name) AS areas,
       collect(DISTINCT n.name) AS needs
ORDER BY s.category, s.name`;

export const servicesQuery = `
MATCH (o:Organisation)-[:OFFERS]->(s:Service)-[:ADDRESSES]->(:Need)
OPTIONAL MATCH (o)-[:SERVES]->(a:Area)
WITH o, s, collect(DISTINCT a.name) AS areas
WHERE ($category = "All" OR s.category = $category)
  AND ($area = "All" OR $area IN areas)
RETURN o.name AS organisation, o.kind AS organisationKind, o.verified AS verified,
       s.id AS id, s.name AS name, s.category AS category, s.description AS description,
       s.availability AS availability, areas
ORDER BY s.category, s.name`;

// A four-hop traversal: need <- service <- provider -> partner -> nearby service.
export const referralQuery = `
MATCH (need:Need {slug: $need})<-[:ADDRESSES]-(primary:Service)<-[:OFFERS]-(provider:Organisation)
MATCH (provider)-[:PARTNERS_WITH]-(partner:Organisation)-[:OFFERS]->(recommended:Service)
MATCH (recommended)-[:ADDRESSES]->(recommendedNeed:Need)
WITH DISTINCT provider, partner, recommended, recommendedNeed
OPTIONAL MATCH (partner)-[:SERVES]->(area:Area)
WITH provider, partner, recommended, recommendedNeed,
     collect(DISTINCT area.name) AS areas
WHERE ($area = "All" OR $area IN areas)
RETURN provider.name AS provider, partner.name AS partner, partner.verified AS verified,
       recommended.name AS service, recommended.description AS description,
       recommended.category AS category, recommended.availability AS availability,
       recommendedNeed.name AS supports, areas
ORDER BY verified DESC, partner, service`;

export const filtersQuery = `
MATCH (s:Service) RETURN collect(DISTINCT s.category) AS categories
`;

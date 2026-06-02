import { vectorRetriever } from "./vector.retriever.js";
import { pool } from "../../config/vectorDb.js";

export const hybridRetriever = async ({ projectId, query, limit = 8 }) => {
  const vectorResults = await vectorRetriever({ projectId, query, limit });

  const keywordResults = await keywordSearch(projectId, query, limit);

  const merged = mergeResults(vectorResults, keywordResults, limit);

  return merged;
};

const keywordSearch = async (projectId, query, limit) => {
  const words = query.split(" ").filter((w) => w.length > 3).slice(0, 5);
  if (words.length === 0) return [];

  const tsQuery = words.join(" | ");

  const result = await pool.query(
    `SELECT id, content, metadata, 0.5 AS similarity
     FROM document_chunks
     WHERE metadata->>'project_id' = $1
       AND to_tsvector('english', content) @@ to_tsquery('english', $2)
     LIMIT $3`,
    [projectId, tsQuery, limit]
  );

  return result.rows;
};

const mergeResults = (vectorResults, keywordResults, limit) => {
  const seen = new Set();
  const merged = [];

  for (const r of vectorResults) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      merged.push(r);
    }
  }

  for (const r of keywordResults) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      merged.push(r);
    }
  }

  return merged.slice(0, limit);
};
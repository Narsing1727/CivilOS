import { embedText } from "../../services/embedding.service.js";
import { similaritySearch } from "../../config/vectorDb.js";

export const vectorRetriever = async ({ projectId, query, limit = 8 }) => {
  const embedding = await embedText(query);
  const results = await similaritySearch("document_chunks", embedding, limit, { project_id: projectId });
  return results;
};
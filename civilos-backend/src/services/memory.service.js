import Memory from "../models/Memory.js";
import User from "../models/User.js";
import { AppError } from "../middleware/errorHandler.js";
import { embedText } from "../services/embedding.service.js";
import { similaritySearch, insertEmbedding } from "../config/vectorDb.js";

export const addMemory = async (projectId, userId, data) => {
  const { title, content, type, tags, source_file_id } = data;
  if (!title || !content) throw new AppError("Title and content are required", 400);

  const memory = await Memory.create({
    project_id: projectId,
    created_by: userId,
    title,
    content,
    type: type || "note",
    tags: tags || [],
    source_file_id: source_file_id || null,
  });

  try {
    const embedding = await embedText(`${title}\n${content}`);
    await insertEmbedding("memory_embeddings", memory.id, embedding, {
      project_id: projectId,
      memory_id: memory.id,
      type: memory.type,
    });
    await memory.update({ embedding_id: memory.id });
  } catch (err) {
    console.warn("Embedding skipped:", err.message);
  }

  return memory;
};

export const getMemories = async (projectId, { limit, offset }, query) => {
  const where = { project_id: projectId };
  if (query.type) where.type = query.type;

  return Memory.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]],
    include: [{ model: User, as: "creator", attributes: ["id", "name"] }],
  });
};

export const searchMemory = async (projectId, query) => {
  if (!query) throw new AppError("Search query is required", 400);

  try {
    const embedding = await embedText(query);
    const results = await similaritySearch("memory_embeddings", embedding, 10, { project_id: projectId });

    if (results.length === 0) return [];

    const ids = results.map((r) => r.id);
    const memories = await Memory.findAll({ where: { id: ids } });

    return memories.map((m) => ({
      ...m.toJSON(),
      similarity: results.find((r) => r.id === m.id)?.similarity || 0,
    }));
  } catch (err) {
    console.warn("Search embedding skipped:", err.message);
    return [];
  }
};

export const deleteMemory = async (memoryId, userId) => {
  const memory = await Memory.findByPk(memoryId);
  if (!memory) throw new AppError("Memory not found", 404);
  if (memory.created_by !== userId) throw new AppError("Not authorized", 403);
  await memory.destroy();
};
import Message from "../models/Message.js";
import { oriAgent } from "../agents/ori.agent.js";
import { AppError } from "../middleware/errorHandler.js";

export const saveMessage = async (projectId, userId, role, content, extras = {}) => {
  return Message.create({
    project_id: projectId,
    user_id: userId,
    role,
    content,
    sources: extras.sources || [],
    reasoning: extras.reasoning || null,
    tokens_used: extras.tokens_used || 0,
  });
};

export const getRecentHistory = async (projectId, userId) => {
  return Message.findAll({
    where: { project_id: projectId, user_id: userId },
    order: [["created_at", "ASC"]],
    limit: 20,
    attributes: ["role", "content"],
  });
};

export const processMessage = async (projectId, userId, content) => {
  const history = await getRecentHistory(projectId, userId);

  const result = await oriAgent({ projectId, userId, query: content, history });

  const aiMessage = await saveMessage(projectId, userId, "assistant", result.answer, {
    sources: result.sources,
    reasoning: result.reasoning,
    tokens_used: result.tokens_used,
  });

  return aiMessage;
};

export const getMessages = async (projectId, userId, { limit, offset }) => {
  return Message.findAndCountAll({
    where: { project_id: projectId, user_id: userId },
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });
};

export const clearHistory = async (projectId, userId) => {
  await Message.destroy({ where: { project_id: projectId, user_id: userId } });
};
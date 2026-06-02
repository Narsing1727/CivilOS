import * as chatService from "../services/chat.service.js";
import { success, paginated } from "../utils/response.js";
import { getPagination } from "../utils/paginate.js";
import { io } from "../../server.js";
import { oriAgentStream } from "../agents/ori.agent.js";
import { v4 as uuidv4 } from "uuid";

export const sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    const { projectId } = req.params;

    const userMessage = await chatService.saveMessage(projectId, req.user.id, "user", content);
    io.to(`project:${projectId}`).emit("message", userMessage);

    const messageId = uuidv4();

    const history = await chatService.getRecentHistory(projectId, req.user.id);

    const sockets = await io.in(`project:${projectId}`).fetchSockets();
    const socket = sockets[0];

    success(res, { user_message: userMessage, message_id: messageId }, "Message sent");

    if (socket) {
      const { sources } = await oriAgentStream({
        projectId,
        userId: req.user.id,
        query: content,
        history,
        socket,
        messageId,
      });

      const aiMessage = await chatService.saveMessage(projectId, req.user.id, "assistant", "", {
        sources,
        messageId,
      });

      io.to(`project:${projectId}`).emit("ori_saved", { messageId, id: aiMessage.id });
    } else {
      const aiResponse = await chatService.processMessage(projectId, req.user.id, content);
      io.to(`project:${projectId}`).emit("message", aiResponse);
    }
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { rows, count } = await chatService.getMessages(req.params.projectId, req.user.id, { limit, offset });
    return paginated(res, rows, count, page, limit, "Messages fetched");
  } catch (err) {
    next(err);
  }
};

export const clearHistory = async (req, res, next) => {
  try {
    await chatService.clearHistory(req.params.projectId, req.user.id);
    return success(res, {}, "Chat history cleared");
  } catch (err) {
    next(err);
  }
};
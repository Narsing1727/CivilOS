import * as memoryService from "../services/memory.service.js";
import { success, paginated } from "../utils/response.js";
import { getPagination } from "../utils/paginate.js";

export const addMemory = async (req, res, next) => {
  try {
    const memory = await memoryService.addMemory(req.params.projectId, req.user.id, req.body);
    return success(res, memory, "Memory added", 201);
  } catch (err) {
    next(err);
  }
};

export const getMemories = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { rows, count } = await memoryService.getMemories(req.params.projectId, { limit, offset }, req.query);
    return paginated(res, rows, count, page, limit, "Memories fetched");
  } catch (err) {
    next(err);
  }
};

export const searchMemory = async (req, res, next) => {
  try {
    const { query } = req.body;
    const results = await memoryService.searchMemory(req.params.projectId, query);
    return success(res, results, "Memory search results");
  } catch (err) {
    next(err);
  }
};

export const deleteMemory = async (req, res, next) => {
  try {
    await memoryService.deleteMemory(req.params.memoryId, req.user.id);
    return success(res, {}, "Memory deleted");
  } catch (err) {
    next(err);
  }
};
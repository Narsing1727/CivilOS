import * as fileService from "../services/file.service.js";
import { success, paginated } from "../utils/response.js";
import { getPagination } from "../utils/paginate.js";
import path from "path"
export const uploadFile = async (req, res, next) => {
  try {
    const files = await fileService.uploadFiles(req.params.projectId, req.user.id, req.files, req.body);
    return success(res, files, "Files uploaded successfully", 201);
  } catch (err) {
    next(err);
  }
};

export const getFiles = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { rows, count } = await fileService.getFiles(req.params.projectId, { limit, offset }, req.query);
    return paginated(res, rows, count, page, limit, "Files fetched");
  } catch (err) {
    next(err);
  }
};

export const getFile = async (req, res, next) => {
  try {
    const file = await fileService.getFile(req.params.fileId);
    return success(res, file, "File fetched");
  } catch (err) {
    next(err);
  }
};

export const deleteFile = async (req, res, next) => {
  try {
    await fileService.deleteFile(req.params.fileId, req.user.id);
    return success(res, {}, "File deleted");
  } catch (err) {
    next(err);
  }
};

export const getFileParseStatus = async (req, res, next) => {
  try {
    const status = await fileService.getFileParseStatus(req.params.fileId);
    return success(res, status, "Parse status fetched");
  } catch (err) {
    next(err);
  }
};


export const downloadFile = async (req, res, next) => {
  try {
    const file = await fileService.getFile(req.params.fileId);
    res.download(path.resolve(file.file_path), file.original_name);
  } catch (err) {
    next(err);
  }
};
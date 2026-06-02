import File from "../models/File.js";
import ActivityLog from "../models/ActivityLog.js";
import { AppError } from "../middleware/errorHandler.js";
import { detectFileType, getFileSizeMB, deleteFile as removeFile } from "../utils/fileHelper.js";
import { embeddingJob } from "../jobs/embedding.job.js";

export const uploadFiles = async (projectId, userId, files, body) => {
  if (!files || files.length === 0) throw new AppError("No files uploaded", 400);

  const created = await Promise.all(
    files.map(async (f) => {
      const fileType = detectFileType(f.originalname);
      const sizeMB = parseFloat(getFileSizeMB(f.path));

      const file = await File.create({
        project_id: projectId,
        uploaded_by: userId,
        original_name: f.originalname,
        stored_name: f.filename,
        file_path: f.path,
        file_type: fileType,
        mime_type: f.mimetype,
        size_mb: sizeMB,
        category: body.category || "other",
        parse_status: "pending",
        embed_status: "pending",
      });

      await ActivityLog.create({
        project_id: projectId,
        user_id: userId,
        action: "file_uploaded",
        entity_type: "file",
        entity_id: file.id,
        metadata: { filename: f.originalname, file_type: fileType },
      });

      embeddingJob(file.id).catch(() => {});

      return file;
    })
  );

  return created;
};

export const getFiles = async (projectId, { limit, offset }, query) => {
  const where = { project_id: projectId };
  if (query.category) where.category = query.category;
  if (query.file_type) where.file_type = query.file_type;

  return File.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });
};

export const getFile = async (fileId) => {
  const file = await File.findByPk(fileId);
  if (!file) throw new AppError("File not found", 404);
  return file;
};

export const deleteFile = async (fileId, userId) => {
  const file = await File.findByPk(fileId);
  if (!file) throw new AppError("File not found", 404);
  if (file.uploaded_by !== userId) throw new AppError("Not authorized to delete this file", 403);

  removeFile(file.file_path);
  await file.destroy();
};

export const getFileParseStatus = async (fileId) => {
  const file = await File.findByPk(fileId, {
    attributes: ["id", "original_name", "parse_status", "embed_status", "parsed_data"],
  });
  if (!file) throw new AppError("File not found", 404);
  return file;
};
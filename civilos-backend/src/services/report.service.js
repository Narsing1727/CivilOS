import Report from "../models/Report.js";
import ActivityLog from "../models/ActivityLog.js";
import { generatePDF } from "../reports/generator.js";
import { AppError } from "../middleware/errorHandler.js";

export const generateReport = async (projectId, userId, { title, type }) => {
  if (!title) throw new AppError("Report title is required", 400);

  const report = await Report.create({
    project_id: projectId,
    generated_by: userId,
    title,
    type: type || "summary",
    status: "generating",
  });

  await ActivityLog.create({
    project_id: projectId,
    user_id: userId,
    action: "report_generated",
    entity_type: "report",
    entity_id: report.id,
    metadata: { title, type },
  });

  generatePDF({ reportId: report.id, projectId, type })
    .then(async (filePath) => {
      await report.update({ status: "ready", file_path: filePath });
    })
    .catch(async () => {
      await report.update({ status: "failed" });
    });

  return report;
};

export const getReports = async (projectId, { limit, offset }) => {
  return Report.findAndCountAll({
    where: { project_id: projectId },
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });
};

export const getReport = async (reportId) => {
  const report = await Report.findByPk(reportId);
  if (!report) throw new AppError("Report not found", 404);
  return report;
};
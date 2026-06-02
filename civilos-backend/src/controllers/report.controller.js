import * as reportService from "../services/report.service.js";
import { success, paginated } from "../utils/response.js";
import { getPagination } from "../utils/paginate.js";
import path from "path";
import fs from "fs";

export const generateReport = async (req, res, next) => {
  try {
    const { title, type } = req.body;
    const report = await reportService.generateReport(req.params.projectId, req.user.id, { title, type });
    return success(res, report, "Report generation started", 201);
  } catch (err) {
    next(err);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { rows, count } = await reportService.getReports(req.params.projectId, { limit, offset });
    return paginated(res, rows, count, page, limit, "Reports fetched");
  } catch (err) {
    next(err);
  }
};

export const getReport = async (req, res, next) => {
  try {
    const report = await reportService.getReport(req.params.reportId);
    return success(res, report, "Report fetched");
  } catch (err) {
    next(err);
  }
};

export const downloadReport = async (req, res, next) => {
  try {
    const report = await reportService.getReport(req.params.reportId);
    if (!report.file_path || !fs.existsSync(report.file_path)) {
      return next(new (await import("../middleware/errorHandler.js")).AppError("Report file not ready", 404));
    }
    res.download(path.resolve(report.file_path), `${report.title}.pdf`);
  } catch (err) {
    next(err);
  }
};
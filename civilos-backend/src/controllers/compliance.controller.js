import * as complianceService from "../services/compliance.service.js";
import { success, paginated } from "../utils/response.js";
import { getPagination } from "../utils/paginate.js";

export const runComplianceCheck = async (req, res, next) => {
  try {
    const { file_id, is_code, member_type } = req.body;
    const check = await complianceService.runCheck(req.params.projectId, req.user.id, { file_id, is_code, member_type });
    return success(res, check, "Compliance check initiated", 201);
  } catch (err) {
    next(err);
  }
};

export const getComplianceChecks = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { rows, count } = await complianceService.getChecks(req.params.projectId, { limit, offset });
    return paginated(res, rows, count, page, limit, "Compliance checks fetched");
  } catch (err) {
    next(err);
  }
};

export const getComplianceCheck = async (req, res, next) => {
  try {
    const check = await complianceService.getCheck(req.params.checkId);
    return success(res, check, "Compliance check fetched");
  } catch (err) {
    next(err);
  }
};
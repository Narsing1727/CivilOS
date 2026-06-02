import ComplianceCheck from "../models/ComplianceCheck.js";
import ActivityLog from "../models/ActivityLog.js";
import { complianceEngine } from "../compliance/engine.js";
import { AppError } from "../middleware/errorHandler.js";

export const runCheck = async (projectId, userId, { file_id, is_code, member_type }) => {
  if (!is_code) throw new AppError("IS code is required", 400);

  const check = await ComplianceCheck.create({
    project_id: projectId,
    file_id: file_id || null,
    triggered_by: userId,
    is_code,
    member_type: member_type || "general",
    status: "running",
  });

  await ActivityLog.create({
    project_id: projectId,
    user_id: userId,
    action: "compliance_check_started",
    entity_type: "compliance_check",
    entity_id: check.id,
    metadata: { is_code, member_type },
  });

  complianceEngine({ checkId: check.id, projectId, file_id, is_code, member_type })
    .then(async (results) => {
      const passed = results.filter((r) => r.status === "pass").length;
      const failed = results.filter((r) => r.status === "fail").length;

      await check.update({
        status: failed > 0 ? "failed" : "passed",
        results,
        total_checks: results.length,
        passed_checks: passed,
        failed_checks: failed,
        summary: `${passed}/${results.length} checks passed`,
      });

      await ActivityLog.create({
        project_id: projectId,
        user_id: userId,
        action: "compliance_check_completed",
        entity_type: "compliance_check",
        entity_id: check.id,
        metadata: { passed, failed, total: results.length },
        is_system: true,
      });
    })
    .catch(async () => {
      await check.update({ status: "partial" });
    });

  return check;
};

export const getChecks = async (projectId, { limit, offset }) => {
  return ComplianceCheck.findAndCountAll({
    where: { project_id: projectId },
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });
};

export const getCheck = async (checkId) => {
  const check = await ComplianceCheck.findByPk(checkId);
  if (!check) throw new AppError("Compliance check not found", 404);
  return check;
};
import User from "./User.js";
import Project from "./Project.js";
import File from "./File.js";
import Message from "./Message.js";
import ComplianceCheck from "./ComplianceCheck.js";
import Report from "./Report.js";
import Memory from "./Memory.js";
import Team from "./Team.js";
import ActivityLog from "./ActivityLog.js";

User.hasMany(Project, { foreignKey: "owner_id", as: "projects" });
Project.belongsTo(User, { foreignKey: "owner_id", as: "owner" });

Project.hasMany(File, { foreignKey: "project_id", as: "files" });
File.belongsTo(Project, { foreignKey: "project_id", as: "project" });
File.belongsTo(User, { foreignKey: "uploaded_by", as: "uploader" });

Project.hasMany(Message, { foreignKey: "project_id", as: "messages" });
Message.belongsTo(Project, { foreignKey: "project_id", as: "project" });
Message.belongsTo(User, { foreignKey: "user_id", as: "user" });

Project.hasMany(ComplianceCheck, { foreignKey: "project_id", as: "compliance_checks" });
ComplianceCheck.belongsTo(Project, { foreignKey: "project_id", as: "project" });
ComplianceCheck.belongsTo(User, { foreignKey: "triggered_by", as: "triggered_by_user" });

Project.hasMany(Report, { foreignKey: "project_id", as: "reports" });
Report.belongsTo(Project, { foreignKey: "project_id", as: "project" });
Report.belongsTo(User, { foreignKey: "generated_by", as: "generated_by_user" });

Project.hasMany(Memory, { foreignKey: "project_id", as: "memories" });
Memory.belongsTo(Project, { foreignKey: "project_id", as: "project" });
Memory.belongsTo(User, { foreignKey: "created_by", as: "creator" });

Project.hasMany(Team, { foreignKey: "project_id", as: "team_members" });
Team.belongsTo(Project, { foreignKey: "project_id", as: "project" });
Team.belongsTo(User, { foreignKey: "user_id", as: "user" });

Project.hasMany(ActivityLog, { foreignKey: "project_id", as: "activity_logs" });
ActivityLog.belongsTo(Project, { foreignKey: "project_id", as: "project" });
ActivityLog.belongsTo(User, { foreignKey: "user_id", as: "user" });

export {
  User,
  Project,
  File,
  Message,
  ComplianceCheck,
  Report,
  Memory,
  Team,
  ActivityLog,
};
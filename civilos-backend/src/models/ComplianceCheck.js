import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const ComplianceCheck = sequelize.define("ComplianceCheck", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  project_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  file_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  triggered_by: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("running", "passed", "failed", "partial"),
    defaultValue: "running",
  },
  is_code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  member_type: {
    type: DataTypes.ENUM("beam", "column", "slab", "foundation", "general"),
    defaultValue: "general",
  },
  results: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  total_checks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  passed_checks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  failed_checks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: "compliance_checks",
  timestamps: true,
  underscored: true,
});

export default ComplianceCheck;
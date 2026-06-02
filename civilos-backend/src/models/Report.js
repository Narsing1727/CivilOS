import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Report = sequelize.define("Report", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  project_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  generated_by: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM("compliance", "structural", "summary", "custom"),
    defaultValue: "summary",
  },
  status: {
    type: DataTypes.ENUM("generating", "ready", "failed"),
    defaultValue: "generating",
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  content: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: "reports",
  timestamps: true,
  underscored: true,
});

export default Report;
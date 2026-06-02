import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const ActivityLog = sequelize.define("ActivityLog", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  project_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entity_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  entity_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  is_system: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: "activity_logs",
  timestamps: true,
  underscored: true,
});

export default ActivityLog;
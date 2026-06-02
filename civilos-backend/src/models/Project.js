import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Project = sequelize.define("Project", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM("bridge", "building", "road", "dam", "tunnel", "other"),
    defaultValue: "other",
  },
  status: {
    type: DataTypes.ENUM("active", "archived", "completed"),
    defaultValue: "active",
  },
  owner_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: "projects",
  timestamps: true,
  underscored: true,
});

export default Project;
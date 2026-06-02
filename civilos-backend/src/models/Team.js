import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Team = sequelize.define("Team", {
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
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM("owner", "editor", "viewer"),
    defaultValue: "viewer",
  },
  invited_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "teams",
  timestamps: true,
  underscored: true,
});

export default Team;
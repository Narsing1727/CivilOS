import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Message = sequelize.define("Message", {
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
    type: DataTypes.ENUM("user", "assistant"),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  sources: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  reasoning: {
    type: DataTypes.JSONB,
    defaultValue: null,
  },
  tokens_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: "messages",
  timestamps: true,
  underscored: true,
});

export default Message;
import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const File = sequelize.define("File", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  project_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  uploaded_by: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  original_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  stored_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  file_type: {
    type: DataTypes.ENUM("pdf", "excel", "staad", "image", "text", "unknown"),
    allowNull: false,
  },
  mime_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  size_mb: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  parse_status: {
    type: DataTypes.ENUM("pending", "processing", "done", "failed"),
    defaultValue: "pending",
  },
  embed_status: {
    type: DataTypes.ENUM("pending", "processing", "done", "failed"),
    defaultValue: "pending",
  },
  parsed_data: {
    type: DataTypes.JSONB,
    defaultValue: null,
  },
  category: {
    type: DataTypes.ENUM("model", "drawing", "specification", "calculation", "report", "other"),
    defaultValue: "other",
  },
}, {
  tableName: "files",
  timestamps: true,
  underscored: true,
});

export default File;
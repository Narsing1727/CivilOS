import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Memory = sequelize.define("Memory", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  project_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM("decision", "note", "change", "finding", "assumption"),
    defaultValue: "note",
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  source_file_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  embedding_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: "memories",
  timestamps: true,
  underscored: true,
});

export default Memory;
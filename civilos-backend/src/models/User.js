import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const User = sequelize.define("User", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM("admin", "engineer", "viewer"),
    defaultValue: "engineer",
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  designation: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: "users",
  timestamps: true,
  underscored: true,
});

export default User;
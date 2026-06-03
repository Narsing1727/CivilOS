import { Sequelize } from "sequelize";
import { env } from "./env.js";
import { logger } from "./logger.js";
import { connectVectorDB } from "./vectorDb.js";

export const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: "postgres",
  logging: env.NODE_ENV === "development" ? (msg) => logger.debug(msg) : false,
  dialectOptions: env.NODE_ENV === "production" ? {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  } : {},
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export const connectDB = async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: env.NODE_ENV === "development" });
  await connectVectorDB();
  logger.info("PostgreSQL connected and synced");
};
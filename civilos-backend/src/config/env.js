import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",

  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  

  GROQ_API_KEY: process.env.GROQ_API_KEY,



  
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",

  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
  OPENAI_CHAT_MODEL: process.env.OPENAI_CHAT_MODEL || "gpt-4o",

  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || "50"),

  LOG_LEVEL: process.env.LOG_LEVEL || "info",
};
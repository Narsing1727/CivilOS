import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";

import { connectDB } from "./src/config/db.js";
import { env } from "./src/config/env.js";
import { logger } from "./src/config/logger.js";
import "./src/models/index.js";
import routes from "./src/routes/index.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
import { rateLimiter } from "./src/middleware/rateLimiter.js";
import extractRoutes from "./src/routes/extract.routes.js";
const app = express();
const httpServer = createServer(app);

export const io = new SocketServer(httpServer, {
  cors: {
    origin: env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));
app.use(rateLimiter);

app.use("/api/v1", routes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "CivilOS API", version: "1.0.0" });
});


app.use("/api/v1/extract", extractRoutes);


app.use(errorHandler);

io.on("connection", (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on("join_project", (projectId) => {
    socket.join(`project:${projectId}`);
  });

  socket.on("disconnect", () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

const start = async () => {
  try {
    await connectDB();
    httpServer.listen(env.PORT, () => {
      logger.info(`CivilOS API running on port ${env.PORT}`);
    });
  } catch (err) {
    logger.error("Failed to start server", err);
    process.exit(1);
  }
};

start();
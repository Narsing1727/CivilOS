import { Router } from "express";
import {
  uploadFile,
  getFiles,
  getFile,
  deleteFile,
  getFileParseStatus,
  downloadFile,
} from "../controllers/file.controller.js";
import { protect, projectMember } from "../middleware/auth.js";
import { uploadMultiple } from "../middleware/upload.js";
import { fileValidator } from "../validators/file.validator.js";
import { validate } from "../middleware/validate.js";

const router = Router({ mergeParams: true });

router.use(protect, projectMember);

router.post("/", uploadMultiple("files", 10), fileValidator, validate, uploadFile);
router.get("/", getFiles);
router.get("/:fileId", getFile);
router.get("/:fileId/download", downloadFile);
router.delete("/:fileId", deleteFile);
router.get("/:fileId/status", getFileParseStatus);

export default router;
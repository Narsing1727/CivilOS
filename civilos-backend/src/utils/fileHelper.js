import fs from "fs";
import path from "path";

export const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

export const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase().replace(".", "");
};

export const getFileSizeMB = (filePath) => {
  const stats = fs.statSync(filePath);
  return (stats.size / (1024 * 1024)).toFixed(2);
};

export const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

export const readFileBuffer = (filePath) => {
  return fs.readFileSync(filePath);
};

export const detectFileType = (filename) => {
  const ext = getFileExtension(filename);
  const typeMap = {
    pdf: "pdf",
    xlsx: "excel",
    xls: "excel",
    std: "staad",
    jpg: "image",
    jpeg: "image",
    png: "image",
    tif: "image",
    tiff: "image",
    txt: "text",
  };
  return typeMap[ext] || "unknown";
};
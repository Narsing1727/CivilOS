import { pdfParser } from "../parsers/pdf.parser.js";
import { textChunker } from "./chunkers/text.chunker.js";
import { embedBatch } from "../services/embedding.service.js";
import { insertChunk } from "../config/vectorDb.js";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../config/logger.js";
import path from "path";
import fs from "fs";

export const processFile = async ({ fileId, filePath, filename, projectId, fileType }) => {
  try {
    logger.info(`RAG pipeline starting for ${filename}`);

    let chunks = [];

    if (fileType === "pdf" || filename.endsWith(".pdf")) {
      const parsed = await pdfParser(filePath);
      if (!parsed.raw_text || parsed.raw_text.trim().length === 0) {
        logger.warn(`PDF ${filename} has no extractable text`);
        return { chunks_stored: 0 };
      }
      chunks = textChunker(parsed.raw_text);
    } else {
      logger.warn(`Unsupported file type for RAG: ${filename}`);
      return { chunks_stored: 0 };
    }

    if (chunks.length === 0) {
      logger.warn(`No chunks generated for ${filename}`);
      return { chunks_stored: 0 };
    }

    logger.info(`Generated ${chunks.length} chunks for ${filename}`);

    const texts = chunks.map((c) => c.text);
    const embeddings = await embedBatch(texts);

    for (let i = 0; i < chunks.length; i++) {
      const id = uuidv4();
      await insertChunk(id, embeddings[i], chunks[i].text, {
        file_id: fileId,
        filename,
        file_type: fileType,
        project_id: projectId,
        chunk_index: i,
      });
    }

    logger.info(`RAG pipeline complete — ${chunks.length} chunks stored for ${filename}`);
    return { chunks_stored: chunks.length };
  } catch (err) {
    logger.error(`RAG pipeline failed for ${filename}: ${err.message}`);
    return { chunks_stored: 0 };
  }
};
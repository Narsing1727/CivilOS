import File from "../models/File.js";
import { pdfParser } from "../parsers/pdf.parser.js";
import { excelParser } from "../parsers/excel.parser.js";
import { staadParser } from "../parsers/staad.parser.js";
import { drawingParser } from "../parsers/drawing.parser.js";
import { embedBatch } from "../services/embedding.service.js";
import { insertChunk } from "../config/vectorDb.js";
import { logger } from "../config/logger.js";
import { v4 as uuidv4 } from "uuid";

const parserMap = {
  pdf: pdfParser,
  excel: excelParser,
  staad: staadParser,
};

// Small batch size to prevent OOM crashes
const EMBED_BATCH_SIZE = 5;

// Helper to sleep between batches
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const embeddingJob = async (fileId) => {
  const file = await File.findByPk(fileId);
  if (!file) return;

  try {
    await file.update({ parse_status: "processing" });

    const parser = file.category === "drawing"
      ? drawingParser
      : parserMap[file.file_type];

    if (!parser) {
      await file.update({ parse_status: "done", embed_status: "done" });
      return;
    }

    const parsed = await parser(file.file_path);
    await file.update({ parsed_data: parsed, parse_status: "done" });

    await file.update({ embed_status: "processing" });

    const chunks = parsed.chunks || [];
    if (chunks.length === 0) {
      await file.update({ embed_status: "done" });
      logger.warn(`No chunks for file ${file.original_name}`);
      return;
    }

    // Trim chunks to max 500 chars each to reduce memory pressure
    const texts = chunks.map((c) => 
      (c.text || "").slice(0, 500).trim()
    ).filter(t => t.length > 0);

    // Cap total chunks at 100 to prevent OOM on large files
    const cappedTexts = texts.slice(0, 100);
    const cappedChunks = chunks.slice(0, 100);

    if (texts.length > 100) {
      logger.warn(`File ${file.original_name} has ${texts.length} chunks — capped at 100 to prevent OOM`);
    }

    // Process in small batches
    for (let i = 0; i < cappedTexts.length; i += EMBED_BATCH_SIZE) {
      const batchTexts = cappedTexts.slice(i, i + EMBED_BATCH_SIZE);
      const batchChunks = cappedChunks.slice(i, i + EMBED_BATCH_SIZE);

      try {
        const embeddings = await embedBatch(batchTexts);

        for (let j = 0; j < batchChunks.length; j++) {
          const chunkId = uuidv4();
          await insertChunk(chunkId, embeddings[j], batchTexts[j], {
            file_id: file.id,
            project_id: file.project_id,
            filename: file.original_name,
            file_type: file.file_type,
            chunk_index: i + j,
          });
        }

        logger.info(`Embedded batch ${Math.floor(i / EMBED_BATCH_SIZE) + 1}/${Math.ceil(cappedTexts.length / EMBED_BATCH_SIZE)} for ${file.original_name}`);

        // Small pause between batches to let GC run
        await sleep(200);

      } catch (batchErr) {
        logger.error(`Batch ${Math.floor(i / EMBED_BATCH_SIZE) + 1} failed for ${file.original_name}: ${batchErr.message} — skipping batch`);
        // Continue with next batch instead of crashing entire job
        await sleep(500);
        continue;
      }
    }

    await file.update({ embed_status: "done" });
    logger.info(`Embedding complete for file ${file.original_name} (${cappedTexts.length} chunks)`);

  } catch (err) {
    logger.error(`Embedding job failed for file ${fileId}: ${err.message}`);
    try {
      await file.update({ parse_status: "failed", embed_status: "failed" });
    } catch {}
  }
};
import { chat } from "../services/ai.service.js";
import File from "../models/File.js";
import { AppError } from "../middleware/errorHandler.js";

const SYSTEM_PROMPT = `
You are a document analysis agent for civil engineering projects.
You analyze structural models, drawings, specifications, and calculation sheets.
When comparing documents, identify conflicts, mismatches, and inconsistencies between them.
Be specific: reference member IDs, grid lines, sheet numbers, and clause numbers where possible.
`;

export const documentAgent = async ({ projectId, fileIds, query }) => {
  const files = await File.findAll({
    where: { id: fileIds, project_id: projectId },
    attributes: ["id", "original_name", "file_type", "category", "parsed_data"],
  });

  if (files.length === 0) throw new AppError("No files found", 404);

  const contextBlock = files.map((f) => {
    const data = f.parsed_data;
    if (!data) return `[${f.original_name}]: No parsed content available.`;
    const text = data.raw_text || JSON.stringify(data).slice(0, 2000);
    return `[${f.original_name} — ${f.category}]:\n${text}`;
  }).join("\n\n");

  const { answer, tokens_used } = await chat({
    systemPrompt: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Documents:\n${contextBlock}\n\nTask: ${query}`,
      },
    ],
    maxTokens: 2000,
  });

  return {
    analysis: answer,
    files_analyzed: files.map((f) => ({ id: f.id, name: f.original_name, type: f.file_type })),
    tokens_used,
  };
};
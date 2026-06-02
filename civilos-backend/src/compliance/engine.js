import { beamChecker } from "./checkers/beam.checker.js";
import { columnChecker } from "./checkers/column.checker.js";
import { foundationChecker } from "./checkers/foundation.checker.js";
import { slabChecker } from "./checkers/slab.checker.js";
import File from "../models/File.js";
import { pool } from "../config/vectorDb.js";
import Groq from "groq-sdk";
import { env } from "../config/env.js";

const checkerMap = {
  beam: beamChecker,
  column: columnChecker,
  foundation: foundationChecker,
  slab: slabChecker,
};

const extractMembersViaGroq = async (projectId) => {
  const result = await pool.query(
    `SELECT content FROM document_chunks WHERE metadata->>'project_id' = $1 ORDER BY created_at ASC`,
    [projectId]
  );
  const fullText = result.rows.map(r => r.content).join("\n").slice(0, 6000);
  if (!fullText.trim()) return [];

  const groq = new Groq({ apiKey: env.GROQ_API_KEY });
  const response = await groq.chat.completions.create({
  model: "llama-3.1-8b-instant",
    messages: [{
      role: "system",
      content: "You are a structural engineering data extractor. Return ONLY valid JSON array, no other text."
    }, {
      role: "user",
      content: `Extract structural members from this report. Return ONLY a JSON array, nothing else, no markdown:
[{"id":"B1","type":"beam","vu":100.0,"vc":120.0}]
Only include members where you found actual vu and vc values in kN.
Report:
${fullText.slice(0, 4000)}`
    }],
    temperature: 0.1,
    max_tokens: 1500,
  });

  const text = response.choices[0].message.content.trim().replace(/```json|```/g, "");
  const members = JSON.parse(text);
  return members.filter((m) => m.vu > 0 && m.vc > 0);
};

export const complianceEngine = async ({ checkId, projectId, file_id, is_code, member_type }) => {
  let parsedData = null;

  if (file_id) {
    const file = await File.findByPk(file_id);
    if (file?.parsed_data?.members?.length > 0) {
      parsedData = file.parsed_data;
    }
  }

  if (!parsedData || !parsedData.members || parsedData.members.length === 0) {
    try {
      const members = await extractMembersViaGroq(projectId);
      if (members.length > 0) {
        parsedData = { members };
      }
    } catch (err) {
      console.error("Groq extraction failed:", err.message);
    }
  }

  const checker = checkerMap[member_type];
  if (!checker) {
    return [{ status: "pass", clause: "general", note: "No specific checker for this member type" }];
  }

  const results = await checker({ parsedData, is_code, projectId });
  return results;
};
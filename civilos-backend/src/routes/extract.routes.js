import express from "express";
import Groq from "groq-sdk";
import { getChunksByProject } from "../config/vectorDb.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const router = express.Router();

const getGroq = () => new Groq({ apiKey: env.GROQ_API_KEY });

router.get("/:projectId/members", async (req, res) => {
  try {
    const chunks = await getChunksByProject(req.params.projectId);

    if (!chunks || chunks.length === 0) {
      return res.json({ data: [] });
    }

    const fullText = chunks
      .map(c => c.content || "")
      .join("\n")
      .slice(0, 3000);

    const response = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{
        role: "system",
        content: "You are a structural engineering data extractor. Return ONLY a valid JSON array. No markdown, no explanation, no extra text whatsoever."
      }, {
        role: "user",
        content: `Extract structural members from this report. Return ONLY a JSON array like this:
[{"id":"B1","type":"Beam","baseVu":145.2,"currentVc":198.4,"status":"pass","clause":"IS 456:2000 Cl. 40.1"}]

Rules:
- Generate IDs if missing: B1/B2 for beams, C1/C2 for columns, F1/F2 for foundations
- baseVu = shear demand or factored load in kN
- currentVc = shear capacity or permissible capacity in kN
- status: fail if baseVu > currentVc, warn if baseVu > 0.85*currentVc, else pass
- Extract maximum 8 members
- Return ONLY the JSON array, nothing else

Report:
${fullText}`
      }],
      temperature: 0.1,
      max_tokens: 1500,
    });

    const text = response.choices[0].message.content.trim();

    const clean = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const lastBracket = clean.lastIndexOf("]");
    const safeJson = lastBracket !== -1 ? clean.slice(0, lastBracket + 1) : clean;

    const members = JSON.parse(safeJson);

    const validated = members
      .filter(m => m.id && m.type && m.baseVu > 0 && m.currentVc > 0)
      .map(m => ({
        id: m.id,
        type: m.type,
        baseVu: Number(m.baseVu),
        currentVc: Number(m.currentVc),
        status: m.status || (m.baseVu > m.currentVc ? "fail" : "pass"),
        clause: m.clause || "IS 456:2000"
      }));

    res.json({ data: validated });
  } catch (err) {
    logger.warn(`extract members failed — ${err.message}`);
    res.status(500).json({ error: err.message, data: [] });
  }
});

export default router;
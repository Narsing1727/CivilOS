import Groq from "groq-sdk";
import { env } from "../config/env.js";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { logger } from "../config/logger.js";

const execAsync = promisify(exec);
const groq = new Groq({ apiKey: env.GROQ_API_KEY });

const EXTRACTION_PROMPT = `You are an expert structural engineer analyzing an engineering drawing.
Extract ALL structural members and data visible in this drawing.
Return ONLY a valid JSON object with this exact structure, no other text:
{
  "members": [
    {
      "id": "beam ID or label",
      "type": "beam|column|slab|foundation|wall|girder|pile",
      "grid_location": "grid reference like 4B-4C",
      "dimensions": {
        "width_mm": number or null,
        "depth_mm": number or null,
        "length_mm": number or null
      },
      "material": "M25|M30|Fe415|Fe500 etc or null",
      "reinforcement": "description or null",
      "notes": "any special notes"
    }
  ],
  "project_info": {
    "title": "drawing title if visible",
    "scale": "drawing scale if visible",
    "revision": "revision number if visible"
  },
  "is_codes_referenced": ["IS 456:2000", "etc"]
}`;

const convertPDFToImages = async (filePath) => {
  const outputDir = path.dirname(filePath);
  const baseName = path.basename(filePath, ".pdf");
  const images = [];

  for (let i = 1; i <= 3; i++) {
    const outputPath = path.join(outputDir, `${baseName}_page${i}.jpg`).replace(/\\/g, "/");
    const inputPath = filePath.replace(/\\/g, "/");
    
const MAGICK = `"C:\\Program Files\\ImageMagick-7.1.2-Q16-HDRI\\magick.exe"`;
const cmd = `${MAGICK} -density 150 "${inputPath}[${i - 1}]" -quality 75 -resize 1200x1600 "${outputPath}"`;

    try {
      await execAsync(cmd);
      if (fs.existsSync(outputPath)) {
        images.push(outputPath);
      } else {
        break;
      }
    } catch (err) {
      logger.warn(`Page ${i} conversion failed: ${err.message}`);
      break;
    }
  }

  return images;
};

const imageToBase64 = (imagePath) => {
  const buffer = fs.readFileSync(imagePath);
  return buffer.toString("base64");
};

const extractMembersFromImage = async (imagePath, pageNum) => {
  try {
    const base64 = imageToBase64(imagePath);
    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${base64}` }
          },
          { type: "text", text: EXTRACTION_PROMPT }
        ]
      }],
      max_tokens: 2000,
      temperature: 0.1,
    });

    const text = response.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    logger.warn(`Vision extraction failed for page ${pageNum}: ${err.message}`);
    return null;
  }
};

export const drawingParser = async (filePath) => {
  const absolutePath = path.resolve(filePath).replace(/\\/g, "/");
  logger.info(`Drawing Intelligence starting for ${absolutePath}`);

  const images = await convertPDFToImages(absolutePath);

  if (images.length === 0) {
    logger.warn("No images generated from PDF");
    return { members: [], project_info: {}, is_codes_referenced: [], pages_processed: 0 };
  }

  logger.info(`Processing ${images.length} pages with Groq Vision`);

  const allMembers = [];
  let projectInfo = {};
  const isCodesReferenced = new Set();

  for (let i = 0; i < images.length; i++) {
    const extracted = await extractMembersFromImage(images[i], i + 1);

    if (extracted) {
      if (extracted.members) allMembers.push(...extracted.members);
      if (extracted.project_info && extracted.project_info.title) {
        projectInfo = extracted.project_info;
      }
      if (extracted.is_codes_referenced) {
        extracted.is_codes_referenced.forEach(c => isCodesReferenced.add(c));
      }
    }

    try { fs.unlinkSync(images[i]); } catch {}
  }

  logger.info(`Drawing Intelligence complete — ${allMembers.length} members extracted`);

  return {
    members: allMembers,
    project_info: projectInfo,
    is_codes_referenced: Array.from(isCodesReferenced),
    pages_processed: images.length,
    raw_text: allMembers.map(m => `${m.type} ${m.id} at ${m.grid_location}: ${JSON.stringify(m.dimensions)}`).join("\n"),
    chunks: allMembers.map((m, i) => ({
      text: `${m.type.toUpperCase()} ${m.id} | Location: ${m.grid_location} | Dimensions: ${JSON.stringify(m.dimensions)} | Material: ${m.material} | Notes: ${m.notes}`,
      index: i
    }))
  };
};
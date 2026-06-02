import pdfParse from "pdf-parse";
import fs from "fs";

const chunkText = (text, chunkSize = 800, overlap = 100) => {
  const words = text.split(/\s+/);
  const chunks = [];
  let i = 0;

  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    chunks.push({ text: chunk, index: chunks.length });
    i += chunkSize - overlap;
  }

  return chunks;
};

export const pdfParser = async (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);

  const text = data.text.replace(/\s+/g, " ").trim();
  const chunks = chunkText(text);

  return {
    total_pages: data.numpages,
    raw_text: text,
    chunks,
  };
};
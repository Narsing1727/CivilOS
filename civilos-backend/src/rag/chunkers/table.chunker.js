export const tableChunker = (rows, sheetName = "Sheet") => {
  const chunks = [];
  const batchSize = 50;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const text = batch.map((row) =>
      Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(", ")
    ).join("\n");

    chunks.push({ text: `${sheetName} (rows ${i + 1}-${i + batch.length}):\n${text}`, index: chunks.length });
  }

  return chunks;
};
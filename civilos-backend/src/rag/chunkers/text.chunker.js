export const textChunker = (text, chunkSize = 800, overlap = 100) => {
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
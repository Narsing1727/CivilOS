import { pipeline } from "@xenova/transformers";

let extractor = null;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getExtractor = async () => {
  if (!extractor) {
   extractor = await pipeline(
  "feature-extraction",
  "Xenova/all-MiniLM-L6-v2",
  { 
    quantized: true,
  }
);
  }
  return extractor;
};

export const embedText = async (text) => {
  try {
    const model = await getExtractor();
    const output = await model(text.slice(0, 512), { 
      pooling: "mean",
      normalize: true,
    });
    return Array.from(output.data);
  } catch (err) {
    console.error("embedText failed:", err.message);
    // Return zero vector instead of crashing
    return new Array(384).fill(0);
  }
};

export const embedBatch = async (texts) => {
  const results = [];
  
  for (const text of texts) {
    try {
      const model = await getExtractor();
      const output = await model(text.slice(0, 512), {
        pooling: "mean",
        normalize: true,
      });
      results.push(Array.from(output.data));
      
      // Let GC breathe between each embedding
      await sleep(50);
    } catch (err) {
      console.error("embedBatch item failed:", err.message);
      // Push zero vector for failed item instead of crashing entire batch
      results.push(new Array(384).fill(0));
    }
  }
  
  return results;
};
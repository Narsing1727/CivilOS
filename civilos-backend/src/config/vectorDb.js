import pg from "pg";
import { env } from "./env.js";
import { logger } from "./logger.js";

const pool = new pg.Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
    ssl: env.NODE_ENV === "production" ? {
    require: true,
    rejectUnauthorized: false,
  } : false,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 10,
});

export const connectVectorDB = async () => {
  try {
    await pool.query("CREATE EXTENSION IF NOT EXISTS vector");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id UUID PRIMARY KEY,
        embedding vector(384),
        content TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS memory_embeddings (
        id UUID PRIMARY KEY,
        embedding vector(384),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info("pgvector ready — vector search enabled");
  } catch (err) {
    logger.warn("pgvector not available — vector search disabled. Server running without RAG.");
  }
};

export const insertEmbedding = async (table, id, embedding, metadata = {}) => {
  try {
    const vectorStr = `[${embedding.join(",")}]`;
    const query = `
      INSERT INTO ${table} (id, embedding, metadata, created_at)
      VALUES ($1, $2::vector, $3, NOW())
      ON CONFLICT (id) DO UPDATE SET embedding = $2::vector, metadata = $3
    `;
    await pool.query(query, [id, vectorStr, metadata]);
  } catch (err) {
    logger.warn(`insertEmbedding skipped — ${err.message}`);
  }
};

export const insertChunk = async (id, embedding, content, metadata = {}) => {
  try {
    const vectorStr = `[${embedding.join(",")}]`;
    const query = `
      INSERT INTO document_chunks (id, embedding, content, metadata, created_at)
      VALUES ($1, $2::vector, $3, $4, NOW())
      ON CONFLICT (id) DO UPDATE SET embedding = $2::vector, content = $3, metadata = $4
    `;
    await pool.query(query, [id, vectorStr, content, metadata]);
  } catch (err) {
    logger.warn(`insertChunk skipped — ${err.message}`);
  }
};

export const similaritySearch = async (table, embedding, limit = 5, filter = {}) => {
  try {
    const vectorStr = `[${embedding.join(",")}]`;
    let whereClause = "";
    const values = [vectorStr, limit];

    if (filter.project_id) {
      whereClause = "WHERE metadata->>'project_id' = $3";
      values.push(filter.project_id);
    }

    const query = `
      SELECT id, metadata, content,
        1 - (embedding <=> $1::vector) AS similarity
      FROM ${table}
      ${whereClause}
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `;

    const result = await pool.query(query, values);
    return result.rows;
  } catch (err) {
    logger.warn(`similaritySearch skipped — ${err.message}`);
    return [];
  }
};


export const getChunksByProject = async (projectId) => {
  try {
    const query = `
      SELECT content, metadata
      FROM document_chunks
      WHERE metadata->>'project_id' = $1
      ORDER BY created_at ASC
    `;
    const result = await pool.query(query, [projectId]);
    return result.rows;
  } catch (err) {
    logger.warn(`getChunksByProject failed — ${err.message}`);
    return [];
  }
};


export { pool };
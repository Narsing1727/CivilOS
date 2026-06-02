import { chat } from "../services/ai.service.js";
import { hybridRetriever } from "../rag/retrievers/hybrid.retriever.js";

const SYSTEM_PROMPT = `
You are a structural engineering reasoning engine.
Given project data and a specific engineering question, reason step by step.
Always reference IS code clauses when making engineering judgements.
Output your reasoning as a structured breakdown with: observation, analysis, clause reference, conclusion, and recommendation.
`;

export const reasoningAgent = async ({ projectId, query, context }) => {
  const retrieved = context || await hybridRetriever({ projectId, query, limit: 6 });

  const contextBlock = retrieved.length > 0
    ? retrieved.map((r, i) => `[Source ${i + 1}]\n${r.content || r.text}`).join("\n\n")
    : "No project context available.";

  const { answer, tokens_used } = await chat({
    systemPrompt: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Project Data:\n${contextBlock}\n\nEngineering Question: ${query}`,
      },
    ],
    maxTokens: 2000,
  });

  return { reasoning: answer, tokens_used };
};
import { hybridRetriever } from "../rag/retrievers/hybrid.retriever.js";
import { chat, chatStream } from "../services/ai.service.js";
import Project from "../models/Project.js";

const SYSTEM_PROMPT = (projectName) => `You are Ori, an expert AI engineering assistant for the civil infrastructure project "${projectName}" on CivilOS.

You have deep knowledge of Indian structural engineering standards including IS 456:2000, IS 800:2007, IS 1893:2016, and IS 875.

Your personality:
- Friendly, helpful, and conversational — not robotic
- When someone greets you, greet them back warmly and ask how you can help
- When asked engineering questions, be precise and technical
- For casual messages, respond naturally like a knowledgeable colleague

When you find relevant project data, always:
- Reference the specific member ID, grid location, or file
- Quote the exact IS clause number violated
- Give demand vs capacity values
- Suggest a specific fix

When no project data is available for a technical question, say so clearly but still help with general engineering knowledge.

Keep responses concise and readable. Use bullet points only when listing multiple items.`;

export const oriAgent = async ({ projectId, userId, query, history }) => {
  const project = await Project.findByPk(projectId);
  const projectName = project?.name || "the project";

  const retrieved = await hybridRetriever({ projectId, query, limit: 8 });

  const contextBlock = retrieved.length > 0
    ? retrieved.map((r, i) => `[Source ${i + 1}: ${r.metadata?.filename || "Project File"}]\n${r.content}`).join("\n\n")
    : "No project files have been uploaded yet for this query.";

  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    {
      role: "user",
      content: retrieved.length > 0
        ? `Project Context:\n${contextBlock}\n\nQuestion: ${query}`
        : query,
    },
  ];

  const { answer, tokens_used } = await chat({
    systemPrompt: SYSTEM_PROMPT(projectName),
    messages,
    maxTokens: 1500,
  });

  return {
    answer,
    sources: retrieved.map((r) => ({
      file_id: r.metadata?.file_id,
      filename: r.metadata?.filename,
      similarity: r.similarity,
    })),
    reasoning: null,
    tokens_used,
  };
};

export const oriAgentStream = async ({ projectId, userId, query, history, socket, messageId }) => {
  const project = await Project.findByPk(projectId);
  const projectName = project?.name || "the project";

  const retrieved = await hybridRetriever({ projectId, query, limit: 8 });

  const contextBlock = retrieved.length > 0
    ? retrieved.map((r, i) => `[Source ${i + 1}: ${r.metadata?.filename || "Project File"}]\n${r.content}`).join("\n\n")
    : "No project files have been uploaded yet for this query.";

  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    {
      role: "user",
      content: retrieved.length > 0
        ? `Project Context:\n${contextBlock}\n\nQuestion: ${query}`
        : query,
    },
  ];

  const sources = retrieved.map((r) => ({
    file_id: r.metadata?.file_id,
    filename: r.metadata?.filename,
    similarity: r.similarity,
  }));

socket.emit("ori_typing", { messageId });

await chatStream({
  systemPrompt: SYSTEM_PROMPT(projectName),
  messages,
  maxTokens: 1500,
  onToken: (token) => {
    socket.emit("ori_token", { messageId, token });
  },
  onDone: (fullText, tokens_used) => {
    socket.emit("ori_done", {
      messageId,
      content: fullText,
      sources,
      tokens_used,
    });
  },
});

  return { sources, reasoning: null };
};
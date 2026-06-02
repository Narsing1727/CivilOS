import Groq from "groq-sdk";
import { env } from "../config/env.js";

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export const chat = async ({ systemPrompt, messages, maxTokens = 1500 }) => {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
    ],
    max_tokens: maxTokens,
    temperature: 0.2,
  });

  return {
    answer: response.choices[0].message.content,
    tokens_used: response.usage?.total_tokens || 0,
  };
};

export const chatStream = async ({ systemPrompt, messages, maxTokens = 1500, onToken, onDone }) => {
  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
    ],
    max_tokens: maxTokens,
    temperature: 0.2,
    stream: true,
  });

  let fullText = "";
  let tokens_used = 0;

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || "";
    if (token) {
      fullText += token;
      onToken(token);
      await new Promise((resolve) => setTimeout(resolve , 20));
    }
    if (chunk.x_groq?.usage?.total_tokens) {
      tokens_used = chunk.x_groq.usage.total_tokens;
    }
  }

  onDone(fullText, tokens_used);
};
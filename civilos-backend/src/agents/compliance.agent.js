import { chat } from "../services/ai.service.js";

const SYSTEM_PROMPT = `
You are an IS code compliance expert for Indian structural engineering standards.
You know IS 456:2000, IS 800:2007, IS 1893:2016 in detail.
When given structural data, identify which IS clauses apply, check if they are satisfied, and explain violations clearly.
Always provide: clause number, what it requires, what the data shows, pass or fail, and a fix if failed.
`;

export const complianceAgent = async ({ memberData, is_code, member_type }) => {
  const dataText = JSON.stringify(memberData, null, 2);

  const { answer, tokens_used } = await chat({
    systemPrompt: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `IS Code: ${is_code}\nMember Type: ${member_type}\n\nMember Data:\n${dataText}\n\nRun a full compliance check and list all clause violations.`,
      },
    ],
    maxTokens: 2000,
  });

  return { compliance_analysis: answer, tokens_used };
};
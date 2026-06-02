export const columnChecker = async ({ parsedData, is_code }) => {
  const results = [];

  if (!parsedData || !parsedData.members) {
    return [{ status: "fail", clause: "N/A", note: "No parsed member data available" }];
  }

  for (const member of parsedData.members) {
    if (member.type !== "column") continue;

    if (member.pu !== undefined && member.puz !== undefined) {
      const pass = member.puz >= member.pu;
      results.push({
        member_id: member.id,
        member_label: member.label,
        check: "axial_capacity",
        clause: `${is_code} - Cl. 39.3`,
        pu: member.pu,
        puz: member.puz,
        status: pass ? "pass" : "fail",
        reason: pass ? "Puz >= Pu" : "Pu > Puz — axial demand exceeds capacity",
        suggestion: pass ? null : "Increase column size or longitudinal reinforcement",
      });
    }

    if (member.p !== undefined) {
      const minP = 0.8;
      const maxP = 6.0;
      const pass = member.p >= minP && member.p <= maxP;
      results.push({
        member_id: member.id,
        member_label: member.label,
        check: "reinforcement_percentage",
        clause: `${is_code} - Cl. 26.5.3.1`,
        p: member.p,
        status: pass ? "pass" : "fail",
        reason: pass ? "Reinforcement within limits" : `p=${member.p}% outside [${minP}%, ${maxP}%]`,
        suggestion: pass ? null : "Adjust longitudinal steel to meet IS code limits",
      });
    }

    if (member.lex !== undefined && member.d !== undefined) {
      const slenderness = member.lex / member.d;
      const pass = slenderness <= 12;
      results.push({
        member_id: member.id,
        member_label: member.label,
        check: "slenderness",
        clause: `${is_code} - Cl. 25.1.2`,
        slenderness: slenderness.toFixed(2),
        status: pass ? "pass" : "fail",
        reason: pass ? "Short column" : `Slenderness ratio ${slenderness.toFixed(2)} > 12 — slender column`,
        suggestion: pass ? null : "Redesign as slender column per IS456 Cl. 39.7",
      });
    }
  }

  return results;
};
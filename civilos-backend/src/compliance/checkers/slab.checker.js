export const slabChecker = async ({ parsedData, is_code }) => {
  const results = [];

  if (!parsedData || !parsedData.members) {
    return [{ status: "fail", clause: "N/A", note: "No parsed member data available" }];
  }

  for (const member of parsedData.members) {
    if (member.type !== "slab") continue;

    if (member.d !== undefined && member.l !== undefined) {
      const ratio = member.l / member.d;
      const allowable = member.is_continuous ? 26 : 20;
      const pass = ratio <= allowable;
      results.push({
        member_id: member.id,
        member_label: member.label,
        check: "span_depth_ratio",
        clause: `${is_code} - Cl. 23.2.1`,
        ratio: ratio.toFixed(2),
        allowable,
        status: pass ? "pass" : "fail",
        reason: pass ? "Span/depth ratio within limits" : `l/d = ${ratio.toFixed(2)} exceeds allowable ${allowable}`,
        suggestion: pass ? null : "Increase slab depth or reduce span",
      });
    }

    if (member.pt !== undefined) {
      const minPt = 0.12;
      const pass = member.pt >= minPt;
      results.push({
        member_id: member.id,
        member_label: member.label,
        check: "minimum_reinforcement",
        clause: `${is_code} - Cl. 26.5.2.1`,
        pt: member.pt,
        status: pass ? "pass" : "fail",
        reason: pass ? "Min reinforcement met" : `pt=${member.pt}% < minimum ${minPt}%`,
        suggestion: pass ? null : "Increase slab reinforcement to minimum 0.12%",
      });
    }

    if (member.cover !== undefined) {
      const minCover = 20;
      const pass = member.cover >= minCover;
      results.push({
        member_id: member.id,
        member_label: member.label,
        check: "clear_cover",
        clause: `${is_code} - Cl. 26.4.1`,
        cover: member.cover,
        status: pass ? "pass" : "fail",
        reason: pass ? "Clear cover adequate" : `Cover ${member.cover}mm < minimum ${minCover}mm`,
        suggestion: pass ? null : "Increase clear cover to minimum 20mm",
      });
    }
  }

  return results;
};
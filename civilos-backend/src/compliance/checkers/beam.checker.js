export const beamChecker = async ({ parsedData, is_code }) => {
  const results = [];

  if (!parsedData || !parsedData.members) {
    return [{ status: "fail", clause: "N/A", note: "No parsed member data available" }];
  }

  for (const member of parsedData.members) {
    if (member.type !== "beam") continue;

    if (member.vu !== undefined && member.vc !== undefined) {
      const pass = member.vc >= member.vu;
      results.push({
        member_id: member.id,
        member_label: member.label,
        check: "shear",
        clause: `${is_code} - Cl. 40.2.1`,
        vu: member.vu,
        vc: member.vc,
        status: pass ? "pass" : "fail",
        reason: pass ? "Vc >= Vu" : "Vu > Vc — shear demand exceeds capacity",
        suggestion: pass ? null : "Increase shear reinforcement (2-legged stirrups @ closer spacing)",
      });
    }

    if (member.mu !== undefined && member.mr !== undefined) {
      const pass = member.mr >= member.mu;
      results.push({
        member_id: member.id,
        member_label: member.label,
        check: "flexure",
        clause: `${is_code} - Cl. 26.5.1`,
        mu: member.mu,
        mr: member.mr,
        status: pass ? "pass" : "fail",
        reason: pass ? "Mr >= Mu" : "Mu > Mr — flexural demand exceeds capacity",
        suggestion: pass ? null : "Increase tension reinforcement or beam depth",
      });
    }

    if (member.pt !== undefined) {
      const minPt = 0.85 / 415;
      const maxPt = 0.04;
      const pass = member.pt >= minPt && member.pt <= maxPt;
      results.push({
        member_id: member.id,
        member_label: member.label,
        check: "reinforcement_ratio",
        clause: `${is_code} - Cl. 26.5.1.1`,
        pt: member.pt,
        status: pass ? "pass" : "fail",
        reason: pass ? "Reinforcement ratio within limits" : `pt=${member.pt} outside range [${minPt.toFixed(4)}, ${maxPt}]`,
        suggestion: pass ? null : "Adjust reinforcement to meet IS code limits",
      });
    }
  }

  return results;
};
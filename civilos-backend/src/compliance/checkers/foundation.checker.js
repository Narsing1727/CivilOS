export const foundationChecker = async ({ parsedData, is_code }) => {
  const results = [];

  if (!parsedData || !parsedData.members) {
    return [{ status: "fail", clause: "N/A", note: "No parsed member data available" }];
  }

  for (const member of parsedData.members) {
    if (member.type !== "foundation") continue;

    if (member.q !== undefined && member.sbc !== undefined) {
      const pass = member.q <= member.sbc;
      results.push({
        member_id: member.id,
        member_label: member.label,
        check: "bearing_pressure",
        clause: `${is_code} - Cl. 34.1`,
        q: member.q,
        sbc: member.sbc,
        status: pass ? "pass" : "fail",
        reason: pass ? "Bearing pressure within SBC" : `q=${member.q} kN/m² exceeds SBC=${member.sbc} kN/m²`,
        suggestion: pass ? null : "Increase footing area or use pile foundation",
      });
    }

    if (member.vu !== undefined && member.vc !== undefined) {
      const pass = member.vc >= member.vu;
      results.push({
        member_id: member.id,
        member_label: member.label,
        check: "punching_shear",
        clause: `${is_code} - Cl. 31.6`,
        vu: member.vu,
        vc: member.vc,
        status: pass ? "pass" : "fail",
        reason: pass ? "Punching shear OK" : "Punching shear demand exceeds capacity",
        suggestion: pass ? null : "Increase footing depth or add shear reinforcement",
      });
    }

    if (member.mu !== undefined && member.mr !== undefined) {
      const pass = member.mr >= member.mu;
      results.push({
        member_id: member.id,
        member_label: member.label,
        check: "flexure",
        clause: `${is_code} - Cl. 34.2.3`,
        mu: member.mu,
        mr: member.mr,
        status: pass ? "pass" : "fail",
        reason: pass ? "Flexural capacity OK" : "Flexural demand exceeds capacity",
        suggestion: pass ? null : "Increase bottom reinforcement in footing",
      });
    }
  }

  return results;
};
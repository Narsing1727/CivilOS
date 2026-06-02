export const complianceTemplate = ({ projectName, checks }) => ({
  title: `Compliance Report — ${projectName}`,
  sections: checks.map((c) => ({
    heading: `${c.is_code} — ${c.member_type}`,
    rows: c.results || [],
    summary: c.summary,
  })),
});
export const structuralTemplate = ({ projectName, members }) => ({
  title: `Structural Report — ${projectName}`,
  sections: [
    {
      heading: "Member Schedule",
      rows: (members || []).map((m) => ({
        id: m.id,
        label: m.label,
        type: m.type,
        start: m.start_node,
        end: m.end_node,
      })),
    },
  ],
});
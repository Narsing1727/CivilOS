import fs from "fs";

export const staadParser = async (filePath) => {
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);

  const members = [];
  const nodes = [];
  const sections = [];
  const loads = [];
  const chunks = [];

  let currentSection = null;

  for (const line of lines) {
    const upper = line.toUpperCase();

    if (upper.startsWith("JOINT COORDINATES")) { currentSection = "nodes"; continue; }
    if (upper.startsWith("MEMBER INCIDENCES")) { currentSection = "members"; continue; }
    if (upper.startsWith("MEMBER PROPERTIES")) { currentSection = "sections"; continue; }
    if (upper.startsWith("LOAD")) { currentSection = "loads"; continue; }
    if (upper.startsWith("FINISH")) { currentSection = null; continue; }

    if (currentSection === "nodes") {
      const parts = line.split(/\s+/);
      if (parts.length >= 4 && !isNaN(parts[0])) {
        nodes.push({ id: parts[0], x: parseFloat(parts[1]), y: parseFloat(parts[2]), z: parseFloat(parts[3]) });
      }
    }

    if (currentSection === "members") {
      const parts = line.split(/\s+/);
      if (parts.length >= 3 && !isNaN(parts[0])) {
        members.push({ id: parts[0], start_node: parts[1], end_node: parts[2], type: "beam" });
      }
    }

    if (currentSection === "sections") {
      sections.push({ raw: line });
    }

    if (currentSection === "loads") {
      loads.push({ raw: line });
    }
  }

  const summaryText = `STAAD Model: ${members.length} members, ${nodes.length} nodes, ${sections.length} section definitions, ${loads.length} load lines.`;
  chunks.push({ text: summaryText, index: 0 });

  const memberText = members.map((m) => `Member ${m.id}: from node ${m.start_node} to ${m.end_node}`).join("\n");
  if (memberText) chunks.push({ text: memberText, index: 1 });

  return {
    nodes,
    members,
    sections,
    loads,
    chunks,
    raw_line_count: lines.length,
  };
};
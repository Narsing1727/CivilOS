import xlsx from "xlsx";

export const excelParser = async (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheets = {};
  const chunks = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(sheet, { defval: "" });
    sheets[sheetName] = json;

    const text = json.map((row) => Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(", ")).join("\n");

    if (text.trim()) {
      chunks.push({ text: `Sheet: ${sheetName}\n${text}`, index: chunks.length });
    }
  }

  return { sheets, chunks };
};
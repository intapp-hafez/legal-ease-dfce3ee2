import * as XLSX from "xlsx";
import type { Row } from "@/lib/crud";

export type ExcelField = { key: string; label: string; type?: string; options?: string[] };

/** Downloads a ready-made .xlsx template: header labels + one sample row + options sheet. */
export function downloadTemplate(fileName: string, fields: ExcelField[], sample?: Row) {
  const headers = fields.map((f) => f.label);
  const example = fields.map((f) => {
    const v = sample?.[f.key];
    if (v !== undefined && v !== "") return v;
    if (f.type === "number" || f.type === "progress") return 0;
    if (f.type === "date") return "2026-01-01";
    if (f.options?.length) return f.options[0];
    return "";
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(14, String(h).length + 4) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "البيانات");

  const optionFields = fields.filter((f) => f.options?.length);
  if (optionFields.length) {
    const maxLen = Math.max(...optionFields.map((f) => f.options!.length));
    const rows: string[][] = [optionFields.map((f) => f.label)];
    for (let i = 0; i < maxLen; i++) rows.push(optionFields.map((f) => f.options![i] ?? ""));
    const wsOpt = XLSX.utils.aoa_to_sheet(rows);
    wsOpt["!cols"] = optionFields.map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(wb, wsOpt, "القيم المسموحة");
  }

  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

/** Parses an uploaded xlsx/csv file into rows keyed by field key (matches header labels or keys). */
export async function parseWorkbook(file: File, fields: ExcelField[]): Promise<Row[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return [];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });

  const byHeader = new Map<string, ExcelField>();
  for (const f of fields) {
    byHeader.set(String(f.label).trim(), f);
    byHeader.set(String(f.key).trim(), f);
  }

  const out: Row[] = [];
  for (const r of raw) {
    const row: Row = {};
    let any = false;
    for (const [header, value] of Object.entries(r)) {
      const f = byHeader.get(String(header).trim());
      if (!f) continue;
      const s = String(value ?? "").trim();
      if (s !== "") any = true;
      row[f.key] = f.type === "number" || f.type === "progress" ? Number(s) || 0 : s;
    }
    if (any) out.push(row);
  }
  return out;
}

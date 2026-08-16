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

export type SheetData = { headers: string[]; rows: Record<string, string>[] };

/** Reads the first sheet raw: its column headers and the string cell values. */
export async function readSheet(file: File): Promise<SheetData> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { headers: [], rows: [] };
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return { headers: [], rows: [] };
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });
  const headerRow = (aoa[0] ?? []).map((h) => String(h ?? "").trim());
  const headers = headerRow.filter((h) => h !== "");
  const rows: Record<string, string>[] = [];
  for (const line of aoa.slice(1)) {
    const row: Record<string, string> = {};
    let any = false;
    headerRow.forEach((h, i) => {
      if (!h) return;
      const s = String((line as unknown[])[i] ?? "").trim();
      if (s !== "") any = true;
      row[h] = s;
    });
    if (any) rows.push(row);
  }
  return { headers, rows };
}

/** Auto-guesses a header → field-key mapping by matching labels or keys. */
export function guessMapping(headers: string[], fields: ExcelField[]): Record<string, string> {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const lookup = new Map<string, string>();
  for (const f of fields) {
    lookup.set(norm(f.label), f.key);
    lookup.set(norm(f.key), f.key);
  }
  const map: Record<string, string> = {};
  for (const h of headers) map[h] = lookup.get(norm(h)) ?? "";
  return map;
}

/** Converts raw sheet rows into system rows using an explicit header → field mapping. */
export function mapRows(
  data: SheetData,
  mapping: Record<string, string>,
  fields: ExcelField[],
): Row[] {
  const byKey = new Map(fields.map((f) => [f.key, f]));
  const out: Row[] = [];
  for (const r of data.rows) {
    const row: Row = {};
    let any = false;
    for (const [header, key] of Object.entries(mapping)) {
      if (!key) continue;
      const f = byKey.get(key);
      if (!f) continue;
      const s = String(r[header] ?? "").trim();
      if (s !== "") any = true;
      let val: string | number = s;
      if (f.type === "number" || f.type === "progress") {
        val = Number(s) || 0;
      } else if (f.type === "date" && s) {
        if (s.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
          const [d, m, y] = s.split("/");
          if (d && m && y) {
            val = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
          }
        } else if (s.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
          const [d, m, y] = s.split("-");
          if (d && m && y) {
            val = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
          }
        }
      }
      row[key] = val;
    }
    if (any) out.push(row);
  }
  return out;
}

/** Parses an uploaded xlsx/csv file into rows keyed by field key (matches header labels or keys). */
export async function parseWorkbook(file: File, fields: ExcelField[]): Promise<Row[]> {
  const data = await readSheet(file);
  return mapRows(data, guessMapping(data.headers, fields), fields);
}


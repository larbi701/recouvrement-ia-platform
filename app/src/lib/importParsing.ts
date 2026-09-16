// Moteur d'import & parsing (§1 des specs techniques) — balance âgée Excel/CSV.
// Tourne côté navigateur pour l'aperçu instantané ("Analyse instantanée", §17).
import * as XLSX from "xlsx";

export type TargetField =
  | "clientName"
  | "reference"
  | "issueDate"
  | "dueDate"
  | "amountMad"
  | "contactEmail"
  | "contactPhone"
  | "sector"
  | "ignore";

export const TARGET_FIELD_LABELS: Record<TargetField, string> = {
  clientName: "Nom du client (obligatoire)",
  reference: "N° de facture (obligatoire)",
  issueDate: "Date d'émission (obligatoire)",
  dueDate: "Date d'échéance (obligatoire)",
  amountMad: "Montant TTC en MAD (obligatoire)",
  contactEmail: "Email du contact",
  contactPhone: "Téléphone du contact",
  sector: "Secteur d'activité",
  ignore: "— ignorer cette colonne —",
};

export const REQUIRED_FIELDS: TargetField[] = ["clientName", "reference", "issueDate", "dueDate", "amountMad"];

// Mots-clés utilisés pour deviner automatiquement le mapping des colonnes.
const AUTO_MATCH: { field: TargetField; keywords: string[] }[] = [
  { field: "clientName", keywords: ["client", "nom client", "customer", "raison sociale", "société", "entreprise"] },
  { field: "reference", keywords: ["facture", "invoice", "n° facture", "numero facture", "reference", "référence"] },
  { field: "issueDate", keywords: ["date emission", "date d'émission", "date facture", "issue date", "invoice date"] },
  { field: "dueDate", keywords: ["echeance", "échéance", "due date", "date echeance"] },
  { field: "amountMad", keywords: ["montant", "amount", "ttc", "total", "solde"] },
  { field: "contactEmail", keywords: ["email", "e-mail", "mail"] },
  { field: "contactPhone", keywords: ["telephone", "téléphone", "tel", "phone", "gsm"] },
  { field: "sector", keywords: ["secteur", "sector", "activite", "activité"] },
];

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // enlève les accents
    .trim();
}

export function guessMapping(headers: string[]): Record<string, TargetField> {
  const mapping: Record<string, TargetField> = {};
  const used = new Set<TargetField>();
  for (const header of headers) {
    const normalized = normalizeHeader(header);
    const match = AUTO_MATCH.find(
      (m) => !used.has(m.field) && m.keywords.some((kw) => normalized.includes(normalizeHeader(kw)))
    );
    if (match) {
      mapping[header] = match.field;
      used.add(match.field);
    } else {
      mapping[header] = "ignore";
    }
  }
  return mapping;
}

export type ParsedSheet = {
  headers: string[];
  rows: Record<string, unknown>[];
};

export async function parseSpreadsheetFile(file: File): Promise<ParsedSheet> {
  // Pour un CSV, on parse le texte nous-mêmes plutôt que de passer par xlsx : son
  // détecteur de type de cellule interprète les dates ambiguës en anglais (mm/jj/aaaa)
  // et inverse jour/mois sur des dates françaises/marocaines ("01/06/2026" devient le
  // 6 janvier au lieu du 1er juin), même sans l'option cellDates. Pour un vrai .xlsx/.xls,
  // les cellules de type date sont des numéros de série Excel non ambigus — xlsx reste fiable.
  if (file.name.toLowerCase().endsWith(".csv")) {
    const text = await file.text();
    return parseCsvText(text);
  }
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

function detectDelimiter(headerLine: string): string {
  const commaCount = (headerLine.match(/,/g) ?? []).length;
  const semicolonCount = (headerLine.match(/;/g) ?? []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseCsvText(text: string): ParsedSheet {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return { headers: [], rows: [] };
  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter);
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line, delimiter);
    const row: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });
  return { headers, rows };
}

export function parseFlexibleDate(value: unknown): Date | null {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    // Numéro de série Excel (jours depuis 1899-12-30)
    const epoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(epoch.getTime() + value * 86_400_000);
  }
  if (typeof value === "string" && value.trim()) {
    const s = value.trim();
    // dd/mm/yyyy ou dd-mm-yyyy
    const eu = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (eu) return new Date(Number(eu[3]), Number(eu[2]) - 1, Number(eu[1]));
    // yyyy-mm-dd
    const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

export function parseFlexibleAmount(value: unknown): number | null {
  if (typeof value === "number" && !isNaN(value)) return Math.round(value);
  if (typeof value === "string") {
    const cleaned = value
      .replace(/[^\d,.\-]/g, "") // enlève devise, espaces, lettres
      .replace(/\s/g, "");
    if (!cleaned) return null;
    // Si virgule ET point présents, la virgule est un séparateur de milliers (format US) sinon décimal (format FR)
    let normalized = cleaned;
    if (cleaned.includes(",") && cleaned.includes(".")) {
      normalized = cleaned.replace(/,/g, "");
    } else if (cleaned.includes(",")) {
      normalized = cleaned.replace(",", ".");
    }
    const n = parseFloat(normalized);
    return isNaN(n) ? null : Math.round(n);
  }
  return null;
}

export type NormalizedInvoiceRow = {
  clientName: string;
  reference: string;
  issueDate: string; // ISO
  dueDate: string; // ISO
  amountMad: number;
  contactEmail: string;
  contactPhone: string;
  sector: string;
  rowIndex: number;
  errors: string[];
};

export function normalizeRows(
  parsed: ParsedSheet,
  mapping: Record<string, TargetField>
): NormalizedInvoiceRow[] {
  const fieldToHeader = new Map<TargetField, string>();
  for (const [header, field] of Object.entries(mapping)) {
    if (field !== "ignore") fieldToHeader.set(field, header);
  }

  return parsed.rows.map((row, i) => {
    const errors: string[] = [];
    const clientName = String(fieldToHeader.has("clientName") ? row[fieldToHeader.get("clientName")!] : "").trim();
    const reference = String(fieldToHeader.has("reference") ? row[fieldToHeader.get("reference")!] : "").trim();
    const issueDate = fieldToHeader.has("issueDate") ? parseFlexibleDate(row[fieldToHeader.get("issueDate")!]) : null;
    const dueDate = fieldToHeader.has("dueDate") ? parseFlexibleDate(row[fieldToHeader.get("dueDate")!]) : null;
    const amountMad = fieldToHeader.has("amountMad") ? parseFlexibleAmount(row[fieldToHeader.get("amountMad")!]) : null;

    if (!clientName) errors.push("Nom du client manquant");
    if (!reference) errors.push("N° de facture manquant");
    if (!issueDate) errors.push("Date d'émission illisible");
    if (!dueDate) errors.push("Date d'échéance illisible");
    if (amountMad === null || amountMad <= 0) errors.push("Montant illisible ou nul");

    return {
      clientName,
      reference,
      issueDate: issueDate ? issueDate.toISOString() : "",
      dueDate: dueDate ? dueDate.toISOString() : "",
      amountMad: amountMad ?? 0,
      contactEmail: fieldToHeader.has("contactEmail") ? String(row[fieldToHeader.get("contactEmail")!] ?? "").trim() : "",
      contactPhone: fieldToHeader.has("contactPhone") ? String(row[fieldToHeader.get("contactPhone")!] ?? "").trim() : "",
      sector: fieldToHeader.has("sector") ? String(row[fieldToHeader.get("sector")!] ?? "").trim() : "",
      rowIndex: i,
      errors,
    };
  });
}

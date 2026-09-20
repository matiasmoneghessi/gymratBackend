import * as XLSX from 'xlsx';

const XLSX_EXTENSIONS = ['.xlsx', '.xls', '.xlsm'];
const XLSX_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.ms-excel.sheet.macroEnabled.12',
]);

export function isExcelFile(fileName: string, mimeType?: string): boolean {
  const lower = fileName.toLowerCase();
  if (XLSX_EXTENSIONS.some((ext) => lower.endsWith(ext))) return true;
  return mimeType ? XLSX_MIME_TYPES.has(mimeType) : false;
}

export function excelBase64ToText(base64: string): string {
  const buffer = Buffer.from(base64, 'base64');
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  return workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    return `=== Hoja: ${sheetName} ===\n${csv}`;
  }).join('\n\n');
}

export function normalizeFileContent(
  contenido: string,
  fileName: string,
  encoding: 'text' | 'base64' = 'text',
  mimeType?: string,
): string {
  if (encoding === 'base64' || isExcelFile(fileName, mimeType)) {
    return excelBase64ToText(contenido);
  }
  return contenido;
}

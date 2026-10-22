// Excel (.xlsx) exports for the whole website, with one consistent PCM look:
// a title block (college, report name, details, when and by whom it was generated), a frozen colored header row with
// filters, sized columns, real numbers / pesos / dates that Excel can sort and add up, light row banding and an
// optional totals row. exceljs is loaded only when an export is made, so it adds nothing to page loads.

export type ColumnType = 'text' | 'number' | 'integer' | 'currency' | 'date' | 'datetime' | 'percent';

export interface ExcelColumn {
  header: string;
  key: string;
  type?: ColumnType;
  /** Width in characters; worked out from the content when left out. */
  width?: number;
}

export interface ExcelSheet {
  /** Tab name (Excel allows 31 characters). */
  name: string;
  /** Report title, e.g. "Admissions — Application List". */
  title: string;
  /** Extra lines under the title, e.g. "Filter: Pending Payment · 12 applications". */
  details?: string[];
  columns: ExcelColumn[];
  rows: Record<string, unknown>[];
  /** Totals row: column key → value, or 'sum' to add the column up. */
  totals?: Record<string, unknown | 'sum'>;
  /** Text under the table, e.g. a legend. */
  notes?: string[];
}

const GREEN = 'FF18392B';
const SAGE = 'FF588B76';
const PALE = 'FFF1F6F3';
const GOLD = 'FFE8C77A';
const COLLEGE = 'PHILIPPINE COLLEGE OF MINISTRY';

const NUM_FORMATS: Record<ColumnType, string | undefined> = {
  text: '@',
  number: '#,##0.00',
  integer: '#,##0',
  currency: '"₱"#,##0.00',
  date: 'mmm d, yyyy',
  datetime: 'mmm d, yyyy h:mm AM/PM',
  percent: '0.0%',
};

/** A date string or Date as an Excel date (local time); other values are left alone. */
function asDate(v: unknown): Date | unknown {
  if (v instanceof Date) return v;
  if (typeof v !== 'string' || !v.trim()) return v;
  const s = v.trim();
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00`) : new Date(s);
  return Number.isNaN(d.getTime()) ? v : d;
}

function cellValue(v: unknown, type: ColumnType = 'text'): unknown {
  if (v === undefined || v === null || v === '') return null;
  if (type === 'date' || type === 'datetime') return asDate(v);
  if (type === 'number' || type === 'integer' || type === 'currency' || type === 'percent') {
    const n = typeof v === 'number' ? v : Number(String(v).replace(/[₱,\s]/g, ''));
    return Number.isFinite(n) ? n : String(v);
  }
  return typeof v === 'string' ? v : String(v);
}

const displayLength = (v: unknown, type: ColumnType = 'text') => {
  if (v === null || v === undefined) return 0;
  if (v instanceof Date) return type === 'datetime' ? 20 : 13;
  if (typeof v === 'number') return type === 'currency' ? v.toFixed(2).length + 5 : String(v).length + 2;
  return Math.max(...String(v).split('\n').map((l) => l.length));
};

export function excelFileName(base: string): string {
  // Plain characters only (no commas or long dashes), so the name works on every computer and email.
  const clean = base.replace(/[–—]/g, '-').replace(/[\\/:*?"<>|,;]+/g, '').replace(/\s+/g, '_').replace(/_+/g, '_');
  return `${clean}_${new Date().toISOString().slice(0, 10)}.xlsx`;
}

/** Builds the workbook and starts the download. */
export async function downloadExcel(fileName: string, sheets: ExcelSheet[], meta: { generatedBy?: string } = {}): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = meta.generatedBy || COLLEGE;
  wb.company = COLLEGE;
  wb.created = new Date();
  // Totals are formulas: Excel works them out when the file is opened.
  wb.calcProperties.fullCalcOnLoad = true;
  const generated = `Generated ${new Date().toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' })}${meta.generatedBy ? ` by ${meta.generatedBy}` : ''}`;

  for (const spec of sheets) {
    const n = Math.max(1, spec.columns.length);
    const ws = wb.addWorksheet(spec.name.replace(/[\\/*?:[\]]/g, '-').slice(0, 31) || 'Sheet', {
      pageSetup: { orientation: n > 6 ? 'landscape' : 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
      views: [],
    });

    // Title block.
    const addMergedLine = (text: string, style: { size: number; bold?: boolean; color: string; fill?: string; height: number }) => {
      const row = ws.addRow([text]);
      ws.mergeCells(row.number, 1, row.number, n);
      row.height = style.height;
      const c = row.getCell(1);
      c.font = { name: 'Calibri', size: style.size, bold: !!style.bold, color: { argb: style.color } };
      c.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      if (style.fill) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.fill } };
      return row;
    };
    addMergedLine(COLLEGE, { size: 11, bold: true, color: GOLD, fill: GREEN, height: 20 });
    addMergedLine(spec.title, { size: 15, bold: true, color: 'FFFFFFFF', fill: GREEN, height: 26 });
    for (const d of spec.details || []) addMergedLine(d, { size: 10, color: 'FF334155', fill: PALE, height: 18 });
    addMergedLine(generated, { size: 9, color: 'FF64748B', fill: PALE, height: 16 });
    ws.addRow([]);

    // Header.
    const header = ws.addRow(spec.columns.map((c) => c.header));
    header.height = 22;
    header.eachCell((c) => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SAGE } };
      c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      c.border = { bottom: { style: 'thin', color: { argb: GREEN } } };
    });
    const headerRow = header.number;

    // Data.
    const widths = spec.columns.map((c) => c.header.length + 2);
    spec.rows.forEach((r, i) => {
      const row = ws.addRow(spec.columns.map((c) => cellValue(r[c.key], c.type)));
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        const column = spec.columns[col - 1];
        if (!column) return;
        const fmt = NUM_FORMATS[column.type || 'text'];
        if (fmt && cell.value !== null && !(column.type === 'text')) cell.numFmt = fmt;
        cell.alignment = { vertical: 'top', wrapText: (column.type || 'text') === 'text', horizontal: ['number', 'integer', 'currency', 'percent'].includes(column.type || '') ? 'right' : 'left' };
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFD7E2DC' } } };
        if (i % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALE } };
        widths[col - 1] = Math.max(widths[col - 1], displayLength(cell.value, column.type));
      });
    });
    if (spec.rows.length === 0) {
      const empty = ws.addRow(['No records.']);
      ws.mergeCells(empty.number, 1, empty.number, n);
      empty.getCell(1).font = { italic: true, color: { argb: 'FF64748B' } };
    }

    // Totals.
    if (spec.totals && spec.rows.length) {
      const first = headerRow + 1;
      const last = headerRow + spec.rows.length;
      const row = ws.addRow(
        spec.columns.map((c, idx) => {
          const v = spec.totals![c.key];
          if (v === 'sum') {
            const letter = ws.getColumn(idx + 1).letter;
            const total = spec.rows.reduce((t, r) => t + (Number(cellValue(r[c.key], c.type)) || 0), 0);
            return { formula: `SUM(${letter}${first}:${letter}${last})`, result: total };
          }
          return v ?? null;
        })
      );
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        const column = spec.columns[col - 1];
        cell.font = { bold: true, color: { argb: GREEN } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3EEE8' } };
        cell.border = { top: { style: 'thin', color: { argb: GREEN } }, bottom: { style: 'double', color: { argb: GREEN } } };
        const fmt = column && NUM_FORMATS[column.type || 'text'];
        if (fmt && column.type !== 'text') cell.numFmt = fmt;
        if (column && ['number', 'integer', 'currency', 'percent'].includes(column.type || '')) cell.alignment = { horizontal: 'right' };
      });
    }

    for (const note of spec.notes || []) {
      const row = ws.addRow([note]);
      ws.mergeCells(row.number, 1, row.number, n);
      row.getCell(1).font = { size: 9, italic: true, color: { argb: 'FF64748B' } };
      row.getCell(1).alignment = { wrapText: true };
    }

    spec.columns.forEach((c, i) => {
      ws.getColumn(i + 1).width = c.width || Math.min(60, Math.max(10, widths[i] + 2));
    });
    ws.views = [{ state: 'frozen', ySplit: headerRow, xSplit: 0, topLeftCell: `A${headerRow + 1}`, activeCell: `A${headerRow + 1}` }];
    if (spec.rows.length) ws.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow + spec.rows.length, column: n } };
    ws.pageSetup.printTitlesRow = `${headerRow}:${headerRow}`;
    ws.headerFooter.oddFooter = `&L${COLLEGE}&C${spec.title.replace(/&/g, '&&')}&RPage &P of &N`;
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

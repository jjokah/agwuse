import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { CHURCH_INFO } from "@/lib/constants";
import type { ChurchInfo } from "@/lib/settings";
import { formatDate } from "@/lib/utils";

function addChurchHeader(doc: jsPDF, churchInfo?: Partial<ChurchInfo>) {
  const info = { ...CHURCH_INFO, ...churchInfo };
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(info.shortName, 105, 15, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(info.name, 105, 21, { align: "center" });
  doc.text(info.address, 105, 26, { align: "center" });
  doc.text(`Tel: ${info.phones[0]}`, 105, 31, { align: "center" });
  doc.setDrawColor(180, 134, 11); // brand gold
  doc.setLineWidth(0.5);
  doc.line(15, 34, 195, 34);
}

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export type ReceiptData = {
  receiptNumber: string;
  date: string;
  memberName: string;
  type: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
};

export function buildReceiptPDFDoc(
  receipt: ReceiptData,
  churchInfo?: Partial<ChurchInfo>
): jsPDF {
  const info = { ...CHURCH_INFO, ...churchInfo };
  const doc = new jsPDF();
  addChurchHeader(doc, info);

  // Receipt title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("OFFICIAL RECEIPT", 105, 44, { align: "center" });

  // Receipt number
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Receipt No: ${receipt.receiptNumber}`, 195, 44, { align: "right" });

  // Receipt details
  const startY = 55;
  const labelX = 20;
  const valueX = 70;
  const lineHeight = 8;

  const fields = [
    ["Date:", receipt.date],
    ["Received From:", receipt.memberName],
    ["Transaction Type:", receipt.type],
    ["Amount:", formatNaira(receipt.amount)],
    ["Payment Method:", receipt.paymentMethod],
  ];

  if (receipt.notes) {
    fields.push(["Notes:", receipt.notes]);
  }

  fields.forEach(([label, value], i) => {
    const y = startY + i * lineHeight;
    doc.setFont("helvetica", "bold");
    doc.text(label, labelX, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, valueX, y);
  });

  // Amount in words area
  const boxY = startY + fields.length * lineHeight + 5;
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(labelX, boxY, 170, 15, 2, 2);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(formatNaira(receipt.amount), 105, boxY + 10, { align: "center" });

  // Footer
  const footerY = boxY + 30;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("This is a computer-generated receipt.", 105, footerY, {
    align: "center",
  });
  doc.text(
    `${info.name} | ${info.address}`,
    105,
    footerY + 5,
    { align: "center" }
  );

  return doc;
}

export function buildReceiptPDFBuffer(
  receipt: ReceiptData,
  churchInfo?: Partial<ChurchInfo>
): ArrayBuffer {
  const doc = buildReceiptPDFDoc(receipt, churchInfo);
  return doc.output("arraybuffer");
}

/** Display-ready report summary: breakdown keys are human-readable labels. */
export type ReportSummary = {
  period: string;
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  incomeByType: Record<string, number>;
  expenseByCategory: Record<string, number>;
  transactionCount: number;
  /** Optional footnote, e.g. when the transaction list is truncated. */
  note?: string;
};

export function buildReportPDFDoc(
  summary: ReportSummary,
  transactions: Record<string, string>[],
  churchInfo?: Partial<ChurchInfo>
): jsPDF {
  const doc = new jsPDF();
  addChurchHeader(doc, churchInfo);

  // Report title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("FINANCIAL REPORT", 105, 44, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Period: ${summary.period}`, 105, 51, { align: "center" });

  // Summary section
  let y = 60;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 15, y);
  y += 8;

  const summaryRows = [
    ["Total Income", formatNaira(summary.totalIncome)],
    ["Total Expenses", formatNaira(summary.totalExpense)],
    ["Net Income", formatNaira(summary.netIncome)],
    ["Total Transactions", String(summary.transactionCount)],
  ];

  autoTable(doc, {
    startY: y,
    head: [["Item", "Amount"]],
    body: summaryRows,
    theme: "grid",
    headStyles: { fillColor: [180, 134, 11] },
    margin: { left: 15, right: 15 },
    styles: { fontSize: 9 },
  });

  // Income breakdown
  y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  y += 10;

  if (Object.keys(summary.incomeByType).length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Income by Type", 15, y);
    y += 6;

    const incomeRows = Object.entries(summary.incomeByType).map(
      ([type, amount]) => [type, formatNaira(amount)]
    );

    autoTable(doc, {
      startY: y,
      head: [["Category", "Amount"]],
      body: incomeRows,
      theme: "grid",
      headStyles: { fillColor: [40, 167, 69] },
      margin: { left: 15, right: 15 },
      styles: { fontSize: 8 },
    });

    y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
    y += 10;
  }

  // Expense breakdown
  if (Object.keys(summary.expenseByCategory).length > 0) {
    // Check if we need a page break
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Expenses by Category", 15, y);
    y += 6;

    const expenseRows = Object.entries(summary.expenseByCategory).map(
      ([cat, amount]) => [cat, formatNaira(amount)]
    );

    autoTable(doc, {
      startY: y,
      head: [["Category", "Amount"]],
      body: expenseRows,
      theme: "grid",
      headStyles: { fillColor: [220, 53, 69] },
      margin: { left: 15, right: 15 },
      styles: { fontSize: 8 },
    });

    y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
    y += 10;
  }

  // Transactions table
  if (transactions.length > 0) {
    if (y > 200) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Transactions", 15, y);
    y += 6;

    const headers = Object.keys(transactions[0]);
    const rows = transactions.map((t) => headers.map((h) => t[h] ?? ""));

    autoTable(doc, {
      startY: y,
      head: [headers],
      body: rows,
      theme: "striped",
      headStyles: { fillColor: [26, 26, 46] },
      margin: { left: 15, right: 15 },
      styles: { fontSize: 7 },
    });
  }

  if (summary.note) {
    y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 6;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(summary.note, 15, y, { maxWidth: 180 });
  }

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated on ${formatDate(new Date())} | Page ${i} of ${pageCount}`,
      105,
      290,
      { align: "center" }
    );
  }

  return doc;
}

export function buildReportPDFBuffer(
  summary: ReportSummary,
  transactions: Record<string, string>[],
  churchInfo?: Partial<ChurchInfo>
): ArrayBuffer {
  const doc = buildReportPDFDoc(summary, transactions, churchInfo);
  return doc.output("arraybuffer");
}


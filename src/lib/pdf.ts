import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { CHURCH_INFO } from "@/lib/constants";

function addChurchHeader(doc: jsPDF) {
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(CHURCH_INFO.shortName, 105, 15, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(CHURCH_INFO.name, 105, 21, { align: "center" });
  doc.text(CHURCH_INFO.address, 105, 26, { align: "center" });
  doc.text(`Tel: ${CHURCH_INFO.phones[0]}`, 105, 31, { align: "center" });
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

export function generateReceiptPDF(receipt: {
  receiptNumber: string;
  date: string;
  memberName: string;
  type: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
}) {
  const doc = new jsPDF();
  addChurchHeader(doc);

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
    ["Transaction Type:", receipt.type.replace("_", " ")],
    ["Amount:", formatNaira(receipt.amount)],
    ["Payment Method:", receipt.paymentMethod.replace("_", " ")],
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
    `${CHURCH_INFO.name} | ${CHURCH_INFO.address}`,
    105,
    footerY + 5,
    { align: "center" }
  );

  doc.save(`receipt-${receipt.receiptNumber}.pdf`);
}

export function generateReportPDF(
  summary: {
    period: string;
    totalIncome: number;
    totalExpense: number;
    netIncome: number;
    incomeByType: Record<string, number>;
    expenseByCategory: Record<string, number>;
    transactionCount: number;
  },
  transactions: Record<string, string>[]
) {
  const doc = new jsPDF();
  addChurchHeader(doc);

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
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  if (Object.keys(summary.incomeByType).length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Income Breakdown", 15, y);
    y += 5;

    const incomeRows = Object.entries(summary.incomeByType)
      .sort(([, a], [, b]) => b - a)
      .map(([type, amount]) => [type.replace("_", " "), formatNaira(amount)]);

    autoTable(doc, {
      startY: y,
      head: [["Type", "Amount"]],
      body: incomeRows,
      theme: "grid",
      headStyles: { fillColor: [180, 134, 11] },
      margin: { left: 15, right: 15 },
      styles: { fontSize: 9 },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Expense breakdown
  if (Object.keys(summary.expenseByCategory).length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Expense Breakdown", 15, y);
    y += 5;

    const expenseRows = Object.entries(summary.expenseByCategory)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amount]) => [cat.replace("_", " "), formatNaira(amount)]);

    autoTable(doc, {
      startY: y,
      head: [["Category", "Amount"]],
      body: expenseRows,
      theme: "grid",
      headStyles: { fillColor: [180, 134, 11] },
      margin: { left: 15, right: 15 },
      styles: { fontSize: 9 },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Transaction detail table (new page if needed)
  if (transactions.length > 0) {
    if (y > 220) {
      doc.addPage();
      y = 15;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Transaction Details", 15, y);
    y += 5;

    const headers = ["Date", "Receipt #", "Type", "Member", "Method", "Amount"];
    const rows = transactions.map((tx) => [
      tx["Date"],
      tx["Receipt #"],
      tx["Type"],
      tx["Member"],
      tx["Method"],
      tx["Amount"],
    ]);

    autoTable(doc, {
      startY: y,
      head: [headers],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [180, 134, 11] },
      margin: { left: 15, right: 15 },
      styles: { fontSize: 7 },
      columnStyles: {
        5: { halign: "right" },
      },
    });
  }

  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
      105,
      290,
      { align: "center" }
    );
  }

  doc.save(`agwuse-report-${Date.now()}.pdf`);
}

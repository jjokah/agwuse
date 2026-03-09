"use client";

import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { exportToCSV } from "@/lib/csv";
import { generateReportPDF } from "@/lib/pdf";

interface ExportButtonsProps {
  data: Record<string, string>[];
  summary: {
    period: string;
    totalIncome: number;
    totalExpense: number;
    netIncome: number;
    incomeByType: Record<string, number>;
    expenseByCategory: Record<string, number>;
    transactionCount: number;
  };
}

export function ExportButtons({ data, summary }: ExportButtonsProps) {
  function handleCSVExport() {
    exportToCSV(data, `agwuse-report-${Date.now()}`);
  }

  function handlePDFExport() {
    generateReportPDF(summary, data);
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleCSVExport}>
        <FileSpreadsheet className="mr-1 size-4" />
        Export CSV
      </Button>
      <Button variant="outline" size="sm" onClick={handlePDFExport}>
        <Download className="mr-1 size-4" />
        Export PDF
      </Button>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Download } from "lucide-react";

export interface ExportButtonsProps {
  from: string;
  to: string;
  className?: string;
}

export function ExportButtons({ from, to, className }: ExportButtonsProps) {
  const csvUrl = `/api/finance/reports/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&format=csv`;
  const pdfUrl = `/api/finance/reports/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&format=pdf`;

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={
          <a
            href={csvUrl}
            download={`agwuse-report-${from}-to-${to}.csv`}
            className="inline-flex items-center"
          >
            <FileSpreadsheet className="mr-1.5 size-4" />
            Export CSV
          </a>
        }
      />
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={
          <a
            href={pdfUrl}
            download={`agwuse-report-${from}-to-${to}.pdf`}
            className="inline-flex items-center"
          >
            <Download className="mr-1.5 size-4" />
            Export PDF
          </a>
        }
      />
    </div>
  );
}

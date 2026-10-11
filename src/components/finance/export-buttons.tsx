import { DownloadButton } from "@/components/shared/download-button";
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
      <DownloadButton href={csvUrl}>
            <FileSpreadsheet className="mr-1.5 size-4" />
            Export CSV
      </DownloadButton>
      <DownloadButton href={pdfUrl}>
            <Download className="mr-1.5 size-4" />
            Export PDF
      </DownloadButton>
    </div>
  );
}

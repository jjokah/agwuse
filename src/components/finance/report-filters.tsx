import { Input } from "@/components/ui/input";
import { FilterSelect, FilterSubmit } from "@/components/shared/filter-select";

export interface ReportFiltersProps {
  from: string;
  to: string;
  reportType: string;
}

const REPORT_TYPE_OPTIONS = [
  { value: "summary", label: "Income & Expense Summary" },
  { value: "income", label: "Income Breakdown" },
  { value: "expense", label: "Expense Breakdown" },
];

export function ReportFilters({ from, to, reportType }: ReportFiltersProps) {
  return (
    <form className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="report-from" className="mb-1 block text-xs font-medium text-muted-foreground">
          From
        </label>
        <Input
          id="report-from"
          name="from"
          type="date"
          defaultValue={from}
          className="w-44"
        />
      </div>
      <div>
        <label htmlFor="report-to" className="mb-1 block text-xs font-medium text-muted-foreground">
          To
        </label>
        <Input
          id="report-to"
          name="to"
          type="date"
          defaultValue={to}
          className="w-44"
        />
      </div>
      <div>
        <FilterSelect
          id="report-type"
          name="report"
          label="Report Type"
          hideLabel={false}
          defaultValue={reportType}
          options={REPORT_TYPE_OPTIONS}
        />
      </div>
      <FilterSubmit text="Update" />
    </form>
  );
}

export type PaginationParams = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ApiResponse<T = unknown> =
  | { success: true; data: T; meta?: Record<string, unknown> }
  | { success: false; error: { message: string; code: string } };

export type NavItem = {
  label: string;
  href: string;
  icon?: string;
};

export type NavGroup = {
  label: string;
  children: NavItem[];
};

export type DateRange = {
  from: Date;
  to: Date;
};

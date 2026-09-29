import * as React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  type PageMeta,
  type SearchParamsLike,
  pageWindow,
  hrefWithParams,
} from "@/lib/pagination";
import { cn } from "@/lib/utils";

export interface PaginationBarProps {
  meta: PageMeta;
  basePath: string;
  searchParams?: SearchParamsLike;
  className?: string;
  showItemCount?: boolean;
}

export function PaginationBar({
  meta,
  basePath,
  searchParams,
  className,
  showItemCount = true,
}: PaginationBarProps) {
  if (meta.totalPages <= 1 && meta.totalItems <= meta.pageSize) {
    return null;
  }

  const windowItems = pageWindow(meta.currentPage, meta.totalPages);

  const prevHref = meta.hasPrevPage
    ? hrefWithParams(basePath, searchParams, { page: meta.currentPage - 1 })
    : undefined;

  const nextHref = meta.hasNextPage
    ? hrefWithParams(basePath, searchParams, { page: meta.currentPage + 1 })
    : undefined;

  const startItem = meta.totalItems === 0 ? 0 : (meta.currentPage - 1) * meta.pageSize + 1;
  const endItem = Math.min(meta.currentPage * meta.pageSize, meta.totalItems);

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2",
        className,
      )}
    >
      {showItemCount && (
        <div className="text-sm text-muted-foreground order-2 sm:order-1">
          Showing <span className="font-medium text-foreground">{startItem}</span> to{" "}
          <span className="font-medium text-foreground">{endItem}</span> of{" "}
          <span className="font-medium text-foreground">{meta.totalItems}</span> results
        </div>
      )}

      <Pagination className="order-1 sm:order-2 sm:justify-end mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            {prevHref ? (
              <PaginationPrevious href={prevHref} />
            ) : (
              <PaginationPrevious
                aria-disabled="true"
                tabIndex={-1}
                className="pointer-events-none opacity-50"
              />
            )}
          </PaginationItem>

          {windowItems.map((item, idx) => {
            if (item === "ellipsis") {
              return (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }

            const isCurrent = item === meta.currentPage;
            const pageHref = hrefWithParams(basePath, searchParams, { page: item });

            return (
              <PaginationItem key={item}>
                <PaginationLink
                  href={pageHref}
                  isActive={isCurrent}
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          <PaginationItem>
            {nextHref ? (
              <PaginationNext href={nextHref} />
            ) : (
              <PaginationNext
                aria-disabled="true"
                tabIndex={-1}
                className="pointer-events-none opacity-50"
              />
            )}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

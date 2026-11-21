"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Disable the buttons while a page is loading */
  disabled?: boolean;
};

// 1 … 4 5 6 … 20
function pageWindow(current: number, total: number): (number | "gap")[] {
  const pages = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result: (number | "gap")[] = [];
  pages.forEach((p, index) => {
    if (index > 0 && p - pages[index - 1] > 1) result.push("gap");
    result.push(p);
  });
  return result;
}

const buttonClass =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50";

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {from}–{to}
        </span>{" "}
        of <span className="font-medium text-foreground">{total}</span>
      </p>

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <button
            type="button"
            className={buttonClass}
            onClick={() => onPageChange(page - 1)}
            disabled={disabled || page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pageWindow(page, totalPages).map((item, index) =>
            item === "gap" ? (
              <span key={`gap-${index}`} className="px-1 text-muted-foreground">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={`${buttonClass} ${
                  item === page
                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary"
                    : ""
                }`}
                onClick={() => onPageChange(item)}
                disabled={disabled}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            className={buttonClass}
            onClick={() => onPageChange(page + 1)}
            disabled={disabled || page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}

import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (page: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
      <span>
        第 {page} / {totalPages} 页，共 {total} 条
      </span>
      <div className="flex gap-2">
        <button className="ghost-button" type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> 上一页
        </button>
        <button className="ghost-button" type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          下一页 <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

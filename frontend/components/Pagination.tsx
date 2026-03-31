import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-row items-center justify-center gap-2 mt-8">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
          currentPage === 1
            ? "bg-white/5 border border-white/10 text-gray-500 opacity-50 cursor-not-allowed"
            : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
        }`}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {getPageNumbers().map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
            currentPage === page
              ? "bg-[#00F5D4] text-gray-900 font-bold border-none shadow-[0_0_15px_rgba(0,245,212,0.4)]"
              : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
          currentPage === totalPages
            ? "bg-white/5 border border-white/10 text-gray-500 opacity-50 cursor-not-allowed"
            : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
        }`}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

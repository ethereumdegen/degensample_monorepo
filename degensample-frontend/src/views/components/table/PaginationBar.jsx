// PaginationBar.js
import React from 'react';

/**
 * Enhanced pagination component with page size control and jump to page functionality
 * 
 * @param {Object} props Component props
 * @param {number} props.currentPage Current page number (1-indexed)
 * @param {number} props.totalPages Total number of pages
 * @param {number} props.totalCount Total number of items across all pages
 * @param {number} props.pageSize Current page size
 * @param {Array<number>} props.pageSizeOptions Available page size options
 * @param {function} props.onPageChange Callback when page changes (page) => void
 * @param {function} props.onPageSizeChange Callback when page size changes (pageSize) => void
 */
const PaginationBar = ({ 
  currentPage, 
  totalPages, 
  totalCount = 0,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
}) => {
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };
  
  // Calculate start and end item numbers for display
  const startItem = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(startItem + pageSize - 1, totalCount);
  
  return (
    <div className="flex flex-col md:flex-row items-center justify-between my-4 gap-3">
      <div className="text-sm text-gray-600">
        {totalCount > 0 ? (
          <>Showing {startItem}-{endItem} of {totalCount} items</>
        ) : (
          <>No items</>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => handlePageChange(1)}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm"
          disabled={currentPage === 1}
          aria-label="First page"
        >
          &laquo;
        </button>
        
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm"
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          &lsaquo;
        </button>

        <div className="flex items-center space-x-1">
          {/* Page numbers - show 5 pages with current in middle when possible */}
          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            // Calculate which page numbers to show
            let pageNum;
            if (totalPages <= 5) {
              // If 5 or fewer pages, show all
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              // Near the start
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              // Near the end
              pageNum = totalPages - 4 + i;
            } else {
              // In the middle
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={i}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-1 rounded-md text-sm ${
                  currentPage === pageNum
                    ? 'bg-primary text-white font-medium'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm"
          disabled={currentPage === totalPages || totalPages === 0}
          aria-label="Next page"
        >
          &rsaquo;
        </button>
        
        <button
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm"
          disabled={currentPage === totalPages || totalPages === 0}
          aria-label="Last page"
        >
          &raquo;
        </button>
      </div>

      {/* Page size selector */}
      {onPageSizeChange && (
        <div className="flex items-center text-sm text-gray-600">
          <span className="mr-2">Items per page:</span>
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded border border-gray-300 pl-2 pr-8 py-1 appearance-none"
              style={{ minWidth: "70px" }}
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginationBar;
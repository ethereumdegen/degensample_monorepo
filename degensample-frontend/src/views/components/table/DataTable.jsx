import React, { useState, useEffect, useCallback } from 'react';
import PaginationBar from './PaginationBar';
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react';

/**
 * Reusable DataTable component with sorting, pagination and filtering
 * Designed to work with backend pagination APIs
 */
const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  // Pagination props
  pagination = null, // { page, pageSize, totalCount, totalPages }
  onPageChange = null,
  onPageSizeChange = null,
  // Sorting props
  sortable = false,
  defaultSortField = '',
  defaultSortDirection = 'desc',
  onSortChange = null,
  // Other props
  className = '',
  emptyMessage = 'No data available',
  loadingMessage = 'Loading data...',
  // Custom renderers
  rowRenderer = null, // Custom row renderer function (row, index) => JSX
  cellRenderer = null, // Custom cell renderer function (column, value, row) => JSX
}) => {
  // Local sort state if no external handler provided
  const [sortField, setSortField] = useState(defaultSortField);
  const [sortDirection, setSortDirection] = useState(defaultSortDirection);

  // Handle sort header click
  const handleSort = useCallback((field) => {
    if (!sortable) return;
    
    let direction = sortDirection;
    
    // If clicking the same field, toggle direction
    if (field === sortField) {
      direction = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New field, use default direction
      direction = defaultSortDirection;
    }
    
    setSortField(field);
    setSortDirection(direction);
    
    // Call external handler if provided
    if (onSortChange) {
      onSortChange(field, direction);
    }
  }, [sortField, sortDirection, sortable, defaultSortDirection, onSortChange]);

  // Sort icon component
  const SortIcon = ({ field }) => {
    if (!sortable) return null;
    
    if (field !== sortField) {
      return (
        <span className="text-gray-300 inline-block ml-1">
          <ChevronUpIcon size={14} className="inline-block -mb-1" />
        </span>
      );
    }
    
    return sortDirection === 'asc' ? (
      <span className="text-primary inline-block ml-1">
        <ChevronUpIcon size={14} className="inline-block -mb-1" />
      </span>
    ) : (
      <span className="text-primary inline-block ml-1">
        <ChevronDownIcon size={14} className="inline-block -mb-1" />
      </span>
    );
  };

  // Helper function to get responsive class name based on column's responsive property
  const getResponsiveClassName = (column) => {
    if (!column.responsive) return '';
    
    // Responsive can be an object with breakpoints as keys
    // Example: { sm: false, md: true, lg: true } means hidden on sm, visible on md and lg
    if (typeof column.responsive === 'object') {
      const classes = [];
      if (column.responsive.sm === false) classes.push('hidden sm:table-cell');
      if (column.responsive.md === false) classes.push('hidden md:table-cell');
      if (column.responsive.lg === false) classes.push('hidden lg:table-cell');
      if (column.responsive.xl === false) classes.push('hidden xl:table-cell');
      return classes.join(' ');
    }
    
    // If responsive is a string, it's a breakpoint at which the column becomes visible
    // Example: 'md' means hidden below md breakpoint, visible at md and above
    if (typeof column.responsive === 'string') {
      const breakpoint = column.responsive;
      return `hidden ${breakpoint}:table-cell`;
    }
    
    return '';
  };

  // Default cell renderer
  const defaultCellRenderer = (column, value, row) => {
    if (column.format) {
      return column.format(value, row);
    }
    
    if (value === null || value === undefined) {
      return <span className="text-gray-400">–</span>;
    }
    
    return value;
  };

  // Get essential columns for card view
  const getEssentialColumns = () => {
    // Prioritize columns marked as essential
    const essentialColumns = columns.filter(col => col.essential === true);
    if (essentialColumns.length > 0) return essentialColumns;
    
    // If no columns are marked essential, use first column and any non-responsive ones
    const firstColumn = columns[0];
    const nonResponsiveColumns = columns.filter(col => !col.responsive);
    
    if (nonResponsiveColumns.length > 0) {
      return [firstColumn, ...nonResponsiveColumns.filter(col => col !== firstColumn)];
    }
    
    // Fallback to just the first 2-3 columns
    return columns.slice(0, Math.min(3, columns.length));
  };
  
  // Standard row renderer (works for all screen sizes)
  const defaultRowRenderer = (row, rowIndex) => (
    <tr key={rowIndex} className="border-b border-gray-100 hover:bg-gray-50">
      {columns.map((column, colIndex) => (
        <td 
          key={`${rowIndex}-${colIndex}`} 
          className={`px-6 py-4 ${column.className || ''} ${getResponsiveClassName(column)}`}
        >
          {(cellRenderer || defaultCellRenderer)(
            column,
            column.accessor ? (typeof column.accessor === 'function' ? column.accessor(row) : row[column.accessor]) : null,
            row
          )}
        </td>
      ))}
    </tr>
  );

  // Responsive card view for very small screens (replaces table completely)
  const renderCardView = (row, rowIndex) => {
    // Get essential columns for card view
    const cardColumns = getEssentialColumns();
    // First column is always the main one
    const primaryColumn = cardColumns[0];
    const secondaryColumns = cardColumns.slice(1);
    
    return (
      <div key={rowIndex} className="border-b border-gray-100 p-4">
        {/* Primary content (usually the title or main identifier) */}
        <div className="font-medium text-base mb-2">
          {(cellRenderer || defaultCellRenderer)(
            primaryColumn,
            primaryColumn.accessor ? (typeof primaryColumn.accessor === 'function' ? primaryColumn.accessor(row) : row[primaryColumn.accessor]) : null,
            row
          )}
        </div>
        
        {/* Secondary content */}
        <div className="space-y-2">
          {secondaryColumns.map((column, colIndex) => (
            <div key={colIndex} className="flex justify-between items-center text-sm">
              <span className="text-gray-500">{column.header}:</span>
              <span>
                {(cellRenderer || defaultCellRenderer)(
                  column,
                  column.accessor ? (typeof column.accessor === 'function' ? column.accessor(row) : row[column.accessor]) : null,
                  row
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg border overflow-hidden ${className}`}>
      {/* Responsive layout: Card view for very small screens */}
      <div className="sm:hidden">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-pulse flex justify-center">
              <div className="h-8 w-8 bg-primary/20 rounded-full"></div>
            </div>
            <p className="mt-2 text-sm text-gray-500">{loadingMessage}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          data.map((row, index) => (
            rowRenderer ? rowRenderer(row, index) : renderCardView(row, index)
          ))
        )}
      </div>

      {/* Table view for tablet/desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    sortable && column.sortable !== false ? 'cursor-pointer select-none' : ''
                  } ${column.headerClassName || ''} ${getResponsiveClassName(column)}`}
                  onClick={() => column.sortable !== false && handleSort(column.accessor)}
                >
                  <div className="flex items-center">
                    <span>{column.header}</span>
                    {column.sortable !== false && <SortIcon field={column.accessor} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8">
                  <div className="animate-pulse flex justify-center">
                    <div className="h-8 w-8 bg-primary/20 rounded-full"></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">{loadingMessage}</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8">
                  <p className="text-sm text-gray-500">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((row, index) => (rowRenderer || defaultRowRenderer)(row, index))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="border-t border-gray-100 px-4">
          <PaginationBar
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalCount={pagination.totalCount}
            pageSize={pagination.pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      )}
    </div>
  );
};

export default DataTable;
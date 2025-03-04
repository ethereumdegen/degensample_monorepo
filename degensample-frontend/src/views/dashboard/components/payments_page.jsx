
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { observer } from "mobx-react";
import { Web3StoreContext } from '@/stores/stores-context';
import { Link } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { makeApiRequest } from '@/lib/request-lib';
import { getEtherscanRootUrl } from '@/lib/app-helper';
import DataTable from '@/views/components/table/DataTable';

const PaymentsContent = () => {
  const web3Store = useContext(Web3StoreContext);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenSymbols, setTokenSymbols] = useState({});
  const [chainNames] = useState({
    1: 'Ethereum',
    8453: 'Base',
    11155111: 'Sepolia Testnet'
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1
  });
  
  // Sorting state
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Fetch token symbols for displaying in the table
  const fetchTokenSymbols = async (chainId) => {
    try {
      const data = {
        session_token: web3Store.authToken,
        chain_id: parseInt(chainId, 10)
      };
      
      const response = await makeApiRequest('/api/token_symbols/list_by_chain', 'post', data);
      
      if (response && response.data) {
        // Transform the response data into a lookup map
        const symbols = {};
        response.data.forEach(token => {
          symbols[token.token_address.toLowerCase()] = {
            symbol: token.token_symbol,
            decimals: parseInt(token.token_decimals, 10)
          };
        });
        
        return symbols;
      }
    } catch (err) {
      console.error(`Failed to fetch token symbols for chain ${chainId}:`, err);
      return {};
    }
  };

  // Helper function to truncate Ethereum addresses for display
  const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Format date from string
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString();
  };

  // Convert raw amount to human-readable amount based on token decimals
  const formatTokenAmount = (amount, tokenAddress, chainId) => {
    if (!amount) return "0";
    
    // Get token decimals from our token symbols lookup
    const tokenDetails = tokenSymbols[chainId] && 
                        tokenSymbols[chainId][tokenAddress.toLowerCase()];
    const decimals = tokenDetails ? tokenDetails.decimals : 18; // Default to 18 if not found
    
    try {
      // Parse the raw amount as a number
      const rawAmount = parseFloat(amount);
      if (isNaN(rawAmount)) return "0";
      
      // Divide by 10^decimals to get the human-readable amount
      const humanAmount = rawAmount / Math.pow(10, decimals);
      
      // Format the number with thousands separators and up to 6 decimal places
      return humanAmount.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6
      });
    } catch (e) {
      console.error("Error formatting token amount:", e);
      return "0";
    }
  };

  // Get token symbol from address
  const getTokenSymbol = (tokenAddress, chainId) => {
    if (!tokenAddress) return "";
    
    const chainTokens = tokenSymbols[chainId];
    if (chainTokens && chainTokens[tokenAddress.toLowerCase()]) {
      return chainTokens[tokenAddress.toLowerCase()].symbol;
    }
    
    return truncateAddress(tokenAddress);
  };

  // Helper to get chain name from ID
  const getChainName = (chainId) => {
    return chainNames[chainId] || `Chain ${chainId}`;
  };

  // Fetch payments data with pagination
  const fetchPayments = useCallback(async () => {
    if (!web3Store.account || !web3Store.authToken) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const data = {
        session_token: web3Store.authToken,
        pagination: {
          page: pagination.page,
          page_size: pagination.pageSize,
          sort_by: sortField,
          sort_dir: sortDirection
        }
      };
      
      const response = await makeApiRequest('/api/payments/list', 'post', data);
      
      if (response && response.success) {
        // If using the new paginated API response format
        if (response.data && response.data.items) {
          setPayments(response.data.items);
          
          // Update pagination info
          setPagination({
            page: response.data.page,
            pageSize: response.data.page_size,
            totalCount: response.data.total_count,
            totalPages: response.data.total_pages
          });
          
          // Collect unique chain IDs to fetch token symbols for each
          const uniqueChainIds = [...new Set(response.data.items.map(payment => payment.entry.chain_id))];
          
          // Fetch token symbols for each chain
          const symbols = {};
          for (const chainId of uniqueChainIds) {
            symbols[chainId] = await fetchTokenSymbols(chainId);
          }
          
          setTokenSymbols(symbols);
        } 
        // For backward compatibility with the old API format
        else if (Array.isArray(response.data)) {
          setPayments(response.data);
          setPagination({
            ...pagination,
            totalCount: response.data.length,
            totalPages: Math.ceil(response.data.length / pagination.pageSize)
          });
          
          // Collect unique chain IDs to fetch token symbols for each
          const uniqueChainIds = [...new Set(response.data.map(payment => payment.entry.chain_id))];
          
          // Fetch token symbols for each chain
          const symbols = {};
          for (const chainId of uniqueChainIds) {
            symbols[chainId] = await fetchTokenSymbols(chainId);
          }
          
          setTokenSymbols(symbols);
        } else {
          setPayments([]);
          setPagination({
            ...pagination,
            totalCount: 0,
            totalPages: 1
          });
        }
      } else {
        setPayments([]);
        setPagination({
          ...pagination,
          totalCount: 0,
          totalPages: 1
        });
      }
    } catch (e) {
      console.error('Failed to fetch payments:', e);
      setError('Failed to load payments. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [web3Store.account, web3Store.authToken, pagination.page, pagination.pageSize, sortField, sortDirection]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination({
      ...pagination,
      page: newPage
    });
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize) => {
    setPagination({
      ...pagination,
      page: 1, // Reset to first page when changing page size
      pageSize: newPageSize
    });
  };

  // Handle sort change
  const handleSortChange = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
  };

  // Fetch data when dependencies change
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Define table columns
  const columns = [
    {
      header: 'Transaction',
      accessor: (row) => row.entry.transaction_hash,
      sortable: true,
      className: 'whitespace-nowrap font-mono text-sm',
      essential: true, // Always keep this column, even on small screens
      format: (value, row) => (
        <a 
          href={`${getEtherscanRootUrl(row.entry.chain_id)}/tx/${value}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {truncateAddress(value)}
        </a>
      )
    },
    {
      header: 'From',
      accessor: (row) => row.entry.from_address,
      sortable: true,
      className: 'whitespace-nowrap font-mono text-sm',
     responsive: 'lg', // Show this column at lg breakpoint and above
      format: (value) => truncateAddress(value)
    },
    {
      header: 'Token',
      accessor: (row) => row.entry.payment_token_address,
      sortable: false, // Can't sort by this field in the backend
      className: 'whitespace-nowrap',
      essential: true, // Always keep this column, even on small screens
      format: (value, row) => getTokenSymbol(value, row.entry.chain_id)
    },
    {
      header: 'Amount',
      accessor: (row) => row.entry.totalAmount,
      sortable: false, // Can't sort by this field in the backend
      className: 'whitespace-nowrap',
      essential: true, // Always keep this column, even on small screens
      format: (value, row) => formatTokenAmount(
        value,
        row.entry.payment_token_address,
        row.entry.chain_id
      )
    },
    {
      header: 'Recipients',
      accessor: (row) => row.entry.pay_to_array.length,
      sortable: false, // Can't sort by this field in the backend
      className: 'whitespace-nowrap',
      responsive: 'lg', // Show this column at lg breakpoint and above
      format: (value) => `${value} recipient(s)`
    },
    {
      header: 'Network',
      accessor: (row) => row.entry.chain_id,
      sortable: true,
      className: 'whitespace-nowrap',
      responsive: 'sm', // Show this column at sm breakpoint and above
      format: (value) => getChainName(value)
    },
    {
      header: 'Date',
      accessor: 'created_at',
      sortable: true,
      className: 'whitespace-nowrap',
      responsive: 'lg', // Show this column at lg breakpoint and above
      format: (_, row) => formatDate(row.entry.payment_at_block_timestamp || row.created_at)
    }
  ];

  return (
    <div className="font-inter">
      <h2 className="heading-2 mb-6">Payments</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {payments.length > 0 || isLoading ? (
        <DataTable
          columns={columns}
          data={payments}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          sortable={true}
          defaultSortField={sortField}
          defaultSortDirection={sortDirection}
          onSortChange={handleSortChange}
          loadingMessage="Loading payments..."
          emptyMessage="No payments to display."
        />
      ) : (
        <div className="text-center py-12 bg-gradient-to-r from-deep-indigo/5 to-cool-gray/30 rounded-xl border border-deep-indigo/10">
          <div className="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-deep-indigo/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <p className="text-slate-600 mb-2">You don't have any payments yet</p>
          <p className="text-slate-500 text-sm mb-5">Payments will appear here once you receive them</p>
          <Link to="/dashboard/invoices" className="btn-primary inline-flex items-center">
            <LucideIcons.PlusIcon className="h-4 w-4 mr-2" />
            Create Invoice
          </Link>
        </div>
      )}
    </div>
  );
};

export default observer(PaymentsContent);
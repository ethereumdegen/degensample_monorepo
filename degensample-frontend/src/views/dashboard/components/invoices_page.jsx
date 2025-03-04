import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Web3StoreContext } from '@/stores/stores-context';
import { makeApiRequest } from '@/lib/request-lib';
import { getEtherscanRootUrl } from '@/lib/app-helper';
import { Link } from "react-router-dom";
import ActionDropdown from '@/views/components/action-dropdown/Main';
import DataTable from '@/views/components/table/DataTable';

// Will be populated dynamically from the API
const TOKEN_PRESETS = {};

const InvoicesPage = () => {
  const web3Store = useContext(Web3StoreContext);
  const [invoices, setInvoices] = useState([]);
  const [invoiceTemplates, setInvoiceTemplates] = useState([]);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [error, setError] = useState(null);
  const [templateError, setTemplateError] = useState(null);
  const [tokensLoading, setTokensLoading] = useState(false);
  
  // Chain names mapping
  const [chainNames] = useState({
    1: 'Ethereum',
    8453: 'Base',
    11155111: 'Sepolia Testnet'
  });
  
  // Pagination state for invoices
  const [invoicesPagination, setInvoicesPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1
  });
  
  // Pagination state for invoice templates
  const [templatesPagination, setTemplatesPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1
  });
  
  // Sorting state for invoices
  const [invoicesSortField, setInvoicesSortField] = useState('created_at');
  const [invoicesSortDirection, setInvoicesSortDirection] = useState('desc');
  
  // Sorting state for templates
  const [templatesSortField, setTemplatesSortField] = useState('created_at');
  const [templatesSortDirection, setTemplatesSortDirection] = useState('desc');
  
  // Form state for new invoice template
  const [templateFormData, setTemplateFormData] = useState({
    contractAddress: '',
    tokenAddress: '',
    payToAddresses: [''],
    payToAmounts: [''],
    chainId: '1' // Default to Ethereum mainnet
  });
  
  // Initialize first recipient address with user's wallet address when available
  useEffect(() => {
    if (web3Store.account && templateFormData.payToAddresses[0] === '') {
      const updatedAddresses = [...templateFormData.payToAddresses];
      updatedAddresses[0] = web3Store.account;
      setTemplateFormData({
        ...templateFormData,
        payToAddresses: updatedAddresses
      });
    }
  }, [web3Store.account]);

  // Get token presets for current chain
  const currentTemplateTokenPresets = TOKEN_PRESETS[templateFormData.chainId] || [];
  
  // Fetch token symbols by chain ID - returns a promise
  const fetchTokenSymbols = async (chainId) => {
    if (!web3Store.authToken || !chainId) return null;
    
    // Skip if we already have tokens for this chain
    if (TOKEN_PRESETS[chainId] && TOKEN_PRESETS[chainId].length > 0) {
      console.log(`Already have token data for chain ${chainId}`);
      return TOKEN_PRESETS[chainId];
    }
    
    try {
      const data = {
        session_token: web3Store.authToken,
        chain_id: parseInt(chainId, 10)
      };

      console.log(`Fetching token symbols for chain ${chainId}`);
      
      const response = await makeApiRequest('/api/token_symbols/list_by_chain', 'post', data);
      
      if (response && response.data) {
        // Transform the response data into the format we need
        const tokens = response.data.map(token => ({
          name: token.token_symbol,
          address: token.token_address,
          decimals: parseInt(token.token_decimals, 10)
        }));
        
        console.log(`Received ${tokens.length} tokens for chain ${chainId}:`, tokens);
        
        // Update the TOKEN_PRESETS object
        TOKEN_PRESETS[chainId] = tokens;
        
        return tokens;
      } else {
        console.error(`No data in response for chain ${chainId}`);
        TOKEN_PRESETS[chainId] = [];
        return [];
      }
    } catch (err) {
      console.error(`Failed to fetch token symbols for chain ${chainId}:`, err);
      // Fallback to empty array if fetch fails
      TOKEN_PRESETS[chainId] = [];
      return [];
    }
  };

  // Fetch token symbols when template chain ID changes
  useEffect(() => {
    if (web3Store.authToken && templateFormData.chainId) {
      fetchTokenSymbols(templateFormData.chainId)
        .then(() => {
          // Force a refresh of template form dropdown
          setTemplateFormData({...templateFormData});
        });
    }
  }, [web3Store.authToken, templateFormData.chainId]);
  
  // No need for manual dropdown management - handled by ActionDropdown component

  // Fetch invoice templates with pagination
  const fetchInvoiceTemplates = useCallback(async () => {
    if (!web3Store.account || !web3Store.authToken) {
      setIsLoadingTemplates(false);
      return;
    }
    
    setIsLoadingTemplates(true);
    try {
      const data = {
        session_token: web3Store.authToken,
        wallet_public_address: web3Store.account,
        pagination: {
          page: templatesPagination.page,
          page_size: templatesPagination.pageSize,
          sort_by: templatesSortField,
          sort_dir: templatesSortDirection
        }
      };
      
      const response = await makeApiRequest('/api/invoice_templates/list', 'post', data);
        
      console.log("invoice templates list res", response);

      if (response && response.success) {
        // If using the new paginated API response format
        if (response.data && response.data.items) {
          setInvoiceTemplates(response.data.items);
          
          // Update pagination info
          setTemplatesPagination({
            page: response.data.page,
            pageSize: response.data.page_size,
            totalCount: response.data.total_count,
            totalPages: response.data.total_pages
          });
        } 
        // For backward compatibility with the old API format
        else if (Array.isArray(response.data)) {
          setInvoiceTemplates(response.data);
          setTemplatesPagination({
            ...templatesPagination,
            totalCount: response.data.length,
            totalPages: Math.ceil(response.data.length / templatesPagination.pageSize)
          });
        } else {
          setInvoiceTemplates([]);
          setTemplatesPagination({
            ...templatesPagination,
            totalCount: 0,
            totalPages: 1
          });
        }
      } else {
        setInvoiceTemplates([]);
        setTemplatesPagination({
          ...templatesPagination,
          totalCount: 0,
          totalPages: 1
        });
      }
    } catch (e) {
      console.error('Failed to fetch invoice templates:', e);
      setTemplateError('Failed to load invoice templates. Please try again later.');
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [web3Store.account, web3Store.authToken, templatesPagination.page, templatesPagination.pageSize, templatesSortField, templatesSortDirection]);

  // Handle template pagination and sorting
  const handleTemplatePageChange = (newPage) => {
    setTemplatesPagination({
      ...templatesPagination,
      page: newPage
    });
  };

  const handleTemplatePageSizeChange = (newPageSize) => {
    setTemplatesPagination({
      ...templatesPagination,
      page: 1, // Reset to first page when changing page size
      pageSize: newPageSize
    });
  };

  const handleTemplateSortChange = (field, direction) => {
    setTemplatesSortField(field);
    setTemplatesSortDirection(direction);
  };

  // Fetch templates when dependencies change
  useEffect(() => {
    fetchInvoiceTemplates();
  }, [fetchInvoiceTemplates]);

  // Fetch invoices with pagination
  const fetchInvoices = useCallback(async () => {
    if (!web3Store.account || !web3Store.authToken) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const data = {
        session_token: web3Store.authToken,
        wallet_public_address: web3Store.account,
        pagination: {
          page: invoicesPagination.page,
          page_size: invoicesPagination.pageSize,
          sort_by: invoicesSortField,
          sort_dir: invoicesSortDirection
        }
      };
      
      const response = await makeApiRequest('/api/invoices/list', 'post', data);
        
      console.log("invoices list res", response);

      if (response && response.success) {
        // If using the new paginated API response format
        if (response.data && response.data.items) {
          setInvoices(response.data.items);
          
          // Update pagination info
          setInvoicesPagination({
            page: response.data.page,
            pageSize: response.data.page_size,
            totalCount: response.data.total_count,
            totalPages: response.data.total_pages
          });
        } 
        // For backward compatibility with the old API format
        else if (Array.isArray(response.data)) {
          setInvoices(response.data);
          setInvoicesPagination({
            ...invoicesPagination,
            totalCount: response.data.length,
            totalPages: Math.ceil(response.data.length / invoicesPagination.pageSize)
          });
        } else {
          setInvoices([]);
          setInvoicesPagination({
            ...invoicesPagination,
            totalCount: 0,
            totalPages: 1
          });
        }
      } else {
        setInvoices([]);
        setInvoicesPagination({
          ...invoicesPagination,
          totalCount: 0,
          totalPages: 1
        });
      }
    } catch (e) {
      console.error('Failed to fetch invoices:', e);
      setError('Failed to load invoices. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [web3Store.account, web3Store.authToken, invoicesPagination.page, invoicesPagination.pageSize, invoicesSortField, invoicesSortDirection]);

  // Handle invoice pagination and sorting
  const handleInvoicePageChange = (newPage) => {
    setInvoicesPagination({
      ...invoicesPagination,
      page: newPage
    });
  };

  const handleInvoicePageSizeChange = (newPageSize) => {
    setInvoicesPagination({
      ...invoicesPagination,
      page: 1, // Reset to first page when changing page size
      pageSize: newPageSize
    });
  };

  const handleInvoiceSortChange = (field, direction) => {
    setInvoicesSortField(field);
    setInvoicesSortDirection(direction);
  };

  // Fetch invoices when dependencies change
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Fetch token symbols for all chains present in invoices and templates
  useEffect(() => {
    if (!web3Store.authToken || (!invoices.length && !invoiceTemplates.length)) return;
    
    const loadTokenData = async () => {
      // Set loading state
      setTokensLoading(true);
      
      try {
        // Get unique chain IDs from both invoices and templates
        const uniqueChainIds = [...new Set([
          ...invoices.map(invoice => invoice.chain_id),
          ...invoiceTemplates.map(template => template.chain_id)
        ])].filter(id => id); // Remove any undefined values
        
        console.log("Loading token data for chains:", uniqueChainIds);
        
        // Fetch token symbols for all chains concurrently
        await Promise.all(uniqueChainIds.map(chainId => fetchTokenSymbols(chainId)));
        
        // Force re-render after all token data is loaded
        if (invoices.length) setInvoices([...invoices]);
        if (invoiceTemplates.length) setInvoiceTemplates([...invoiceTemplates]);
      } catch (error) {
        console.error("Error loading token data:", error);
      } finally {
        setTokensLoading(false);
      }
    };
    
    loadTokenData();
  }, [web3Store.authToken, invoices.length, invoiceTemplates.length]);

  // Handle template form input changes
  const handleTemplateInputChange = (e) => {
    const { name, value } = e.target;
    
    // When chain ID changes, reset token address
    if (name === 'chainId') {
      setTemplateFormData({
        ...templateFormData,
        [name]: value,
        tokenAddress: '' // Reset token address when chain changes
      });
    } else {
      setTemplateFormData({
        ...templateFormData,
        [name]: value
      });
    }
  };

  // Handle pay-to arrays (multiple recipients) for templates
  const handleTemplatePayToChange = (index, field, value) => {
    const updatedArray = [...templateFormData[field]];
    updatedArray[index] = value;
    setTemplateFormData({
      ...templateFormData,
      [field]: updatedArray
    });
  };

  // Add new recipient field for templates
  const addTemplateRecipient = () => {
    setTemplateFormData({
      ...templateFormData,
      payToAddresses: [...templateFormData.payToAddresses, ''],
      payToAmounts: [...templateFormData.payToAmounts, '']
    });
  };

  // Remove recipient field for templates
  const removeTemplateRecipient = (index) => {
    const updatedAddresses = [...templateFormData.payToAddresses];
    const updatedAmounts = [...templateFormData.payToAmounts];
    
    updatedAddresses.splice(index, 1);
    updatedAmounts.splice(index, 1);
    
    setTemplateFormData({
      ...templateFormData,
      payToAddresses: updatedAddresses,
      payToAmounts: updatedAmounts
    });
  };

  const toHexString = (byteArray) => {
    return Array.from(byteArray)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }
  
  // Reset template form to initial state
  const resetTemplateForm = () => {
    setTemplateFormData({
      tokenAddress: '',
      payToAddresses: [''],
      payToAmounts: [''],
      chainId: '1'
    });
    setTemplateError(null);
  };
  
  // Create new invoice template
  const createNewInvoiceTemplate = async () => {
    try {
      setIsLoadingTemplates(true);
      
      // Validate inputs
      if (!templateFormData.tokenAddress) {
        setTemplateError('Please fill in all required fields');
        setIsLoadingTemplates(false);
        return;
      }
      
      // Check if all recipients have both address and amount
      const validRecipients = templateFormData.payToAddresses.every((addr, idx) => 
        addr && templateFormData.payToAmounts[idx]
      );
      
      if (!validRecipients) {
        setTemplateError('Please provide both address and amount for all recipients');
        setIsLoadingTemplates(false);
        return;
      }
      
      // Convert human amounts to raw amounts for API
      const rawAmounts = templateFormData.payToAmounts.map(amount => 
        toRawAmount(amount, templateFormData.tokenAddress, templateFormData.chainId)
      );
      
      const data = {
        session_token: web3Store.authToken,
        token_address: templateFormData.tokenAddress,
        pay_to_array: templateFormData.payToAddresses,
        pay_to_amounts: rawAmounts, // Use raw amounts for API
        chain_id: parseInt(templateFormData.chainId, 10),
        metadata: { description: "Created using the dashboard" }
      };
      
      const response = await makeApiRequest('/api/invoice_templates/create', 'post', data);
      
      if (response && response.data) {
        let newTemplate = response.data;
        console.log("Created new invoice template", newTemplate);
        
        // Add the new template to the list
        setInvoiceTemplates([newTemplate, ...invoiceTemplates]);
        setIsCreatingTemplate(false);
        resetTemplateForm();
        
        // Refresh templates
        fetchInvoiceTemplates();
      }
    } catch (error) {
      console.error("Error creating invoice template:", error);
      setTemplateError('Failed to create invoice template. Please try again.');
    } finally {
      setIsLoadingTemplates(false);
    }
  };
  
  // Create invoice from template
  const createInvoiceFromTemplate = async (templateUuid) => {
    try {
      setIsLoading(true);
      
      const data = {
        session_token: web3Store.authToken,
        template_uuid: templateUuid
      };
      
      const response = await makeApiRequest('/api/invoice_templates/find_or_create_invoice_from_template', 'post', data);
      
      if (response && response.data) {
        let newInvoice = response.data;
        console.log("Created invoice from template", newInvoice);
        
        // Add the new invoice to the list
        setInvoices([newInvoice, ...invoices]);
        
        // Refresh invoices
        fetchInvoices();
      }
    } catch (error) {
      console.error("Error creating invoice from template:", error);
      setError('Failed to create invoice from template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Define template columns for DataTable
  const templateColumns = [
    {
      header: 'Template UUID',
      accessor: (row) => row.template_uuid,
      sortable: false,
      className: 'whitespace-nowrap font-mono text-sm',
      format: (value) => value.substring(0, 8) + '...'
    },
    {
      header: 'Token',
      accessor: (row) => row.token_address,
      sortable: false,
      className: 'whitespace-nowrap',
      format: (value, row) => {
        const tokenSymbol = getTokenNameByAddress(value, row.chain_id);
        return (
          <a 
            href={`${getEtherscanRootUrl(row.chain_id)}/token/${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {tokenSymbol}
          </a>
        );
      }
    },
    {
      header: 'Recipients',
      accessor: (row) => row.pay_to_array.length,
      sortable: false,
      className: 'whitespace-nowrap',
      format: (value) => `${value} recipient(s)`
    },
    {
      header: 'Network',
      accessor: 'chain_id',
      sortable: true,
      className: 'whitespace-nowrap',
      format: (value) => getChainName(value)
    },
    {
      header: 'Created',
      accessor: 'created_at',
      sortable: true,
      className: 'whitespace-nowrap',
      format: (value) => formatDate(value)
    },
    {
      header: 'Actions',
      accessor: 'template_uuid',
      sortable: false,
      className: 'whitespace-nowrap',
      format: (value) => (
        <ActionDropdown buttonText="Actions" disabled={isLoading}>
          <button
            onClick={() => createInvoiceFromTemplate(value)}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
            disabled={isLoading}
          >
            Create Invoice
          </button>
          <Link
            to={`/payment-button/${value}`}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
          >
            Embed Payment Button
          </Link>
        </ActionDropdown>
      )
    }
  ];

  // Define invoice columns for DataTable
  const invoiceColumns = [
    {
      header: 'UUID',
      accessor: 'uuid',
      sortable: true,
      className: 'whitespace-nowrap font-mono text-sm',
      essential: true,
      format: (value) => (
        <Link 
          to={`/invoices/pay/${value}`}
          className="text-primary hover:text-primary/80 hover:underline"
        >
          {value.substring(0, 8)}...
        </Link>
      )
    },
   /* {
      header: 'Contract',
      accessor: 'contract_address',
      sortable: false,
      className: 'whitespace-nowrap font-mono text-sm',
      responsive: 'lg',
      format: (value) => truncateAddress(value)
    },*/
    {
      header: 'Token',
      accessor: 'token_address',
      sortable: false,
      className: 'whitespace-nowrap',
      essential: true,
      format: (value, row) => {
        const tokenSymbol = getTokenNameByAddress(value, row.chain_id);
        return (
          <a 
            href={`${getEtherscanRootUrl(row.chain_id)}/token/${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {tokenSymbol}
          </a>
        );
      }
    },
    {
      header: 'Recipients',
      accessor: (row) => row.pay_to_array.length,
      sortable: false,
      className: 'whitespace-nowrap',
      format: (value) => `${value} recipient(s)`
    },
    {
      header: 'Total Amount',
      accessor: (row) => calculateTotalAmount(row.pay_to_amounts, row.token_address, row.chain_id),
      sortable: false,
      className: 'whitespace-nowrap',
      essential: true,
      format: (value, row) => formatAmount(
        toHumanAmount(value, row.token_address, row.chain_id),
        row.token_address, 
        row.chain_id
      )
    },
    {
      header: 'Network',
      accessor: 'chain_id',
      sortable: true,
      className: 'whitespace-nowrap',
      responsive: 'sm',
      format: (value) => getChainName(value)
    },
    {
      header: 'Created',
      accessor: 'created_at',
      sortable: true,
      className: 'whitespace-nowrap',
      responsive: 'md',
      format: (value) => formatDate(value)
    }
  ];

  // Format date from string
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Helper to truncate Ethereum addresses for display
  const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Convert human-readable amount to raw amount based on token decimals
  const toRawAmount = (humanAmount, tokenAddress, chainId) => {
    if (!humanAmount) return "0";
    
    // Get token decimals
    const decimals = getTokenDecimalsByAddress(tokenAddress, chainId);
    
    // Convert to raw amount
    // For example, 5 USDC (6 decimals) becomes 5000000
    try {
      // Parse the human amount as a float
      const parsedAmount = parseFloat(humanAmount);
      if (isNaN(parsedAmount)) return "0";
      
      // Multiply by 10^decimals
      return (parsedAmount * Math.pow(10, decimals)).toString();
    } catch (e) {
      console.error("Error converting to raw amount:", e);
      return "0";
    }
  };
  
  // Convert raw amount to human-readable amount based on token decimals
  const toHumanAmount = (rawAmount, tokenAddress, chainId) => {
    if (!rawAmount) return "0";
    
    // Get token decimals
    const decimals = getTokenDecimalsByAddress(tokenAddress, chainId);
    
    // Convert to human amount
    // For example, 5000000 USDC (6 decimals) becomes 5
    try {
      // Parse the raw amount
      const parsedAmount = parseFloat(rawAmount);
      if (isNaN(parsedAmount)) return "0";
      
      // Divide by 10^decimals
      return (parsedAmount / Math.pow(10, decimals)).toString();
    } catch (e) {
      console.error("Error converting to human amount:", e);
      return "0";
    }
  };
  
  // Calculate total amount from pay_to_amounts array (in human-readable form)
  const calculateTotalAmount = (amounts, tokenAddress, chainId) => {
    if (!amounts || !amounts.length) return 0;
    
    const total = amounts.reduce((total, amount) => {
      // Convert amount to number, handle potential strings
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      return total + (isNaN(numAmount) ? 0 : numAmount);
    }, 0);
    
    return total;
  };
  
  // Format amount for display purposes
  const formatAmount = (amount, tokenAddress, chainId) => {
    if (!amount) return "0";
    
    // For display purposes only, not for blockchain transactions
    return parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    });
  };

  // Function to get token name from address
  const getTokenNameByAddress = (address, chainId) => {
    if (!address) return "";
    
    const presets = TOKEN_PRESETS[chainId] || [];
    // Avoid excessive logging
    // console.log(`Looking for token ${address} in chain ${chainId}, presets:`, presets);
    
    const token = presets.find(t => t.address.toLowerCase() === address.toLowerCase());
    return token ? token.name : truncateAddress(address);
  };
  
  // Helper to get chain name from ID
  const getChainName = (chainId) => {
    return chainNames[chainId] || `Chain ${chainId}`;
  };
  
  // Function to get token decimals from address
  const getTokenDecimalsByAddress = (address, chainId) => {
    const presets = TOKEN_PRESETS[chainId] || [];
    const token = presets.find(t => t.address.toLowerCase() === address.toLowerCase());
    return token ? token.decimals : 18; // Default to 18 if not found (common for most ERC20 tokens)
  };

  // No custom styles needed, using ActionDropdown component

  return (
    <div>
      {/* Invoice Templates Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Invoice Templates</h2>
          <button 
            onClick={() => setIsCreatingTemplate(true)}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            disabled={isLoadingTemplates}
          >
            Create New Template
          </button>
        </div>
        
        {templateError && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
            <p className="font-semibold">Error</p>
            <p>{templateError}</p>
          </div>
        )}
        
        {isCreatingTemplate && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="font-semibold mb-4 text-xl">Create New Invoice Template</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chain
                  </label>
                  <select
                    name="chainId"
                    value={templateFormData.chainId}
                    onChange={handleTemplateInputChange}
                    className="w-full p-2 border rounded-md"
                    disabled={isLoadingTemplates}
                  >
                    <option value="1">Ethereum Mainnet (1)</option>
                    <option value="8453">Base (8453)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="tokenAddress"
                    value={templateFormData.tokenAddress}
                    onChange={handleTemplateInputChange}
                    className="w-full p-2 border rounded-md"
                    disabled={isLoadingTemplates || tokensLoading}
                  >
                    <option value="">
                      {tokensLoading ? "Loading tokens..." : "Select a token"}
                    </option>
                    {currentTemplateTokenPresets.map((token) => (
                      <option key={token.address} value={token.address}>
                        {token.name} ({truncateAddress(token.address)}) - {token.decimals} decimals
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Recipients <span className="text-red-500">*</span>
                  </label>
                  <button 
                    type="button"
                    onClick={addTemplateRecipient}
                    className="text-sm text-primary"
                    disabled={isLoadingTemplates}
                  >
                    + Add Recipient
                  </button>
                </div>
                
                {templateFormData.payToAddresses.map((address, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Recipient Address"
                      value={address}
                      onChange={(e) => handleTemplatePayToChange(index, 'payToAddresses', e.target.value)}
                      className="flex-1 p-2 border rounded-md"
                      disabled={isLoadingTemplates}
                    />
                    <input
                      type="text"
                      placeholder="Amount"
                      value={templateFormData.payToAmounts[index]}
                      onChange={(e) => handleTemplatePayToChange(index, 'payToAmounts', e.target.value)}
                      className="w-1/3 p-2 border rounded-md"
                      disabled={isLoadingTemplates}
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeTemplateRecipient(index)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-md"
                        disabled={isLoadingTemplates}
                      >
                        X
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button 
                onClick={createNewInvoiceTemplate}
                className="px-4 py-2 bg-primary text-white rounded-md"
                disabled={isLoadingTemplates}
              >
                {isLoadingTemplates ? 'Creating...' : 'Create Template'}
              </button>
              <button 
                onClick={() => {
                  setIsCreatingTemplate(false);
                  resetTemplateForm();
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
                disabled={isLoadingTemplates}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {invoiceTemplates.length > 0 || isLoadingTemplates ? (
          <DataTable
            columns={templateColumns}
            data={invoiceTemplates}
            isLoading={isLoadingTemplates}
            pagination={templatesPagination}
            onPageChange={handleTemplatePageChange}
            onPageSizeChange={handleTemplatePageSizeChange}
            sortable={true}
            defaultSortField={templatesSortField}
            defaultSortDirection={templatesSortDirection}
            onSortChange={handleTemplateSortChange}
            loadingMessage="Loading invoice templates..."
            emptyMessage="No invoice templates to display."
          />
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">You don't have any invoice templates yet</p>
            <button 
              onClick={() => setIsCreatingTemplate(true)}
              className="px-4 py-2 bg-primary text-white rounded-md"
              disabled={isLoadingTemplates}
            >
              Create Your First Template
            </button>
          </div>
        )}
      </div>
      
      {/* Regular Invoices Section */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Invoices</h2>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {invoices.length > 0 || isLoading ? (
        <DataTable
          columns={invoiceColumns}
          data={invoices}
          isLoading={isLoading}
          pagination={invoicesPagination}
          onPageChange={handleInvoicePageChange}
          onPageSizeChange={handleInvoicePageSizeChange}
          sortable={true}
          defaultSortField={invoicesSortField}
          defaultSortDirection={invoicesSortDirection}
          onSortChange={handleInvoiceSortChange}
          loadingMessage="Loading invoices..."
          emptyMessage="No invoices to display."
        />
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">You don't have any invoices yet</p>
          <p className="text-sm text-gray-500">Create an invoice from a template above to get started</p>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
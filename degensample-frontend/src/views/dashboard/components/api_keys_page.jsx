import React, { useState, useEffect, useContext, useRef } from 'react';
import { getBackendServerUrl } from '@/lib/app-helper';
import { Web3StoreContext } from '@/stores/stores-context';
import axios from 'axios';


import {makeApiRequest} from '@/lib/request-lib'
import Modal from '@/views/components/modal/Main';

const ApiKeysPage = () => {
  const web3Store = useContext(Web3StoreContext);
  const [apiKeys, setApiKeys] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Delete functionality
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [isDeleting, setIsDeleting] = useState(false);
  const countdownInterval = useRef(null);



  // Fetch API keys
  useEffect(() => {
    const fetchApiKeys = async () => {
      if (!web3Store.account || !web3Store.authToken) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // Use GET request with query parameters for listing
        const url = `/api/apikey/list?session_token=${web3Store.authToken}&wallet_public_address=${web3Store.account}`;
        const response = await makeApiRequest(url, 'post');
        
        if (response && response.data) {
          setApiKeys(response.data);
        } else {
          setApiKeys([]);
        }
      } catch (e) {
        console.error('Failed to fetch API keys:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiKeys();
  }, [web3Store.account, web3Store.authToken]);
  
  // Clean up any effects when component unmounts
  useEffect(() => {
    return () => {
      // Clean up the interval when component unmounts
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, []);

  // Create new API key
  const createNewApiKey = async () => {
    try {
      setIsLoading(true);
      const data = {
        session_token: web3Store.authToken,
        wallet_public_address: web3Store.account,
        name: keyName || `API Key ${apiKeys.length + 1}`
      };
      
      const response = await makeApiRequest('/api/apikey/create', 'post', data);
      
      if (response && response.data) {
        // Add the new key to the list
        // Note: We need to refresh the full list as the create endpoint returns only the new key
        const updatedKey = {
          id: response.data.id || `temp-${Date.now()}`,
          apikey: response.data.api_key,
          name: data.name,
          created_at: Date.now() / 1 // Current timestamp in seconds
        };
        
        setApiKeys([updatedKey, ...apiKeys]);
        setIsCreating(false);
        setKeyName("");
      }
    } catch (error) {
      console.error("Error creating API key:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open delete confirmation modal
  const openDeleteModal = (key) => {
    setKeyToDelete(key);
    setIsDeleteModalOpen(true);
    setCountdown(3);
    setError(null); // Clear any previous errors
    
    // Start countdown timer
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    
    countdownInterval.current = setInterval(() => {
      setCountdown((prevCount) => {
        if (prevCount <= 1) {
          clearInterval(countdownInterval.current);
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);
  };
  
  // Close delete modal and cleanup
  const closeDeleteModal = () => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    setIsDeleteModalOpen(false);
    setKeyToDelete(null);
    setCountdown(3);
  };
  
  // Delete the API key
  const deleteApiKey = async () => {
    if (!keyToDelete) return;
    
    try {
      setIsDeleting(true);
      const data = {
      
     
        api_key:   keyToDelete.apikey
      };
      
      const response = await makeApiRequest('/api/apikey/delete', 'post', data);
      
      if (response && response.success) {
        // Remove the deleted key from the list
        setApiKeys(apiKeys.filter(key => (key.id || key.api_key_id) !== (keyToDelete.id || keyToDelete.api_key_id)));
        closeDeleteModal();
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
      setError("Failed to delete API key. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date from Unix timestamp
  const formatDate = (timestamp) => {
    // Check if timestamp is in seconds (Unix standard) and convert to milliseconds if needed
    const timeMs = String(timestamp).length <= 10 ? timestamp * 1000 : timestamp;
    return new Date(timeMs).toLocaleString();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">API Keys</h2>
        <button 
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          disabled={isLoading}
        >
          Create New API Key
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h3 className="font-semibold mb-3 text-xl">About API Keys</h3>
        
        <div className="text-gray-600 space-y-3 mb-4">
          <p>
            API keys allow you to integrate DeFi Relay payment functionality directly into your applications.
          </p>
          <p>
            With an API key, you can programmatically:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Create and manage invoices</li>
            <li>Generate payment templates</li>
            <li>Query payment statuses</li>
            <li>Track transactions</li>
          </ul>
          <p>
            Keep your API keys secure — they grant access to your DeFi Relay account. Never expose your API keys in client-side code.
          </p>
          <p className="mt-2">
            <a href="/docs/api" className="text-primary hover:text-primary/80 hover:underline">
              Read our API documentation
            </a> to learn how to implement DeFi Relay payments in your applications.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {isCreating && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2">Create New API Key</h3>
          <div className="flex gap-2 mt-2">
            <input 
              type="text" 
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="API Key Name (optional)"
              className="flex-1 p-2 border rounded-md"
              disabled={isLoading}
            />
            <button 
              onClick={createNewApiKey}
              className="px-4 py-2 bg-primary text-white rounded-md"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
            <button 
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading && apiKeys.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Loading API keys...</p>
        </div>
      ) : apiKeys.length > 0 ? (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Key</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {apiKeys.map((key) => (
                <tr key={key.id || key.apikey}>
                  <td className="px-6 py-4 whitespace-nowrap">{key.name || 'Unnamed API Key'}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono">{key.apikey || key.api_key}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(key.created_at)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      className="text-red-600 hover:text-red-900"
                      disabled={isLoading || isDeleting}
                      onClick={() => openDeleteModal(key)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">You don't have any API keys yet</p>
          <button 
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-primary text-white rounded-md"
            disabled={isLoading}
          >
            Create Your First API Key
          </button>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        closeModal={closeDeleteModal} 
        title="Delete API Key"
      >
        <div className="p-4">
          <p className="mb-4">
            Are you sure you want to delete the API key{' '}
            <span className="font-bold">{keyToDelete?.name || 'Unnamed API Key'}</span>?
          </p>
          <p className="mb-4 text-red-600">
            This action cannot be undone. All services using this API key will stop working.
          </p>
          
          {error && (
            <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-800 rounded">
              <p>{error}</p>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="text-gray-500">
              {countdown > 0 ? (
                <span>Delete enabled in {countdown} seconds</span>
              ) : (
                <span>You can now delete this API key</span>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                disabled={isDeleting}
              >
                Cancel
              </button>
              
              <button
                onClick={deleteApiKey}
                className={`px-4 py-2 rounded-md text-white ${
                  countdown > 0 ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={countdown > 0 || isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ApiKeysPage;
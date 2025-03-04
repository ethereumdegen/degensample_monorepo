import React, { useState, useEffect, useContext } from 'react';
import { Web3StoreContext } from '@/stores/stores-context';
import { makeApiRequest } from '@/lib/request-lib';
import { Link } from "react-router-dom";

const WebhooksPage = () => {
  const web3Store = useContext(Web3StoreContext);
  const [webhooks, setWebhooks] = useState([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch current webhook URLs on component mount
  useEffect(() => {
    const fetchWebhookSettings = async () => {
      if (!web3Store.account || !web3Store.authToken) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const data = {
          session_token: web3Store.authToken,
        //  wallet_public_address: web3Store.account,
        };
        
        const response = await makeApiRequest('/api/webhooks/list', 'post', data);
          
        if (response && response.success && response.data && response.data) {
          setWebhooks(response.data);
        }
      } catch (e) {
        console.error('Failed to fetch webhook settings:', e);
        setError('Failed to load webhook settings. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchWebhookSettings();
  }, [web3Store.account, web3Store.authToken]);

  // Save webhook URL
  const saveWebhookUrl = async () => {
    if (!webhookUrl || !webhookUrl.trim()) {
      setError('Please enter a valid webhook URL.');
      return;
    }

    if (!webhookUrl.startsWith('http://') && !webhookUrl.startsWith('https://')) {
      setError('Webhook URL must start with http:// or https://');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const data = {
        session_token: web3Store.authToken,
        wallet_public_address: web3Store.account,
        webhook_url: webhookUrl.trim()
      };
      
      const response = await makeApiRequest('/api/webhooks/create', 'post', data);
      
      if (response && response.success) {
        setSuccessMessage('Webhook URL saved successfully!');
        setWebhookUrl('');
        
        // Refresh the webhook list
        const updatedResponse = await makeApiRequest('/api/webhooks/list', 'post', {
          session_token: web3Store.authToken,
      //    wallet_public_address: web3Store.account,
        });
        
        if (updatedResponse && updatedResponse.success && updatedResponse.data && updatedResponse.data) {
          setWebhooks(updatedResponse.data);
        }
      } else {
        setError(response?.error || 'Failed to save webhook URL.');
      }
    } catch (e) {
      console.error('Error saving webhook URL:', e);
      setError('An error occurred while saving the webhook URL.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete webhook
  const deleteWebhook = async (webhookId) => {
    setIsDeleting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const data = {
        session_token: web3Store.authToken,
  //      wallet_public_address: web3Store.account,
        webhook_url_id: webhookId
      };
      
      const response = await makeApiRequest('/api/webhooks/delete', 'post', data);
      
      if (response && response.success) {
        setSuccessMessage('Webhook URL deleted successfully!');
        
        // Remove the deleted webhook from the list
        setWebhooks([]);
      } else {
        setError(response?.error || 'Failed to delete webhook URL.');
      }
    } catch (e) {
      console.error('Error deleting webhook URL:', e);
      setError('An error occurred while deleting the webhook URL.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Test webhook
  const testWebhook = async (webhookId) => {
    setIsTesting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const data = {
        session_token: web3Store.authToken,
      //  wallet_public_address: web3Store.account,
        webhook_url_id: webhookId
      };
      
      const response = await makeApiRequest('/api/webhooks/test_trigger', 'post', data);
      
      if (response && response.success) {
        setSuccessMessage('Test webhook sent successfully! Check your server logs.');
      } else {
        setError(response?.error || 'Failed to test webhook.');
      }
    } catch (e) {
      console.error('Error testing webhook:', e);
      setError('An error occurred while testing the webhook.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 hidden ">
        <h2 className="text-2xl font-bold">Webhooks</h2>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg mb-6">
          <p>{successMessage}</p>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h3 className="font-semibold mb-4 text-xl">Webhook Configuration</h3>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Set up webhook URLs to receive notifications when payments are made to your invoices. 
            Your server will receive a POST request with payment details whenever a payment is processed.
          </p>
          
          <p className="text-gray-600 mb-4">
            For more information on webhook payload format and implementation, check our 
            <Link to="/docs/webhooks" className="text-primary hover:text-primary/80 hover:underline ml-1">
              webhook documentation
            </Link>.
          </p>
        </div>
        
        {/* Add new webhook */}
        {webhooks.length > 0 ? (
          <div className="mb-8 border-b pb-6">
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg mb-4">
              <p>Only one webhook can be configured per account. You already have a webhook configured.</p>
              <p className="mt-1 text-sm">To add a new webhook URL, please delete your existing webhook first.</p>
            </div>
          </div>
        ) : (
          <div className="mb-8  pb-6">
            <h4 className="font-medium mb-4 text-lg">Add New Webhook</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL
                </label>
                <input
                  type="text"
                  placeholder="https://your-server.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  disabled={isLoading || isSaving}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter the full URL where webhook notifications should be sent
                </p>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button 
                  onClick={saveWebhookUrl}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                  disabled={isLoading || isSaving}
                >
                  {isSaving ? 'Saving...' : 'Add Webhook URL'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* List existing webhooks */}
           {webhooks.length > 0 && (
                <div>
                  <h4 className="font-medium mb-4 text-lg">Active Webhooks</h4>
                  
                  {isLoading ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500">Loading webhooks...</p>
                    </div>
                  ) : webhooks.length === 0 ? (
                    <div className="text-center py-4 border rounded-md bg-gray-50">
                      <p className="text-gray-500">You don't have any webhooks configured yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {webhooks.map((webhook) => (
                        <div key={webhook.id} className="border rounded-md p-4 bg-gray-50">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                            <div className="flex-grow">
                              <p className="font-medium break-all mb-1">{webhook.entry.webhook_url}</p>
                              <p className="text-sm text-gray-500">Created: {new Date(webhook.entry.created_at).toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => testWebhook(webhook.id)}
                                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                                disabled={isTesting}
                              >
                                {isTesting ? 'Testing...' : 'Test Webhook'}
                              </button>
                              <button
                                onClick={() => deleteWebhook(webhook.id)}
                                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                                disabled={isDeleting}
                              >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
               )}
        


      </div>
    </div>
  );
};

export default WebhooksPage;
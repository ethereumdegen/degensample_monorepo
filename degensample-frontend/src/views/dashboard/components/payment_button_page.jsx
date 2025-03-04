import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { observer } from "mobx-react";
import { Web3StoreContext } from '@/stores/stores-context';
import { makeApiRequest } from '@/lib/request-lib';
import { getBackendServerUrl } from '@/lib/app-helper';
import * as LucideIcons from 'lucide-react';

const PaymentButtonPage = () => {
  const { invoice_template_uuid } = useParams();
  const web3Store = useContext(Web3StoreContext);
  const [templateDetails, setTemplateDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [integrationCode, setIntegrationCode] = useState("");
  const scriptLoaded = useRef(false);
  const [buttonStatus, setButtonStatus] = useState('loading');
  
  // Load button.js script and initialize button
  useEffect(() => {
    if (templateDetails && !scriptLoaded.current) {
      // Use local script path for development
      const scriptPath = '/button.js';
      
      const script = document.createElement('script');
      script.src = scriptPath;
      script.async = true;
      
      script.onload = () => {
        console.log('Button script loaded!');
        scriptLoaded.current = true;
        setButtonStatus('loaded');
      };
      
      script.onerror = () => {
        console.error('Failed to load button.js');
        setButtonStatus('error');
      };
      
      document.body.appendChild(script);
      
      // Add success animation when the button initializes
      const buttonCheckInterval = setInterval(() => {
        const buttonContainer = document.querySelector('.payspec-button-container');
        if (buttonContainer) {
          clearInterval(buttonCheckInterval);
          setButtonStatus('initialized');
        }
      }, 500);
      
      return () => {
        // Clean up script and interval when component unmounts
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        clearInterval(buttonCheckInterval);
      };
    }
  }, [templateDetails]);
  
  // Fetch template details
  useEffect(() => {
    const fetchTemplateDetails = async () => {
      if (!web3Store.authToken) {
        setIsLoading(false);
        return;
      }
      
      try {
        const data = {
          session_token: web3Store.authToken,
          template_uuid: invoice_template_uuid
        };
        
        const response = await makeApiRequest('/api/invoice_templates/find_by_uuid', 'get', data);
        
        if (response && response.success && response.data) {
          setTemplateDetails(response.data);
          
          // Generate integration code
          const code = `<script src="https://cdn.payspec.io/button.js"></script>
<div 
  class="payspec-button" 
  data-template-uuid="${invoice_template_uuid}"
  data-button-text="Pay Now"
  data-theme="light"
></div>`;
          
          setIntegrationCode(code);
        } else {
          throw new Error('Failed to fetch template details.');
        }
      } catch (error) {
        console.error('Error fetching template details:', error);
        setError(error.message || 'Failed to load template details.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplateDetails();
  }, [web3Store.authToken, invoice_template_uuid]);
  
  // Helper to truncate Ethereum addresses for display
  const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Function to copy integration code to clipboard
  const copyIntegrationCode = () => {
    navigator.clipboard.writeText(integrationCode)
      .then(() => {
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 3000);
      })
      .catch(err => console.error('Failed to copy code:', err));
  };
  
  const [codeCopied, setCodeCopied] = useState(false);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Embed Payment Button</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Loading template details...</p>
        </div>
      ) : templateDetails ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold mb-4">Button Preview</h3>
            <p className="text-gray-600 mb-6">
              This is how your payment button will appear on your website. When clicked, it will create a unique invoice and prompt the user to make a payment.
            </p>
            
            <div className="p-6 bg-gray-50 rounded-lg border flex justify-center items-center">
              <div className="preview-container" style={{ display: 'flex', justifyContent: 'center', width: '100%', flexDirection: 'column', alignItems: 'center' }}>
                {buttonStatus === 'error' ? (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-4 text-center">
                    <p className="font-semibold">Button script failed to load</p>
                    <p className="text-sm">Please refresh the page to try again</p>
                  </div>
                ) : buttonStatus === 'loading' ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                    <span>Loading payment button...</span>
                  </div>
                ) : null}
                
                {/* This div will be replaced by the button.js script */}
                <div 
                  id="demo-button"
                  className="payspec-button" 
                  data-template-uuid={invoice_template_uuid}
                  data-button-text="Pay Now"
                  data-theme="light"
                  data-customer-address={web3Store.account}
                  data-api-url={getBackendServerUrl()}
                  data-session-token={web3Store.authToken}
                ></div>
                
                {buttonStatus === 'initialized' && (
                  <div className="mt-3 text-sm text-green-600 flex items-center">
                    <LucideIcons.CheckCircleIcon className="w-4 h-4 mr-1" />
                    Button successfully initialized
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8">
              <h4 className="font-semibold mb-2">Template Details</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><span className="font-medium">Template ID:</span> {invoice_template_uuid}</li>
                {templateDetails.token_symbol && (
                  <li><span className="font-medium">Token:</span> {templateDetails.token_symbol} ({truncateAddress(templateDetails.token_address)})</li>
                )}
                <li><span className="font-medium">Recipients:</span> {templateDetails.pay_to_array?.length || 0}</li>
                <li><span className="font-medium">Chain ID:</span> {templateDetails.chain_id}</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold mb-4">Website Integration</h3>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Copy this code and paste it into your website's HTML where you want the payment button to appear.
              </p>
              
              <div className="relative">
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-sm">
                  {integrationCode}
                </pre>
                <button 
                  onClick={copyIntegrationCode}
                  className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-md"
                  title="Copy code"
                >
                  {codeCopied ? (
                    <LucideIcons.CheckIcon className="h-4 w-4 text-green-400" />
                  ) : (
                    <LucideIcons.CopyIcon className="h-4 w-4 text-white" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                <LucideIcons.InfoIcon className="h-5 w-5 mr-2" />
                How This Works
              </h4>
              <p className="text-blue-700 text-sm mb-3">
                When a customer clicks this button on your website:
              </p>
              <ul className="text-blue-700 text-sm space-y-2 list-disc pl-5">
                <li>A unique payable invoice is created from your template</li>
                <li>The customer's web wallet will open to complete the payment</li>
                <li>Once payment is completed, your configured webhook will be triggered</li>
                <li>Payment status can be verified via our API at any time</li>
                <li>The payment ID in the modal links to a hosted payment page for sharing</li>
              </ul>
            </div>
            
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Advanced Customization</h4>
              <p className="text-sm text-gray-600 mb-3">
                You can customize the button by modifying these attributes:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                <li><code className="bg-gray-100 px-1 rounded">data-button-text</code> - Change the button text</li>
                <li><code className="bg-gray-100 px-1 rounded">data-theme</code> - Set to "dark" or "light"</li>
                <li><code className="bg-gray-100 px-1 rounded">data-auto-show</code> - Set to "false" to initialize without showing</li>
                <li><code className="bg-gray-100 px-1 rounded">data-success-url</code> - URL to redirect after successful payment</li>
                <li><code className="bg-gray-100 px-1 rounded">data-customer-address</code> - Pre-set customer wallet address</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Template not found or you do not have access to it.</p>
        </div>
      )}
    </div>
  );
};

export default observer(PaymentButtonPage);
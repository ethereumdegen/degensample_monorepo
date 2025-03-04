import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import * as LucideIcons from 'lucide-react';
import { Web3StoreContext } from '@/stores/stores-context';
import { makeApiRequest } from '@/lib/request-lib';
import defiRelayTools from '@/lib/defi-relay-tools';

/**
 * PaymentButton - A reusable component for handling crypto payments
 * 
 * @param {Object} props
 * @param {string} props.invoiceUuid - UUID of the invoice to pay
 * @param {string} props.buttonText - Default text to show on button (default: "Pay Now")
 * @param {Function} props.onSuccess - Callback when payment succeeds
 * @param {Function} props.onError - Callback when payment fails
 * @param {string} props.className - Additional CSS classes for the button
 * @param {boolean} props.showTransactionLinks - Whether to show transaction links (default: false)
 * @param {Function} props.onStatusChange - Callback with current button status (optional)
 */
const PaymentButton = ({
  invoiceTemplateUuid,
  invoiceUuid,
  buttonText = "Pay Now",
  customerAddress,
  onSuccess,
  onError,
  className = "",
  showTransactionLinks = false,
  onStatusChange
}) => {
  const web3Store = useContext(Web3StoreContext);
  const [purchaseState, setPurchaseState] = useState({
    loading: false,
    error: null,
    success: false,
    txHash: null,
    needsApproval: false,
    approvalTxHash: null,
    approvalComplete: false,
    initialized: false
  });
  const [invoice, setInvoice] = useState(null);
  const [invoiceRawTx, setInvoiceRawTx] = useState(null);

  const [needsApproval, setNeedsApproval] = useState(true); 
  const [requestedAction, setRequestedAction] = useState(false); 

  // Notify parent of status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(purchaseState);
    }
  }, [purchaseState, onStatusChange]);

 

  useEffect(  () => {

     async function performRequestedAction() {

              if (requestedAction) {

                 if ( needsApproval ){


                      await handleApproval();

                      setRequestedAction(false); 

                 }else {


                      await processPayment ();
                     setRequestedAction(false); 


                 } 

              }
    }
    performRequestedAction(); 
   
      
  }, [requestedAction, needsApproval ]);




//always do this 
 /* const doStuff = async () => {


    let  find_invoice_data = {
          uuid: invoiceUuid,
        }; 

     const findInvoiceResponse = await makeApiRequest('/api/invoices/find_by_uuid', 'get', find_invoice_data);
      
      if (!findInvoiceResponse || !findInvoiceResponse.success || !findInvoiceResponse.data || !findInvoiceResponse.data.raw_tx) {
        throw new Error('Failed to find invoice for payment.');
      }

      const invoiceData = findInvoiceResponse.data.invoice;


        const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const needsApproval = await defiRelayTools.checkApprovalNeeded(
        signer,
        invoiceData.token_address,
        invoiceData.contract_address,
        invoiceData.total_amount || ethers.constants.MaxUint256
      );


       setNeedsApproval( needsApproval ) ; 
        setRequestedAction(true); 
      

  }*/

  // Prepare for purchase by fetching invoice
  const prepareForPurchase = async () => {
    // Don't prepare again if already initialized
   // if (purchaseState.initialized) {
  //    return;
  //  }
    
    setPurchaseState(prev => ({ 
      ...prev,
      loading: true, 
      error: null, 
      success: false, 
      txHash: null,
      needsApproval: false,
      approvalTxHash: null,
      approvalComplete: false
    }));
    
    try {
      if (!web3Store.account || !web3Store.authToken) {
        throw new Error('You must connect your wallet to make a payment.');
      }
      
      let find_invoice_data; 

      if (!invoiceUuid) {   //create from template 
        // Fetch invoice details
        const create_invoice_data = {
          template_uuid: invoiceTemplateUuid,
          create_for_address: customerAddress 
        };
        
        const createInvoiceResponse = await makeApiRequest('/api/invoice_templates/find_or_create_invoice_from_template', 'post', create_invoice_data);
        
        if (!createInvoiceResponse || !createInvoiceResponse.success || !createInvoiceResponse.data) {
          throw new Error('Failed to create invoice for payment.');
        }

        const createdInvoiceUuid = createInvoiceResponse.data.uuid; 
        find_invoice_data = {
          uuid: createdInvoiceUuid,
        };
      } else {
        find_invoice_data = {
          uuid: invoiceUuid,
        }; 
      }

      const findInvoiceResponse = await makeApiRequest('/api/invoices/find_by_uuid', 'get', find_invoice_data);
      
      if (!findInvoiceResponse || !findInvoiceResponse.success || !findInvoiceResponse.data || !findInvoiceResponse.data.raw_tx) {
        throw new Error('Failed to find invoice for payment.');
      }

      const invoiceData = findInvoiceResponse.data.invoice;
      setInvoice(invoiceData);

      const invoiceRawTxData = findInvoiceResponse.data.raw_tx;
      setInvoiceRawTx(invoiceRawTxData);
      
      // Initialize Web3 provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Check if approval is needed
      const needsApproval = await defiRelayTools.checkApprovalNeeded(
        signer,
        invoiceData.token_address,
        invoiceData.contract_address,
        invoiceData.total_amount || ethers.constants.MaxUint256
      );
      
      // Set state with approval status
      setPurchaseState(prev => ({ 
        ...prev, 
        loading: false,
        needsApproval,
        initialized: true
      }));

      setNeedsApproval( needsApproval ) ; 
      setRequestedAction(true); 
      
      // Important: Return the needsApproval value so it can be used by the caller
      return needsApproval;
      
    } catch (error) {
      console.error('Error preparing for payment:', error);
      setPurchaseState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to prepare for payment.',
        success: false
      }));
      
      if (onError) {
        onError(error.message || 'Failed to prepare for payment.');
      }
    }
  };

  // Handle token approval
  const handleApproval = async () => {
    if (!invoice) {
      return;
    }
    
    setPurchaseState(prev => ({ ...prev, loading: true }));
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Create approval transaction
      const approvalTx = defiRelayTools.createApprovalTransaction(
        invoice.token_address,
        invoice.contract_address,
        ethers.constants.MaxUint256
      );
      
      // Send approval transaction
      const tx = await signer.sendTransaction(approvalTx);
      
      setPurchaseState(prev => ({ 
        ...prev, 
        loading: true, 
        approvalTxHash: tx.hash 
      }));
      
      // Wait for transaction confirmation
      await tx.wait();
      
      // Update state after approval
      setPurchaseState(prev => ({ 
        ...prev, 
        loading: false, 
        needsApproval: false,
        approvalComplete: true
      }));
      
    } catch (error) {
      console.error('Error approving token:', error);
      setPurchaseState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to approve token. Please try again.'
      }));
      
      if (onError) {
        onError(error.message || 'Failed to approve token. Please try again.');
      }
    }
  };

  // Handle the actual payment transaction
  const processPayment = async () => {
    if (!invoice || !invoiceRawTx) {

      console.log("no invoice ! cannot process ");
      return;
    }
    
    setPurchaseState(prev => ({ ...prev, loading: true }));
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Format the transaction data
      const txData = defiRelayTools.formatTransactionData(invoiceRawTx);
      
      if (!txData) {
        console.log("No tx data");
        throw new Error('Failed to format transaction data.');
      }

      // Send the transaction
      const tx = await signer.sendTransaction(txData);
      
      setPurchaseState(prev => ({ ...prev, loading: true, txHash: tx.hash }));
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Update status after successful transaction
      setPurchaseState(prev => ({
        ...prev,
        loading: false,
        error: null,
        success: true,
        txHash: tx.hash
      }));
      
      if (onSuccess) {
        onSuccess(tx.hash);
      }
      
    } catch (error) {
      console.error('Error processing payment:', error);
      setPurchaseState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to process payment. Please try again later.',
        success: false
      }));
      
      if (onError) {
        onError(error.message || 'Failed to process payment. Please try again later.');
      }
    }
  };

  // Handle the button click based on current state
  const handleClick = async () => {
    // If not initialized yet, prepare for purchase
    
          const needsApproval = await prepareForPurchase();


         

          console.log("needs approval ", needsApproval);
   




          // If preparation finished and no approval needed, immediately process payment
     /*  if (!needsApproval) {
            // Small delay to let the state update properly
            
            await processPayment ();

          }
          return;
        }else {


            await handleApproval();
        } */
        
    // If needs approval, handle approval
   /* if (purchaseState.needsApproval) {
      await handleApproval();
      return;
    }
    
    // If approval is complete or not needed, process payment
    await processPayment();*/
  };

  // Get the appropriate button text based on state
  const getButtonText = () => {
    if (purchaseState.loading) {
      if (!purchaseState.initialized) {
        return "Preparing...";
      } else if (purchaseState.needsApproval) {
        return "Approving...";
      } else {
        return "Processing Payment...";
      }
    } else if (purchaseState.success) {
      return "Payment Complete";
    } else if (!purchaseState.initialized) {
      return buttonText;
    } else if (purchaseState.needsApproval) {
      return "Approve Token";
    } else if (invoice && invoice.total_amount && invoice.token_symbol) {
      return `Pay ${invoice.total_amount} ${invoice.token_symbol}`;
    } else {
      return buttonText;
    }
  };

  // Get the appropriate icon based on state
  const getButtonIcon = () => {
    if (purchaseState.loading) {
      return <LucideIcons.LoaderIcon className="animate-spin h-4 w-4 mr-2" />;
    } else if (purchaseState.success) {
      return <LucideIcons.CheckIcon className="h-4 w-4 mr-2" />;
    } else if (purchaseState.needsApproval) {
      return <LucideIcons.UnlockIcon className="h-4 w-4 mr-2" />;
    } else {
      return <LucideIcons.ZapIcon className="h-4 w-4 mr-2" />;
    }
  };

  // Transaction links component to show success or approval info
  const TransactionLinks = () => {
    if (!showTransactionLinks) return null;
    
    return (
      <>
        {purchaseState.success && purchaseState.txHash && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl mt-3">
            <p>Payment successful! Your transaction has been confirmed.</p>
            <a 
              href={`https://etherscan.io/tx/${purchaseState.txHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline mt-2 inline-block"
            >
              View Transaction
            </a>
          </div>
        )}
        
        {purchaseState.approvalTxHash && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl mt-3">
            <p>Token approval successful!</p>
            <a 
              href={`https://etherscan.io/tx/${purchaseState.approvalTxHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline mt-2 inline-block"
            >
              View Approval Transaction
            </a>
          </div>
        )}
        
        {purchaseState.error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mt-3">
            <p>{purchaseState.error}</p>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="payment-button-container">
      <button
        onClick={handleClick}
        disabled={purchaseState.loading || purchaseState.success}
        className={`btn-primary flex items-center justify-center ${className}`}
      >
        {getButtonIcon()}
        {getButtonText()}
      </button>
      
      <TransactionLinks />
    </div>
  );
};

export default PaymentButton;
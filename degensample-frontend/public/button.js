/**
 * PaySpec Payment Button
 * 
 * This script creates customizable payment buttons that process crypto payments
 * using the PaySpec API. Include this script on your website to easily 
 * integrate crypto payment functionality.
 * 
 * Usage:
 * 
 * <script src="https://cdn.payspec.io/button.js"></script>
 * <div 
 *   class="payspec-button" 
 *   data-template-uuid="your-template-uuid-here"
 *   data-button-text="Pay Now"
 *   data-theme="light"
 * ></div>
 */

(function() {
  // Configuration
  // Allow overriding API URL from data attributes, or default to production
  const getApiBaseUrl = () => {
    // First check if there's a button on the page with an API URL override
    const buttonEl = document.querySelector('.payspec-button');
    if (buttonEl && buttonEl.getAttribute('data-api-url')) {
      let url = buttonEl.getAttribute('data-api-url');
      
      // Ensure URL doesn't end with a slash
      if (url.endsWith('/')) {
        url = url.slice(0, -1);
      }
      
      // Check if URL is valid
      try {
        // This will throw if invalid
        new URL(url);
        console.log('✅ Using API URL from data attribute:', url);
        return url;
      } catch (e) {
        console.error('❌ Invalid API URL provided:', url, e);
        // Continue to fallbacks if URL is invalid
      }
    }
    
    // Check if we're on localhost/development environment
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Try port 8080 first for local development (typical backend port)
      const localBackendUrl = `${window.location.protocol}//${window.location.hostname}:8080`;
      console.log('🔄 Using local development backend URL:', localBackendUrl);
      return localBackendUrl;
    }
    
    // Default to production
    console.log('🌐 Using production API URL');
    return 'https://api.defirelay.com';
  };
  
  const API_BASE_URL = getApiBaseUrl();
  const APP_BASE_URL = 'https://defirelay.com'; // Production app URL
  
  // CSS styles for the button and modal
  const STYLES = `
    .payspec-button-container {
      display: inline-block;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    }
    
    .payspec-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 120px;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      border: none;
      outline: none;
    }
    
    .payspec-button.light {
      background-color: #5469d4;
      color: white;
    }
    
    .payspec-button.light:hover {
      background-color: #4a5dc7;
    }
    
    .payspec-button.dark {
      background-color: #7b66ff;
      color: white;
    }
    
    .payspec-button.dark:hover {
      background-color: #6a58e8;
    }
    
    .payspec-button-icon {
      margin-right: 8px;
      width: 18px;
      height: 18px;
    }
    
    .payspec-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .payspec-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
    
    .payspec-modal {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      width: 90%;
      max-width: 500px;
      overflow: hidden;
    }
    
    .payspec-modal-header {
      padding: 16px 24px;
      border-bottom: 1px solid #eaeaea;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .payspec-modal-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }
    
    .payspec-modal-close {
      background: none;
      border: none;
      cursor: pointer;
      color: #888;
      font-size: 22px;
      padding: 0;
      line-height: 1;
    }
    
    .payspec-modal-body {
      padding: 24px;
    }
    
    .payspec-modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #eaeaea;
      display: flex;
      justify-content: flex-end;
    }
    
    .payspec-payment-info {
      margin-bottom: 16px;
    }
    
    .payspec-payment-info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    
    .payspec-payment-label {
      font-weight: 500;
      color: #666;
    }
    
    .payspec-payment-value {
      font-weight: 600;
      color: #333;
    }
    
    .payspec-status-message {
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      font-size: 14px;
      line-height: 1.4;
    }
    
    .payspec-status-message.info {
      background-color: #e8f4fd;
      color: #1e429f;
    }
    
    .payspec-status-message.success {
      background-color: #e6f7ef;
      color: #0d6e3f;
    }
    
    .payspec-status-message.error {
      background-color: #fae9e8;
      color: #c53030;
    }
    
    .payspec-loader {
      display: inline-block;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #5469d4;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      animation: payspec-spin 1s linear infinite;
      margin-right: 8px;
    }
    
    @keyframes payspec-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  
  // SVG icons used in the button and modal
  const ICONS = {
    zap: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
    wallet: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>'
  };
  
  // States for the payment flow
  const PAYMENT_STATES = {
    INITIAL: 'initial',
    CREATING_INVOICE: 'creating_invoice',
    WAITING_FOR_WALLET: 'waiting_for_wallet',
    PROCESSING_PAYMENT: 'processing_payment',
    COMPLETED: 'completed',
    ERROR: 'error'
  };
  
  /**
   * Initialize the PaySpec button for all matching elements on the page
   */
  function initPaySpecButtons() {
    // Add styles to the document
    addStyles();
    
    // Find all button containers
    const buttonElements = document.querySelectorAll('.payspec-button');
    
    // Initialize each button
    buttonElements.forEach(element => {
      initButton(element);
    });
  }
  
  /**
   * Add the CSS styles to the document head
   */
  function addStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = STYLES;
    document.head.appendChild(styleElement);
  }
  
  /**
   * Initialize a single PaySpec button
   */
  function initButton(element) {
    // Get configuration from data attributes
    const config = {
      templateUuid: element.getAttribute('data-template-uuid'),
      buttonText: element.getAttribute('data-button-text') || 'Pay Now',
      theme: element.getAttribute('data-theme') || 'light',
      autoShow: element.getAttribute('data-auto-show') !== 'false',
      successUrl: element.getAttribute('data-success-url') || null,
      customerAddress: element.getAttribute('data-customer-address') || null
    };
    
    // Validate required configuration
    if (!config.templateUuid) {
      console.error('PaySpec Button Error: data-template-uuid is required');
      return;
    }
    
    // Create button container
    const container = document.createElement('div');
    container.className = 'payspec-button-container';
    
    // Create the button
    const button = document.createElement('button');
    button.className = `payspec-button ${config.theme}`;
    button.innerHTML = `
      <span class="payspec-button-icon">${ICONS.zap}</span>
      <span>${config.buttonText}</span>
    `;
    
    // Add the button to the container
    container.appendChild(button);
    
    // Replace the original element with our container
    element.parentNode.replaceChild(container, element);
    
    // Initialize payment handler
    const paymentHandler = new PaymentHandler(config);
    
    // Add click event listener
    button.addEventListener('click', () => {
      paymentHandler.startPayment();
    });
    
    // Auto-show if configured
    if (config.autoShow) {
      // Store reference to the button element
      paymentHandler.buttonElement = button;
    }
  }
  
  /**
   * Payment handler class to manage the payment flow
   */
  class PaymentHandler {
    constructor(config) {
      this.config = config;
      this.state = PAYMENT_STATES.INITIAL;
      this.invoice = null;
      this.rawTx = null;
      this.txHash = null;
      this.buttonElement = null;
      this.modalElement = null;
    }
    
    /**
     * Start the payment process
     */
    async startPayment() {
      // Create and show modal
      this.createModal();
      this.showModal();
      
      try {
        // Update state
        this.updateState(PAYMENT_STATES.CREATING_INVOICE);
        
        // Get or create invoice from template
        await this.createInvoice();
        
        // Verify ethers.js is loaded
        if (!window.ethers) {
          throw new Error('Unable to load ethers.js library. Please refresh the page and try again.');
        }
        
        // Check if web3 is available
        if (!window.ethereum) {
          const errorMessage = this.getMissingWalletMessage();
          throw new Error(errorMessage);
        }
        
        // Request account access
        this.updateState(PAYMENT_STATES.WAITING_FOR_WALLET);
        await this.connectWallet();
        
        // Process payment
        this.updateState(PAYMENT_STATES.PROCESSING_PAYMENT);
        await this.processPayment();
        
        // Handle success
        this.updateState(PAYMENT_STATES.COMPLETED);
        
        // Redirect if success URL is provided
        if (this.config.successUrl) {
          setTimeout(() => {
            window.location.href = this.config.successUrl;
          }, 2000);
        }
      } catch (error) {
        console.error('PaySpec payment error:', error);
        this.updateState(PAYMENT_STATES.ERROR, error.message);
      }
    }
    
    /**
     * Get a helpful message for users without a web3 wallet
     */
    getMissingWalletMessage() {
      // Check if on mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        return 'No Ethereum wallet detected. Please open this page in a wallet app like MetaMask, Trust Wallet, or Coinbase Wallet.';
      } else {
        return 'No Ethereum wallet detected. Please install MetaMask or another web3 browser extension to make payments.';
      }
    }
    
    /**
     * Create invoice from template
     */
    async createInvoice() {
      try {
        console.log('Creating invoice for template:', this.config.templateUuid);
        
        // For debugging
        console.log('API URL:', API_BASE_URL);
        
        // Create request body for POST
        const requestData = {
          template_uuid: this.config.templateUuid
        };
        
        // Add customer address if provided
        if (this.config.customerAddress) {
          requestData.create_for_address = this.config.customerAddress;
        }
        
        // Add session token if available
        const buttonEl = document.querySelector('.payspec-button');
        if (buttonEl && buttonEl.getAttribute('data-session-token')) {
          requestData.session_token = buttonEl.getAttribute('data-session-token');
        }
        
        // This endpoint accepts POST method
        const response = await fetch(`${API_BASE_URL}/api/invoice_templates/find_or_create_invoice_from_template`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });
        
        // Check for HTTP errors
        if (!response.ok) {
          console.error('API Error:', response.status, response.statusText);
          
          // Try to get more details from response
          let errorText = '';
          try {
            errorText = await response.text();
            console.error('Error response:', errorText);
          } catch (e) {
            // Ignore text parsing errors
          }
          
          throw new Error(`Failed to create invoice: ${response.status} ${response.statusText}`);
        }
        
        // Parse the JSON carefully
        let responseText;
        try {
          responseText = await response.text();
          console.log('Raw response:', responseText.substring(0, 200) + '...');
          
          // Parse the text to JSON
          const data = JSON.parse(responseText);
          
          if (!data.success || !data.data) {
            throw new Error(data.message || 'Failed to create invoice - invalid response');
          }
          
          // Store the invoice UUID
          const invoiceUuid = data.data.uuid;
          console.log('Created invoice:', invoiceUuid);
          
          // Fetch the raw transaction data
          await this.fetchInvoiceDetails(invoiceUuid);
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError);
          console.error('Response text:', responseText ? responseText.substring(0, 200) + '...' : 'empty');
          throw new Error('Failed to parse API response. Please try again later.');
        }
      } catch (error) {
        console.error('Error creating invoice:', error);
        throw new Error(`Failed to create invoice: ${error.message}`);
      }
    }
    
    /**
     * Fetch invoice details including raw transaction data
     */
    async fetchInvoiceDetails(invoiceUuid) {
      try {
        console.log('Fetching invoice details for:', invoiceUuid);
        
        // Create URL parameters for GET request
        const params = new URLSearchParams();
        params.append('uuid', invoiceUuid);
        
        // Add session token if available
        const buttonEl = document.querySelector('.payspec-button');
        if (buttonEl && buttonEl.getAttribute('data-session-token')) {
          params.append('session_token', buttonEl.getAttribute('data-session-token'));
        }
        
        // Using GET as specified by the API
        const response = await fetch(`${API_BASE_URL}/api/invoices/find_by_uuid?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        // Check for HTTP errors
        if (!response.ok) {
          console.error('API Error:', response.status, response.statusText);
          
          // Try to get more details from response
          let errorText = '';
          try {
            errorText = await response.text();
            console.error('Error response:', errorText);
          } catch (e) {
            // Ignore text parsing errors
          }
          
          throw new Error(`Failed to fetch invoice details: ${response.status} ${response.statusText}`);
        }
        
        // Parse the JSON carefully
        let responseText;
        try {
          responseText = await response.text();
          console.log('Raw invoice response:', responseText.substring(0, 200) + '...');
          
          // Parse the text to JSON
          const data = JSON.parse(responseText);
          
          if (!data.success || !data.data || !data.data.raw_tx) {
            throw new Error(data.message || 'Failed to fetch invoice details - invalid response');
          }
          
          this.invoice = data.data.invoice;
          this.rawTx = data.data.raw_tx;
          
          console.log('Invoice details loaded successfully');
          
          // Update the modal with invoice details
          this.updateModalWithInvoiceDetails();
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError);
          console.error('Response text:', responseText ? responseText.substring(0, 200) + '...' : 'empty');
          throw new Error('Failed to parse API response for invoice details');
        }
      } catch (error) {
        console.error('Error fetching invoice details:', error);
        throw new Error(`Failed to fetch invoice details: ${error.message}`);
      }
    }
    
    /**
     * Connect to the user's wallet
     */
    async connectWallet() {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (!accounts || accounts.length === 0) {
          throw new Error('No Ethereum accounts found. Please check your wallet and try again.');
        }
        
        this.account = accounts[0];
        
        // Check if we're on the right network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const requiredChainId = parseInt(this.invoice.chain_id, 10);
        
        if (parseInt(chainId, 16) !== requiredChainId) {
          // Request network switch
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${requiredChainId.toString(16)}` }]
            });
          } catch (switchError) {
            // Network not added to MetaMask, can't proceed
            throw new Error(`Please switch your wallet to the required network (Chain ID: ${requiredChainId})`);
          }
        }
      } catch (error) {
        console.error('Error connecting to wallet:', error);
        throw new Error('Failed to connect to your wallet. Please try again.');
      }
    }
    
    /**
     * Process the payment transaction
     */
    async processPayment() {
      try {
        // Format the transaction data
        const txData =  this.formatTransactionData(this.rawTx);
        
        if (!txData) {
          throw new Error('Failed to format transaction data');
        }
        
        // Send the transaction
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        const tx = await signer.sendTransaction(txData);
        this.txHash = tx.hash;
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        
        if (receipt.status !== 1) {
          throw new Error('Transaction failed');
        }
        
        return receipt;
      } catch (error) {
        console.error('Error processing payment:', error);
        throw new Error('Failed to process payment. Please try again later.');
      }
    }
    
    /**
     * Format the raw transaction data
     */
    formatTransactionData(rawTx) {
      try {
        if (!rawTx) return null;
        
        // Parse the raw transaction JSON
        const txData = typeof rawTx === 'string' ? JSON.parse(rawTx) : rawTx;
        
        // Format the transaction data for sending
        return {
          to: txData.to,
          data: txData.data,
          value: txData.value || '0x0',
          gasLimit: txData.gasLimit || undefined
        };
      } catch (error) {
        console.error('Error formatting transaction data:', error);
        return null;
      }
    }
    
    /**
     * Create the payment modal
     */
    createModal() {
      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = 'payspec-modal-overlay';
      
      // Create modal
      const modal = document.createElement('div');
      modal.className = 'payspec-modal';
      
      // Create modal header
      const header = document.createElement('div');
      header.className = 'payspec-modal-header';
      header.innerHTML = `
        <h3 class="payspec-modal-title">Complete Payment</h3>
        <button class="payspec-modal-close">&times;</button>
      `;
      
      // Create modal body
      const body = document.createElement('div');
      body.className = 'payspec-modal-body';
      body.innerHTML = `
        <div class="payspec-status-message info">
          Initializing payment...
        </div>
        <div class="payspec-payment-info" style="display:none;"></div>
      `;
      
      // Create modal footer
      const footer = document.createElement('div');
      footer.className = 'payspec-modal-footer';
      
      // Assemble modal
      modal.appendChild(header);
      modal.appendChild(body);
      modal.appendChild(footer);
      overlay.appendChild(modal);
      
      // Add close button event
      const closeButton = header.querySelector('.payspec-modal-close');
      closeButton.addEventListener('click', () => {
        this.hideModal();
      });
      
      // Store modal element
      this.modalElement = overlay;
    }
    
    /**
     * Show the payment modal
     */
    showModal() {
      if (this.modalElement) {
        document.body.appendChild(this.modalElement);
      }
    }
    
    /**
     * Hide the payment modal
     */
    hideModal() {
      if (this.modalElement && this.modalElement.parentNode) {
        this.modalElement.parentNode.removeChild(this.modalElement);
      }
    }
    
    /**
     * Update the modal with invoice details
     */
    updateModalWithInvoiceDetails() {
      if (!this.modalElement || !this.invoice) return;
      
      const paymentInfo = this.modalElement.querySelector('.payspec-payment-info');
      if (paymentInfo) {
        paymentInfo.style.display = 'block';
        
        console.log('Invoice for display:', this.invoice);
        
        // Get token decimals - default to 18 if not available
        const tokenDecimals = this.invoice.token_decimals || 
                             (this.invoice.token && this.invoice.token.decimals) || 18;
        
        // Get token symbol
        const tokenSymbol = this.invoice.token_symbol || 
                           (this.invoice.token && this.invoice.token.symbol) || '';
        
        // Format amount for display
        const amount = this.formatAmount(this.invoice.total_amount, tokenDecimals);
        
        paymentInfo.innerHTML = `
          <div class="payspec-payment-info-row">
            <span class="payspec-payment-label">Amount:</span>
            <span class="payspec-payment-value">${amount} ${tokenSymbol}</span>
          </div>
          <div class="payspec-payment-info-row">
            <span class="payspec-payment-label">Payment ID:</span>
            <span class="payspec-payment-value">
              <a href="https://defirelay.com/invoices/pay/${this.invoice.uuid}" target="_blank">
                ${this.truncateUuid(this.invoice.uuid)}
              </a>
            </span>
          </div>
        `;
      }
    }
    
    /**
     * Update the payment state and modal UI
     */
    updateState(newState, errorMessage = null) {
      this.state = newState;
      
      // Update UI based on state
      if (this.modalElement) {
        const statusMessage = this.modalElement.querySelector('.payspec-status-message');
        
        if (statusMessage) {
          // Remove existing status classes
          statusMessage.classList.remove('info', 'success', 'error');
          
          // Update message and status class based on state
          switch (newState) {
            case PAYMENT_STATES.CREATING_INVOICE:
              statusMessage.textContent = 'Creating your invoice...';
              statusMessage.classList.add('info');
              break;
              
            case PAYMENT_STATES.WAITING_FOR_WALLET:
              statusMessage.innerHTML = '<div class="payspec-loader"></div> Please connect your wallet to continue';
              statusMessage.classList.add('info');
              break;
              
            case PAYMENT_STATES.PROCESSING_PAYMENT:
              statusMessage.innerHTML = '<div class="payspec-loader"></div> Processing your payment...';
              statusMessage.classList.add('info');
              break;
              
            case PAYMENT_STATES.COMPLETED:
              statusMessage.textContent = 'Payment successful! Thank you for your payment.';
              statusMessage.classList.add('success');
              
              // Add transaction link if available
              if (this.txHash) {
                const chainId = parseInt(this.invoice.chain_id, 10);
                const explorerUrl = this.getBlockExplorerUrl(chainId, this.txHash);
                
                if (explorerUrl) {
                  statusMessage.innerHTML += `
                    <div style="margin-top: 10px;">
                      <a href="${explorerUrl}" target="_blank" rel="noopener noreferrer" 
                         style="color: inherit; text-decoration: underline;">
                        View Transaction
                      </a>
                    </div>
                  `;
                }
              }
              break;
              
            case PAYMENT_STATES.ERROR:
              statusMessage.textContent = errorMessage || 'An error occurred during payment. Please try again.';
              statusMessage.classList.add('error');
              break;
          }
        }
        
        // Update footer buttons based on state
        const footer = this.modalElement.querySelector('.payspec-modal-footer');
        
        if (footer) {
          // Clear existing buttons
          footer.innerHTML = '';
          
          // Add appropriate buttons based on state
          if (newState === PAYMENT_STATES.ERROR) {
            const tryAgainButton = document.createElement('button');
            tryAgainButton.className = 'payspec-button light';
            tryAgainButton.textContent = 'Try Again';
            tryAgainButton.addEventListener('click', () => {
              this.hideModal();
              setTimeout(() => this.startPayment(), 100);
            });
            footer.appendChild(tryAgainButton);
          } else if (newState === PAYMENT_STATES.COMPLETED) {
            const closeButton = document.createElement('button');
            closeButton.className = 'payspec-button light';
            closeButton.textContent = 'Close';
            closeButton.addEventListener('click', () => {
              this.hideModal();
            });
            footer.appendChild(closeButton);
          }
        }
      }
      
      // Disable the button during processing states
      if (this.buttonElement) {
        const isProcessing = [
          PAYMENT_STATES.CREATING_INVOICE,
          PAYMENT_STATES.WAITING_FOR_WALLET,
          PAYMENT_STATES.PROCESSING_PAYMENT
        ].includes(newState);
        
        this.buttonElement.disabled = isProcessing;
      }
    }
    
    /**
     * Helper to format token amounts based on decimals
     */
    formatAmount(rawAmount, decimals = 18) {
      if (!rawAmount) return '0';
      
      try {
        // Parse the raw amount
        const amount = parseFloat(rawAmount);
        if (isNaN(amount)) return '0';
        
        // Convert based on decimals
        const humanReadable = amount / Math.pow(10, decimals);
        
        // Format with appropriate precision
        return humanReadable.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 6
        });
      } catch (e) {
        console.error('Error formatting amount:', e);
        return rawAmount;
      }
    }
    
    /**
     * Helper to truncate UUIDs for display
     */
    truncateUuid(uuid) {
      if (!uuid) return '';
      if (uuid.length <= 12) return uuid;
      return `${uuid.substring(0, 6)}...${uuid.substring(uuid.length - 6)}`;
    }
    
    /**
     * Get block explorer URL for a given chain ID and transaction hash
     */
    getBlockExplorerUrl(chainId, txHash) {
      if (!txHash) return null;
      
      // Map of chain IDs to block explorer URLs
      const explorers = {
        1: 'https://etherscan.io/tx/',
        5: 'https://goerli.etherscan.io/tx/',
        137: 'https://polygonscan.com/tx/',
        80001: 'https://mumbai.polygonscan.com/tx/',
        42161: 'https://arbiscan.io/tx/',
        421613: 'https://goerli.arbiscan.io/tx/',
        10: 'https://optimistic.etherscan.io/tx/',
        420: 'https://goerli-optimism.etherscan.io/tx/',
        56: 'https://bscscan.com/tx/',
        97: 'https://testnet.bscscan.com/tx/',
        43114: 'https://snowtrace.io/tx/',
        43113: 'https://testnet.snowtrace.io/tx/',
        250: 'https://ftmscan.com/tx/',
        4002: 'https://testnet.ftmscan.com/tx/',
        8453: 'https://basescan.org/tx/'
      };
      
      // Return the explorer URL if available, or null
      return explorers[chainId] ? `${explorers[chainId]}${txHash}` : null;
    }
  }
  
  // Make sure ethers.js is loaded
  function loadEthers() {
    return new Promise((resolve, reject) => {
      // Check if ethers is already loaded
      if (window.ethers) {
        resolve();
        return;
      }
      
      // Try multiple CDNs to increase reliability
      const cdnUrls = [
        'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js',
        'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js',
        'https://cdn.ethers.io/lib/ethers-5.7.umd.min.js'
      ];
      
      let loadAttempt = 0;
      
      const tryLoadScript = () => {
        if (loadAttempt >= cdnUrls.length) {
          reject(new Error('Failed to load ethers.js from all CDNs'));
          return;
        }
        
        // Remove any previous failed script
        const oldScript = document.getElementById('payspec-ethers-script');
        if (oldScript) {
          oldScript.parentNode.removeChild(oldScript);
        }
        
        // Try the next CDN
        const script = document.createElement('script');
        script.id = 'payspec-ethers-script';
        script.src = cdnUrls[loadAttempt];
        script.type = 'text/javascript';
        script.async = true;
        
        script.onload = () => {
          console.log(`Loaded ethers.js from ${cdnUrls[loadAttempt]}`);
          resolve();
        };
        
        script.onerror = () => {
          console.warn(`Failed to load ethers.js from ${cdnUrls[loadAttempt]}`);
          loadAttempt++;
          setTimeout(tryLoadScript, 200);
        };
        
        document.head.appendChild(script);
      };
      
      tryLoadScript();
    });
  }
  
  // Initialize the script when the DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadEthers().then(initPaySpecButtons).catch(console.error);
    });
  } else {
    loadEthers().then(initPaySpecButtons).catch(console.error);
  }
})();
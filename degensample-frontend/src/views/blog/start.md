
# Getting Started with DefiRelay

## Overview

DefiRelay is a comprehensive payment solution for Ethereum and EVM-compatible blockchains, designed to simplify payment processing for your business. This guide will walk you through the essential steps to set up your account and start accepting crypto payments.

## Prerequisites

- An Ethereum wallet (MetaMask, WalletConnect, or similar)
- Basic understanding of blockchain transactions
- A web server to handle webhook notifications (optional)

## Step 1: Create Your DefiRelay Account

1. Visit the [DefiRelay Dashboard](https://app.defirelay.com/dashboard)
2. Click "Connect Wallet" in the top right corner
3. Select your preferred wallet provider and complete the connection
4. Sign the authentication message to verify your ownership of the wallet

> **Security Tip**: Consider creating a dedicated Ethereum address for your DefiRelay account rather than using your primary wallet address.

## Step 2: Set Up Your API Keys

API keys allow your applications to securely communicate with the DefiRelay service.

1. Navigate to the **API Keys** tab in the dashboard sidebar
2. Click "Create New API Key"
3. Enter a descriptive name for your key (e.g., "Production Server" or "Development Environment")
4. Copy and securely store the generated API key and secret
   - Note: The secret will only be shown once for security reasons

```javascript
// Example of securing your API key in a Node.js application
// Store in environment variables, not in your code
require('dotenv').config();

const apiKey = process.env.DEFIRELAY_API_KEY;
const apiSecret = process.env.DEFIRELAY_API_SECRET;
```

## Step 3: Configure Your Webhook (Optional)

Setting up a webhook allows DefiRelay to notify your server automatically when payments are received.

1. Go to the **Webhooks** tab in the dashboard
2. Enter the URL of your webhook endpoint (e.g., `https://your-domain.com/payment-webhooks`)
3. Click "Save Webhook URL"

For detailed information on webhook payloads and implementation, see our [Webhooks Documentation](/docs/webhooks).

## Step 4: Create Your First Invoice

Invoices can be created either through the dashboard UI or via API calls.

### Using the Dashboard:

1. Navigate to the **Invoices** tab
2. Click "Create New Invoice"
3. Select the token you wish to receive (ETH, USDC, etc.)
4. Enter recipient address(es) and corresponding amounts
5. Click "Create Invoice"

### Using the API:

```javascript
const axios = require('axios');

async function createInvoice() {
  const response = await axios.post('https://api.defirelay.com/api/invoices/create', {
    session_token: 'your_auth_token',
    wallet_public_address: '0xYourWalletAddress',
    token_address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC on Ethereum
    pay_to_array: ['0xRecipientAddress'],
    pay_to_amounts: ['100'],   // Amount in token units
    chain_id: 1                // Ethereum Mainnet
  }, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.data;
}
```

The API response will include:
- A unique invoice UUID
- Raw transaction data that your customer needs to submit
- A payment URL that you can share directly with customers

## Step 5: Present the Payment Option to Your Customer

There are several ways to allow your customers to pay an invoice:

1. **Direct URL**: Share the payment URL with your customer
   ```
   https://app.defirelay.com/invoices/pay/{invoice_uuid}
   ```

2. **Embed a Payment Button**: Add a "Pay with Crypto" button to your checkout page
   ```html
   <script src="https://cdn.defirelay.com/js/payment-button.js"></script>
   <div id="defirelay-payment" data-invoice-id="{invoice_uuid}"></div>
   ```

3. **Custom Integration**: Build your own payment UI using the raw transaction data

## Step 6: Monitor Payments

After creating invoices, you can track their payment status through:

1. **Webhooks**: Receive real-time notifications when payments are made
2. **Dashboard**: View all invoices and their statuses in the DefiRelay dashboard
3. **API Polling**: Query the API periodically to check payment status

```javascript
async function checkInvoiceStatus(invoiceUuid) {
  const response = await axios.post('https://api.defirelay.com/api/invoices/status', {
    session_token: 'your_auth_token',
    invoice_uuid: invoiceUuid
  }, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.data;
}
```

## Next Steps

- [Payment Processing Guide](/docs/payments) - Learn more about payment workflows and token options
- [Webhooks Integration](/docs/webhooks) - Set up real-time payment notifications
- [API Reference](https://api.defirelay.com/docs) - Explore the complete API functionality

For any questions or support, reach out to our team at support@defirelay.com.

# Payment Processing with DefiRelay

## Overview

DefiRelay provides a robust payment processing infrastructure that enables businesses to accept cryptocurrency payments with the reliability and features expected from traditional payment processors. This guide explains how payments work in DefiRelay and how to implement various payment flows.

## How DefiRelay Payments Work

### The PaySpec Protocol

At its core, DefiRelay leverages a smart contract-based protocol called "PaySpec" that adds several critical features to blockchain payments:

1. **Invoice Identification**: Each payment is associated with a unique invoice ID (UUID), which prevents double payments and improves reconciliation.

2. **Multi-Recipient Support**: Payments can be distributed to multiple addresses in a single transaction, reducing gas costs and simplifying complex payment splits.

3. **Blockchain-Verified Receipts**: All payment details are recorded on-chain, providing immutable proof of payment.

### Payment Flow

![Payment Flow Diagram](https://assets.defirelay.com/docs/payment-flow.png)

1. **Invoice Creation**: A merchant creates an invoice with recipient address(es), token type, and amount
2. **Payment Initialization**: Customer receives invoice details and transaction data
3. **Transaction Submission**: Customer submits the transaction to the blockchain via their wallet
4. **On-chain Verification**: The PaySpec smart contract validates and processes the payment
5. **Payment Confirmation**: DefiRelay detects the on-chain event and notifies the merchant

## Supported Tokens and Networks

DefiRelay currently supports the following networks and tokens:

### Ethereum Mainnet (Chain ID: 1)
- ETH (Native)
- USDC (0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
- USDT (0xdac17f958d2ee523a2206206994597c13d831ec7)
- DAI (0x6b175474e89094c44da98b954eedeac495271d0f)
- WETH (0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2)

### Base (Chain ID: 8453)
- ETH (Native)
- USDbC (0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca)
- WETH (0x4200000000000000000000000000000000000006)
- DAI (0x50c5725949a6f0c72e6c4a641f24049a917db0cb)

Custom token integrations are available upon request.

## Implementation Guide

### Creating Invoices

Invoices can be created through the Dashboard UI or programmatically via API:

```javascript
// Example API request to create an invoice
const invoiceData = {
  session_token: 'your_auth_token',
  wallet_public_address: '0xYourMerchantAddress',
  token_address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  pay_to_array: [
    '0xRecipient1Address',
    '0xRecipient2Address'
  ],
  pay_to_amounts: [
    '80',  // 80% to first recipient
    '20'   // 20% to second recipient
  ],
  chain_id: 1  // Ethereum Mainnet
};

const response = await api.post('/invoices/create', invoiceData);
```

### Payment Options for Customers

#### 1. Direct Payment URL

The simplest integration is to redirect customers to the DefiRelay payment page:

```
https://app.defirelay.com/invoices/pay/{invoice_uuid}
```

#### 2. Embedded Payment Button

For a seamless checkout experience, use our JavaScript SDK:

```html
<!-- Add to your checkout page -->
<script src="https://cdn.defirelay.com/js/payment-sdk.js"></script>

<div id="payment-container"></div>

<script>
  const defirelay = new DefirelayPayment({
    invoiceId: 'invoice_uuid',
    onSuccess: (transactionHash) => {
      console.log('Payment successful!', transactionHash);
      // Redirect to success page or update UI
    },
    onError: (error) => {
      console.error('Payment failed:', error);
    }
  });
  
  defirelay.mount('#payment-container');
</script>
```

#### 3. Custom Implementation

For full control over the UI/UX, you can use the raw transaction data:

```javascript
// Example of custom payment flow
async function processPayment(invoiceData, userWallet) {
  try {
    // Send transaction using web3.js, ethers.js or similar library
    const txHash = await userWallet.sendTransaction({
      to: invoiceData.contract_address,
      data: invoiceData.input_data,
      value: invoiceData.is_native_token ? invoiceData.total_amount : '0'
    });
    
    return {
      success: true,
      transactionHash: txHash
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

## Payment Verification

### Event-Based (Recommended)

Configure webhooks to receive real-time notifications when payments are completed:

```javascript
// Example Express.js webhook handler
app.post('/payment-webhook', (req, res) => {
  const event = req.body;
  
  if (event.event_type === 'payment_received') {
    const payment = event.data;
    
    // Update order status in your database
    updateOrderStatus(payment.invoice_uuid, 'paid');
    
    // Fulfill digital product, start shipping process, etc.
    fulfillOrder(payment.invoice_uuid);
  }
  
  res.status(200).send('Webhook received');
});
```

### Polling (Alternative)

For scenarios where webhooks aren't suitable, you can poll the API:

```javascript
async function checkPaymentStatus(invoiceUuid) {
  const response = await api.post('/invoices/status', {
    session_token: 'your_auth_token',
    invoice_uuid: invoiceUuid
  });
  
  return response.data.status; // 'pending', 'paid', or 'expired'
}

// Implement polling with exponential backoff
function pollUntilPaid(invoiceUuid, maxAttempts = 10) {
  let attempts = 0;
  
  const checkStatus = async () => {
    attempts++;
    const status = await checkPaymentStatus(invoiceUuid);
    
    if (status === 'paid') {
      // Payment confirmed - update order status
      return status;
    } else if (status === 'expired' || attempts >= maxAttempts) {
      // Payment failed or timeout reached
      return status;
    } else {
      // Schedule next check with exponential backoff
      const delay = Math.min(2000 * Math.pow(2, attempts), 60000);
      setTimeout(checkStatus, delay);
    }
  };
  
  checkStatus();
}
```

## Advanced Features

### Split Payments

Split payments allow you to distribute funds to multiple recipients in a single transaction:

```javascript
// Example of revenue sharing between platform and seller
const invoiceData = {
  // ... other fields
  pay_to_array: [
    '0xPlatformAddress',  // Platform fee recipient
    '0xSellerAddress'     // Main seller
  ],
  pay_to_amounts: [
    '2.5',               // 2.5% platform fee
    '97.5'               // 97.5% to seller
  ]
};
```

### Payment Expiration

Invoices can be configured to expire after a certain period:

```javascript
const invoiceData = {
  // ... other fields
  expiration_time: 3600  // Expires in 1 hour (seconds)
};
```

### Metadata

Attach custom metadata to invoices for your internal reference:

```javascript
const invoiceData = {
  // ... other fields
  metadata: {
    order_id: '12345',
    customer_id: 'cust_789',
    items: ['product_1', 'product_2']
  }
};
```

## Troubleshooting Common Issues

### Payment Not Detected

If a payment is not being detected:

1. Verify the transaction was confirmed on the blockchain
2. Check the transaction included the correct invoice UUID
3. Confirm the payment amount matches the expected amount
4. Ensure the correct token was used

### Failed Transactions

Common reasons for transaction failures:

1. Insufficient gas
2. User rejected the transaction
3. Token approval not granted (for ERC-20 tokens)
4. Network congestion causing transaction to time out

## Security Considerations

- **API Key Protection**: Store API keys securely and never expose them in client-side code
- **Webhook Verification**: Validate incoming webhook payloads
- **Transaction Validation**: Always verify on-chain that payments meet the expected criteria
- **Double-Payment Prevention**: The PaySpec protocol prevents double payments, but your system should handle this gracefully as well

## Next Steps

- [Button Integration Guide](/integrate) - Detailed guide on embedding payment buttons
- [Webhooks Integration](/docs/webhooks) - Set up real-time payment notifications
- [API Reference](https://api.defirelay.com/docs) - Explore the complete API
- [Smart Contract Documentation](https://github.com/defi-relay/contracts) - Understand the underlying PaySpec protocol
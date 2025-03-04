# Integrating DefiRelay Payment Buttons

## Overview

This guide will show you how to embed DefiRelay payment buttons on your website or application. Payment buttons provide a seamless way for your customers to make cryptocurrency payments using the DefiRelay infrastructure.

## Integration Options

DefiRelay offers several ways to integrate payment buttons:

### 1. Embedded Payment Button (Recommended)

The simplest and fastest way to add payment functionality to your website is using our JavaScript SDK:

```html
<!-- Add the DefiRelay Payment SDK to your page -->
<script src="https://cdn.defirelay.com/js/payment-sdk.js"></script>

<!-- Create a container for the payment button -->
<div id="payment-container"></div>

<script>
  // Initialize the DefiRelay payment button
  const defirelay = new DefirelayPayment({
    invoiceId: 'your_invoice_uuid', // Replace with your actual invoice ID
    onSuccess: (transactionHash) => {
      console.log('Payment successful!', transactionHash);
      // Redirect to success page or update UI
    },
    onError: (error) => {
      console.error('Payment failed:', error);
      // Handle error
    }
  });
  
  // Mount the payment button to your container
  defirelay.mount('#payment-container');
</script>
```

### 2. Custom Implementation

For complete control over the payment flow and UI, you can use our API to get the raw transaction data and implement your own payment button:

```javascript
// Example custom payment button implementation
async function createPaymentButton(invoiceId, buttonElement) {
  // Add event listener to your button
  buttonElement.addEventListener('click', async () => {
    try {
      // Fetch transaction data from DefiRelay API
      const response = await fetch(`https://api.defirelay.com/v1/invoices/transaction/${invoiceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_KEY'
        }
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to get transaction data');
      }
      
      // The raw_tx object contains all the data needed for the transaction
      const rawTx = data.raw_tx;
      
      // Send transaction using the user's web wallet (e.g., with ethers.js)
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Send the transaction
        const tx = await signer.sendTransaction({
          to: rawTx.to,
          data: rawTx.data,
          value: rawTx.value || '0',
          gasLimit: rawTx.gasLimit || undefined
        });
        
        // Handle successful transaction
        console.log('Transaction sent:', tx.hash);
        // Wait for confirmation if needed
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);
        
      } else {
        alert('Please install a Web3 wallet like MetaMask to make payments');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      // Handle error appropriately
    }
  });
}

// Usage
const payButton = document.getElementById('custom-pay-button');
createPaymentButton('your_invoice_uuid', payButton);
```

## The raw_tx Object

When using the custom implementation, the DefiRelay API returns a `raw_tx` object with the following structure:

```javascript
{
  "to": "0x1234567890abcdef1234567890abcdef12345678", // Contract address
  "data": "0x1a2b3c4d...", // Encoded function call data
  "value": "0", // Value in wei (for native token payments)
  "gasLimit": "200000", // Recommended gas limit
  "chainId": 1 // Network chain ID
}
```

This object contains all the information needed to initiate a payment transaction from the customer's web wallet.

## Best Practices

### 1. Error Handling

Always implement comprehensive error handling to provide a good user experience:

```javascript
try {
  // Payment code
} catch (error) {
  if (error.code === 4001) {
    // User rejected transaction
    showMessage('Transaction was cancelled');
  } else if (error.message.includes('insufficient funds')) {
    // Insufficient funds
    showMessage('Insufficient funds for this transaction');
  } else {
    // General error
    showMessage('Payment failed: ' + error.message);
  }
}
```

### 2. Transaction Confirmation

Wait for transaction confirmations before considering a payment complete:

```javascript
// Send transaction
const tx = await signer.sendTransaction(rawTx);

// Show pending status
showMessage('Payment processing...');

// Wait for confirmation (1 block)
const receipt = await tx.wait(1);

// Payment confirmed
showMessage('Payment confirmed!');
```

### 3. Testing

Always test your integration in a staging environment before going to production:

1. Create test invoices on the DefiRelay dashboard
2. Test the full payment flow using test wallets
3. Verify webhook notifications are received correctly

## Customization Options

The DefiRelay payment button can be customized to match your website's design:

```javascript
const defirelay = new DefirelayPayment({
  invoiceId: 'your_invoice_uuid',
  theme: 'dark', // 'light' or 'dark'
  buttonText: 'Complete Purchase', // Custom button text
  buttonColor: '#3d5afe', // Custom button color
  // Other options...
});
```

## Mobile Wallet Support

For mobile applications or PWAs, you can enable deep linking to wallet apps:

```javascript
const defirelay = new DefirelayPayment({
  invoiceId: 'your_invoice_uuid',
  enableWalletDeeplinks: true, // Enable wallet deep links
  preferredWallets: ['metamask', 'coinbase'] // Preferred wallet order
});
```

## Testing Your Integration

To test your integration without making real payments:

1. Use the DefiRelay test environment: `https://test.defirelay.com`
2. Create test invoices on the test dashboard
3. Use a test wallet with test network funds (Sepolia, etc.)

## Next Steps

- [View payment processing details](/docs/payments)
- [Set up webhooks](/docs/webhooks) to receive payment notifications
- [Explore the full API documentation](/docs/api)

## Help and Support

If you encounter any issues with your integration, please contact our support team at support@defirelay.com or join our [Discord community](https://discord.gg/defirelay) for assistance.
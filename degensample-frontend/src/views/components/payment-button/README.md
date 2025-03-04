# PaymentButton Component

A reusable React component for handling crypto payments using DefiRelay.

## Features

- Handles the entire payment flow including token approval and transaction submission
- Customizable button text and appearance
- Optional transaction status UI
- Callback functions for success/error handling
- Supports displaying payment amount and token symbol

## Usage

### Basic Usage

```jsx
import PaymentButton from '@/components/payment-button';

// Inside your component:
<PaymentButton 
  invoiceUuid="0x123..." // Invoice UUID to pay
  buttonText="Pay Now"
/>
```

### Advanced Usage

```jsx
<PaymentButton 
  invoiceUuid="0x123..."
  buttonText="Subscribe Now"
  amount="10"
  tokenSymbol="USDC"
  className="w-full rounded-lg"
  showTransactionLinks={true}
  onSuccess={(txHash) => {
    console.log(`Payment successful with transaction: ${txHash}`);
    // Update your UI or state here
  }}
  onError={(error) => {
    console.error(`Payment failed: ${error}`);
    // Handle errors here
  }}
  onStatusChange={(status) => {
    // Track payment flow status changes
    console.log('Current payment status:', status);
  }}
/>
```

## Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `invoiceUuid` | string | UUID of the invoice to pay (required) | - |
| `buttonText` | string | Default text to show on button | "Pay Now" |
| `amount` | string | Amount to display on button | - |
| `tokenSymbol` | string | Token symbol to display on button | - |
| `onSuccess` | function | Callback when payment succeeds | - |
| `onError` | function | Callback when payment fails | - |
| `className` | string | Additional CSS classes for the button | "" |
| `showTransactionLinks` | boolean | Whether to show transaction links | false |
| `onStatusChange` | function | Callback with current button status | - |

## Embedding Guide

### To embed payment buttons on external websites

You can easily integrate payment buttons on any website with a simple script tag:

```html
<!-- 1. Add the PaySpec button script to your page -->
<script src="https://cdn.payspec.io/button.js"></script>

<!-- 2. Add a payment button element -->
<div 
  class="payspec-button" 
  data-template-uuid="your-template-uuid-here"
  data-button-text="Pay Now"
  data-theme="light"
></div>

<!-- 3. Customize the button with data attributes -->
<div 
  class="payspec-button" 
  data-template-uuid="your-template-uuid-here"
  data-button-text="Subscribe $19.99/month"
  data-theme="dark"
  data-success-url="https://yoursite.com/thank-you"
></div>
```

#### Supported Data Attributes

| Attribute | Description |
|-----------|-------------|
| `data-template-uuid` | (Required) Your invoice template UUID |
| `data-button-text` | Custom text for the button (default: "Pay Now") |
| `data-theme` | Button theme: "light" or "dark" (default: "light") |
| `data-success-url` | URL to redirect after successful payment |
| `data-api-url` | Custom API URL for development (optional) |
| `data-auto-show` | Set to "false" to disable automatic modal display |
| `data-customer-address` | Pre-set customer wallet address (optional) |
| `data-session-token` | Authentication token (if required) |

## Internal Implementation Details

The component handles:
1. Invoice fetching via API
2. Web3 provider connection
3. Token approval if needed
4. Transaction submission and monitoring
5. Status updates and error handling

For server-side rendering or non-React environments, a separate build process will be needed to create a standalone version.
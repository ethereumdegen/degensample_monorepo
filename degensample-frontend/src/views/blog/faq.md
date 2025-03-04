# Frequently Asked Questions

## General Questions

### What is DeFi Relay?

DeFi Relay is a decentralized payment gateway that allows businesses and individuals to accept cryptocurrency payments. It leverages blockchain technology to provide secure, fast, and low-cost payment processing across multiple chains.

### Which blockchains are supported?

Currently, DeFi Relay supports:
- Ethereum Mainnet (Chain ID: 1)
- Base (Chain ID: 8453)

We're actively working to add support for additional chains.

### Is DeFi Relay custodial?

No, DeFi Relay is non-custodial. We never take control of your funds. All payments go directly from your customers to your wallet. We simply facilitate the transaction and provide tools for managing payments.

## Payments & Invoices

### How do invoices work?

Invoices are payment requests that contain:
- A recipient address (or multiple recipients)
- Payment amounts
- Token information
- Chain information
- Unique identifier

When a customer pays an invoice, the funds are sent directly to the specified recipient address(es).

### Can I split payments between multiple recipients?

Yes, DeFi Relay supports splitting a single payment between multiple recipient addresses. This is perfect for revenue sharing, partnerships, or automatic fee distribution.

### Which tokens can I accept?

You can accept any ERC-20 token, as well as native tokens (ETH on Ethereum, ETH on Base). The available tokens are listed in the token selector when creating an invoice.

### How long do invoices remain valid?

Invoices remain valid indefinitely until they are paid. There is no expiration date.

## Technical Questions

### Do I need to run a server?

No, DeFi Relay handles all the backend infrastructure. You can integrate with our API or use the web interface directly.

### How do I integrate DeFi Relay with my application?

We provide several integration options:
1. **API Integration**: Use our REST API to create and manage invoices programmatically
2. **Webhook Notifications**: Receive real-time updates when invoices are paid
3. **Direct Link**: Generate invoice links that can be shared with customers

Check our [API Documentation](/docs/api) for detailed integration instructions.

### Are there any transaction fees?

DeFi Relay charges a small fee on successful transactions. The exact fee structure is available on our pricing page. You're also responsible for blockchain network fees (gas) when submitting transactions.

## Account & Security

### How do I connect my wallet?

You can connect any Ethereum-compatible wallet by clicking the "Connect Wallet" button. We support MetaMask, WalletConnect, and other popular wallet providers.

### Is my data secure?

Yes, we take security seriously:
- Your private keys never leave your device
- All API calls are encrypted using HTTPS
- We use industry-standard security practices
- Smart contracts are audited by third-party security firms

### What information do you collect?

We collect minimal information required to provide our service, including:
- Public wallet addresses
- Transaction data
- Invoice details

We do not collect personal information unless you explicitly provide it.

## Troubleshooting

### My transaction is pending for a long time

This is usually due to network congestion or insufficient gas. You can:
1. Wait for network conditions to improve
2. Speed up the transaction by increasing gas price
3. Cancel the transaction and try again with higher gas

### I don't see my tokens in the token list

If a token isn't listed, it may not be supported yet. Contact our support team to request adding specific tokens.

### I received an error when creating an invoice

Common issues include:
- Invalid token address
- Insufficient wallet balance
- Network connectivity problems

Try refreshing the page and check your inputs. If the problem persists, contact support.

## Getting Help

### How do I contact support?

You can reach our support team via:
- Email: support@defirelay.com
- Discord: [Join our community](https://discord.gg/defirelay)
- Twitter: [@DeFiRelay](https://twitter.com/defirelay)

### Where can I report bugs or suggest features?

Please report bugs and suggest features through our [GitHub repository](https://github.com/payspec/defi-relay/issues).

### Do you offer developer support?

Yes, we offer developer support for businesses integrating our platform. Contact us at dev@defirelay.com for assistance.
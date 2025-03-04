# API Documentation

## Introduction

DeFi Relay provides a powerful API to integrate cryptocurrency payments into your applications. This guide explains the core concepts and endpoints available to developers.

## Authentication

All API requests require authentication using your API key. You can generate API keys in the [Dashboard](/dashboard).

```bash
# Example API request with authentication
curl -X POST https://api.defirelay.com/v1/invoices/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount": "10.5", "token_address": "0x..."}'
```

## Core Endpoints

### Invoices

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/invoices/create` | POST | Create a new invoice |
| `/api/invoices/list` | POST | List all invoices for your account |
| `/api/invoices/find_by_uuid` | GET | Find an invoice by UUID |

### Payments

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payments/list` | POST | List all payments |
| `/api/payments/find_by_uuid` | GET | Find a payment by UUID |

### Token Symbols

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/token_symbols/list_by_chain` | POST | List available tokens for a specific chain |

## Request Examples

### Create Invoice

```json
{
  "session_token": "YOUR_SESSION_TOKEN",
  "wallet_public_address": "0x123...",
  "token_address": "0x456...",
  "pay_to_array": ["0x789...", "0xabc..."],
  "pay_to_amounts": ["5000000", "10000000"],
  "total_amount": "15000000",
  "nonce": "12345",
  "chain_id": 1
}
```

### List Tokens by Chain

```json
{
  "session_token": "YOUR_SESSION_TOKEN",
  "chain_id": 1
}
```

## Response Structure

All API responses follow a consistent structure:

```json
{
  "success": true,
  "data": {
    // Response data specific to the endpoint
  },
  "error": null
}
```

## Error Handling

When an error occurs, the response will include error details:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "The provided token is invalid or expired"
  }
}
```

## Rate Limits

The API has rate limits to ensure fair usage:

- 100 requests per minute for most endpoints
- 300 requests per minute for read-only endpoints

## Need Help?

If you need assistance with the API, you can:

1. Check our [GitHub repository](https://github.com/payspec/defi-relay) for code examples
2. Join our [Discord community](https://discord.gg/defirelay) to chat with developers
3. Email support@defirelay.com for direct assistance

---

*This documentation is subject to change as we improve our API. Always check for the latest version.*
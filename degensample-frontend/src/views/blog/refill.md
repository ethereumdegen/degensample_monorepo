# Refill // API Credits Framework 

## Introduction

Streamline API monetization with our dead-simple USDC payment rails. Refill makes it simple to create, manage and sell API credits for your services with turn-key billing and usage tracking.

## How It Works

API Workspaces allow you to bill your customers for using your API Keys. In the API Workspace dashboard, your customers can:

1. Create an API Key
2. Load it up with Credits using USDC token on Base network
3. Use the API Key to access your services

The conversion is straightforward: **1 USDC = 1 credit**

When a customer uses your API, your backend can make simple API calls to DefiRelay to:
- Deduct credits from the customer's account
- Check the remaining credit balance
- Handle failed requests when credits are insufficient

## Creating an API Workspace

1. Navigate to the [API Workspaces dashboard](/refill/workspaces)
2. Click "Create Workspace"
3. Give your workspace a name and description
4. Start integrating with your backend services

## Integration Examples

### Deducting Credits

```javascript
// Deduct credits from user account
const response = await fetch('https://api.defirelay.com/v1/api/workspace/deduct_credits', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    workspace_uuid: 'your-workspace-uuid',
    api_key: 'users-api-key',
    credits: 1 // amount to deduct
  })
});

const data = await response.json();
if (data.success) {
  // Credit deduction successful
  const remainingCredits = data.remaining_credits;
  console.log(`Deducted 1 credit. Remaining: ${remainingCredits}`);
} else {
  // Handle insufficient credits
  console.error('Insufficient credits');
}
```

### Checking Credit Balance

```javascript
// Check remaining credits balance
const response = await fetch('https://api.defirelay.com/v1/api/workspace/get_credits', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    workspace_uuid: 'your-workspace-uuid',
    api_key: 'users-api-key'
  })
});

const data = await response.json();
if (data.success) {
  const credits = data.credits;
  console.log(`User has ${credits} credits remaining`);
}
```

## Best Practices

1. **Graceful Degradation**: Handle cases where a user runs out of credits with clear messaging
2. **Credit Bundles**: Consider offering credit packages (e.g., 100 credits for 95 USDC)
3. **Usage Transparency**: Provide users with detailed usage statistics
4. **Rate Limits**: Implement appropriate rate limits to prevent abuse

## Technical Architecture

The Refill framework consists of:

1. **API Workspaces**: Containers for managing credits and API keys
2. **API Keys**: Customer-specific keys for authentication and credit tracking
3. **Credit System**: USDC-backed credit allocation and management
4. **Transaction History**: Complete record of credit purchases and usage

## Need Help?

If you need assistance with the Refill Framework, you can:

1. Check our [GitHub repository](https://github.com/payspec/defi-relay) for code examples
2. Join our [Discord community](https://discord.gg/defirelay) to chat with developers
3. Email support@defirelay.com for direct assistance

---

*This documentation is subject to change as we improve our API. Always check for the latest version.*
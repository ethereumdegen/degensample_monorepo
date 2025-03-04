## Webhooks

### Overview

Webhooks allow you to receive real-time notifications when payments are made to your invoices. Instead of continuously polling our API for updates, webhooks push events directly to your server when they occur.

### Setting Up Webhooks

1. Navigate to the **Webhooks** section in your DefiRelay Dashboard
2. Enter your webhook URL - this should be a publicly accessible endpoint on your server
3. Click "Save Webhook URL" to activate webhook notifications


### Webhook Listener Server Template Repo 

1. A template repo is published as a quickstart to help you handle payment webhooks for your service

[webhook-listener-bot-template](https://github.com/DefiRelay/webhook-listener-bot-template) 



### Security Considerations

- Your webhook endpoint should use HTTPS to ensure secure transmission of data
- We recommend validating webhook payloads before processing them
- Consider implementing authentication for your webhook endpoint

### Webhook Payload Format

When a payment is made to one of your invoices, we'll send a POST request to your webhook URL with the following JSON payload:

```json
{
  "event_type": "payment_received",
  "timestamp": "2025-02-27T14:37:21Z",
  "data": {
    "invoice_uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "transaction_hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "payment_amount": "100.0",
    "token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "chain_id": 1,
    "payer_address": "0x1234567890abcdef1234567890abcdef12345678",
    "recipient_addresses": [
      "0xabcdef1234567890abcdef1234567890abcdef12"
    ],
    "status": "confirmed",
    "block_number": 12345678,
    "payment_time": "2025-02-27T14:37:21Z"
  }
}
```

### Event Types

Currently, we support the following event types:

- `payment_received` - Sent when an invoice is paid successfully
- `payment_failed` - Sent when a payment attempt fails for any reason

### Handling Webhook Events

Your server should:

1. Receive the webhook POST request
2. Validate the payload
3. Process the event based on the `event_type`
4. Return a `200 OK` response to acknowledge receipt

Here's a simple example using Node.js and Express:

```javascript
const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => {
  const event = req.body;
  
  // Process the event
  switch (event.event_type) {
    case 'payment_received':
      // Update order status, fulfill product, etc.
      console.log(`Payment received for invoice ${event.data.invoice_uuid}`);
      break;
    case 'payment_failed':
      // Handle failed payment
      console.log(`Payment failed for invoice ${event.data.invoice_uuid}`);
      break;
    default:
      console.log(`Unhandled event type: ${event.event_type}`);
  }
  
  // Acknowledge receipt of the webhook
  res.status(200).send('Webhook received successfully');
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

### Error Handling and Retries

If your server returns anything other than a `2xx` response code, we'll consider the delivery failed and will retry the webhook using the following schedule:

- 1st retry: 5 minutes after initial failure
- 2nd retry: 1 hour after 1st retry
- 3rd retry: 6 hours after 2nd retry
- Final retry: 24 hours after 3rd retry

After all retries are exhausted, the webhook will be marked as failed and will not be retried again.

### Testing Webhooks

You can test your webhook integration by:

1. Using a service like [ngrok](https://ngrok.com/) to expose your local development server
2. Setting your webhook URL to your ngrok URL in the DefiRelay Dashboard
3. Creating and paying a test invoice

This allows you to develop and debug your webhook handler without deploying to production.

### Webhook Logs

You can view a history of webhook deliveries in the DefiRelay Dashboard, including:

- Timestamp of the delivery attempt
- Response status code from your server
- Response body (truncated if large)
- Retry status if applicable

This helps with debugging issues in your webhook integration.
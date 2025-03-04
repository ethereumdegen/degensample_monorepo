 
# DefiRelay EVM Payment Rails 

 DefiRelay has been developed to solve real problems that were encountered when handling and processing payments using the Ethereum protocol.  

 Using vanilla transactions for blockchain payments is often okay for personal use, but creates many problems for businesses without special considerations.  DefiRelay flows transactions through a permissionless immutable smart contract to reduce these issues and improve Ui/Ux.  


## Why use DefiRelay as your EVM payments solution?
 
1. **Simple Track and Trace** - Defi Relay uses bots to crawl the blockchain for payments made to you and provides a simple API for you to query them.

2. **Double-payment Mitigation** - Unlike normal EVM transactions, 'Payspec' payments use a UUID (universally unique id) to prevent the same invoice from being paid twice, reducing your business issues and improving customer experience.  
 
3. **Webhooks On Payment** - Defi Relay can be configured to automatically trigger a webhook on your server when an incoming payment occurs. [Learn more about webhooks](/docs/webhooks).

## Documentation

- [Getting Started](/docs/start)
- [Payment Processing](/docs/payments)
- [Webhooks Integration](/docs/webhooks)

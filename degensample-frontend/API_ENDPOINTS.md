# Refill API Endpoints Documentation

This document provides a brief explanation of the endpoints available in the Refill API controllers for frontend integration.

## ApiWorkspacesController

Base path: `/api/workspace`

### GET `/find_by_uuid`

Retrieves a workspace by its UUID.

- **Query Parameters**: 
  - `uuid` - The workspace UUID
- **Response**: Workspace details
- **Authentication**: None required
- **Use Case**: Public access to view workspace details

### POST `/create`

Creates a new API workspace.

- **Request Body**:
  - `session_token` - Authentication token
  - `name` - Workspace name
  - `description` - Optional workspace description
  - `invoice_template_uuid` - Optional invoice template UUID
- **Response**: Created workspace UUID
- **Authentication**: Valid session token required
- **Use Case**: Authenticated users creating new workspaces

### POST `/list`

Lists all workspaces for the authenticated user.

- **Request Body**:
  - `session_token` - Authentication token
  - `pagination` - Optional pagination parameters
- **Response**: Paginated list of workspaces
- **Authentication**: Valid session token required
- **Use Case**: Authenticated users viewing their workspaces

## ApiCreditRefillsController

Base path: `/api/credit_refill`

### POST `/find_all_for_client_address`

Finds credit refills for the authenticated client's address.

- **Request Body**:
  - `session_token` - Authentication token (session token or API key)
  - `pagination` - Optional pagination parameters
- **Response**: Paginated list of credit refills
- **Authentication**: Valid session token or API key required
- **Use Case**: Clients viewing their own credit refill history

### POST `/find_by_workspace_and_client_address`

Finds credit refills for the authenticated client's address in a specific workspace.

- **Request Body**:
  - `session_token` - Authentication token (session token or API key)
  - `workspace_uuid` - Workspace UUID
  - `pagination` - Optional pagination parameters
- **Response**: Paginated list of credit refills
- **Authentication**: Valid session token or API key required
- **Use Case**: Clients viewing their credit refill history in a specific workspace

### POST `/find_by_workspace`

Finds credit refills for a specific workspace.

- **Request Body**:
  - `session_token` - Authentication token (session token or API key)
  - `workspace_uuid` - Workspace UUID
  - `pagination` - Optional pagination parameters
- **Response**: Paginated list of credit refills
- **Authentication**: Valid session token or API key required, and the authenticated address must be the owner of the workspace
- **Use Case**: Workspace owners viewing credit refill history for their workspace

## ApiCreditRefillsFixedController

Base path: `/api/credit_refill2`

### POST `/find_by_client`

Finds credit refills for the authenticated client.

- **Request Body**:
  - `session_token` - Authentication token (session token or API key)
  - `pagination` - Optional pagination parameters
- **Response**: Paginated list of credit refills
- **Authentication**: Valid session token or API key required
- **Use Case**: Clients viewing their own credit refill history

### POST `/find_by_workspace`

Finds credit refills for a specific workspace.

- **Request Body**:
  - `session_token` - Authentication token (session token or API key)
  - `workspace_uuid` - Workspace UUID
  - `pagination` - Optional pagination parameters
- **Response**: Paginated list of credit refills
- **Authentication**: Valid session token or API key required, and the authenticated address must be the owner of the workspace
- **Use Case**: Workspace owners viewing credit refill history for their workspace

### POST `/find_by_client_in_workspace`

Finds credit refills for a specific client address in a specific workspace.

- **Request Body**:
  - `session_token` - Authentication token (session token or API key)
  - `client_address` - Ethereum address of the client
  - `workspace_uuid` - Workspace UUID
  - `pagination` - Optional pagination parameters
- **Response**: Paginated list of credit refills
- **Authentication**: Valid session token or API key required, and the authenticated address must be either the owner of the workspace or match the client_address
- **Use Case**: Workspace owners or clients viewing credit refill history for a specific client in a workspace

### POST `/find_by_client_address`

Finds credit refills for a specific client address.

- **Request Body**:
  - `session_token` - Authentication token (session token or API key)
  - `client_address` - Ethereum address of the client
  - `pagination` - Optional pagination parameters
- **Response**: Paginated list of credit refills
- **Authentication**: Valid session token or API key required, and the authenticated address must match the `client_address`
- **Use Case**: Clients viewing their own credit refill history

### POST `/find_by_workspace`

Finds credit refills for a specific workspace.

- **Request Body**:
  - `session_token` - Authentication token (session token or API key)
  - `workspace_uuid` - Workspace UUID
  - `pagination` - Optional pagination parameters
- **Response**: Paginated list of credit refills
- **Authentication**: Valid session token or API key required, and the authenticated address must be the owner of the workspace
- **Use Case**: Workspace owners viewing credit refill history for their workspace

## ApiClientKeysController

Base path: `/api/client_key`

### POST `/create`

Creates a new API client key for a workspace.

- **Request Body**:
  - `session_token` - Authentication token 
  - `workspace_uuid` - Workspace UUID
  - `name` - Optional client key name
- **Response**: Client key (secret)
- **Authentication**: Valid session token required
- **Use Case**: Authenticated users creating client keys for their workspaces

### POST `/update_api_credits`

Updates API credits for a client key by applying a delta change in cents.

- **Request Body**:
  - `workspace_uuid` - Workspace UUID
  - `client_address` - Ethereum address of the client
  - `credits_delta_cents` - Change in credits in cents (can be positive or negative)
- **Response**: Updated credits information with both decimal balance (`new_credits`) and cents (`new_credits_cents`)
- **Authentication**: None required
- **Use Case**: Adding or removing credits from a client key (e.g., during payment processing or refunds)
- **Note**: Credits are stored as decimals but transactions are done in cents for better precision

### POST `/list`

Lists all client keys for a workspace.

- **Request Body**:
  - `workspace_uuid` - Workspace UUID
  - `pagination` - Optional pagination parameters
- **Response**: Paginated list of client keys (without secrets)
- **Authentication**: None required
- **Use Case**: Public view of client keys associated with a workspace

### POST `/find`

Finds client keys for the authenticated user in a specific workspace.

- **Request Body**:
  - `session_token` - Authentication token
  - `workspace_uuid` - Workspace UUID
- **Response**: List of client keys with complete information (including secrets)
- **Authentication**: Valid session token required
- **Use Case**: Authenticated users viewing their complete client key details

### POST `/find_by_workspace_and_client`

Finds a specific client key by workspace UUID and client address.

- **Request Body**:
  - `workspace_uuid` - Workspace UUID
  - `session_token` - Session token of the client
- **Response**: Single client key details (without secret)
- **Authentication**: Valid session token required
- **Use Case**: Finding a specific client key when both workspace and client address are known

### POST `/refill`

Creates a new invoice for adding credits to a client key.

- **Request Body**:
  - `session_token` - Authentication token
  - `workspace_uuid` - Workspace UUID
  - `client_address` - Ethereum address of the client
  - `chain_id` - Blockchain network ID
  - `token_address` - Address of token to use for payment
  - `amount_cents` - Amount in cents to charge
- **Response**: Invoice object with metadata about the client key refill
- **Authentication**: Valid session token required
- **Use Case**: Creating payment invoices for refilling credits on a client key

## PaymentsController

Base path: `/api/payments`

### POST `/list`

Lists payments for the authenticated user.

- **Request Body**:
  - `session_token` - Authentication token
  - `chain_id` - Optional chain ID to filter payments
  - `pagination` - Optional pagination parameters
- **Response**: Paginated list of payments
- **Authentication**: Valid session token required
- **Use Case**: Authenticated users viewing their payment history

### GET `/find_by_invoice_uuid`

Finds a payment by its invoice UUID.

- **Query Parameters**:
  - `invoice_uuid` - The UUID of the invoice
- **Response**: Payment details if found
- **Authentication**: None required
- **Use Case**: Public access to check payment status for a specific invoice

## Response Format

All endpoints use a standard response format:

```json
{
  "success": true|false,
  "data": [response data if success is true],
  "error": "Error message if success is false"
}
```

## Pagination

Endpoints that support pagination accept a `pagination` object with:

- `page` - Page number (1-indexed)
- `page_size` - Number of items per page
- `sort_by` - Field to sort by
- `sort_dir` - Sort direction ("asc" or "desc")

Paginated responses include:

- `items` - Array of results
- `total_count` - Total number of items
- `page` - Current page number
- `page_size` - Items per page
- `total_pages` - Total number of pages
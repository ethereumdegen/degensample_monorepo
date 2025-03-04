# CLAUDE.md - Coding Assistant Guide for DeFi Relay Frontend

## Build Commands
- Development: `yarn dev` (runs on port 8081)
- Production build: `yarn build-prod`
- Preview build: `yarn preview`

## Project Structure
- React-based SPA using React Router v6
- Vite as build tool
- Feature-based organization with views, components, and stores

## Code Style
- JS/TS: camelCase for variables/functions, PascalCase for components/classes
- Component files use .jsx extension
- Use functional components with hooks instead of class components
- State management: MobX for global state, useState for component state

## Authentication
- Authentication is handled via the Web3Store (MobX store)
- Users connect their wallet rather than traditional login
- Check web3Store.sessionToken to determine if user is authenticated
- Never redirect to '/login' - handle missing authentication gracefully
- When authentication is needed, show appropriate UI messaging instead of redirecting

## Component Guidelines
- Follow existing component patterns for consistency
- For form handling, use react-hook-form
- Use Tailwind for styling (existing utility classes preferred)
- For icons, use the Lucide icon library
- Prefer building UI with smaller, composable components instead of monolithic ones
  - Break large components into smaller, focused widgets
  - Keep components under 100-150 lines for better maintainability
  - Group related functionality into reusable components
  - Separate data fetching logic from presentation components

## Routing & Navigation
- Routes defined in src/router/index.jsx
- Use react-router-dom's hooks (useParams, useNavigate) for navigation
- Blog/docs content uses markdown files (.md) in the views/blog directory
- IMPORTANT: Never auto-redirect to '/login' route - there is no dedicated login page
  - Authentication is handled via integrated Web3 flow (similar to OpenSea)
  - The web3Store manages authentication state through wallet connection


  ### Backend API Endpoints 

  Read the document API_ENDPOINTS.md to understand how the backend api endpoints work 

 Hit backend like this 

```
import { makeApiRequest } from '@/lib/request-lib';     const response = await 

makeApiRequest('/api/token_symbols/list_by_chain', 'post', data);
      
 
```

IF YOU EVER MAKE CHANGES TO API CONTROLLERS (ENDPOINTS) THEN UPDATE API_ENDPOINTS.md APPROPRIATELY . 


  ### CSS Style Guide 

  See the document  DESIGN_SPEC.md to understand the css style guidelines 



  ## React  Components 

    components that are used across  multiple pages  should live in  /views/components/ 


    unless otherwise told,  all tables should be paginated using 
    src/views/components/table/TablePaginated.jsx

 
import serverConfig from  '@/config/server-config.json' 

const NODE_ENV = process.env.NODE_ENV ? process.env.NODE_ENV : 'development'


export function getEnvironmentName(): string {
  const envName = NODE_ENV ? NODE_ENV : 'development'

  return envName
}


export function getBackendServerUrl(){


  const ENV_MODE = getEnvironmentName()

  //@ts-ignore
  const localServerConfig:any = serverConfig[ENV_MODE]

  const backendServerUrl = localServerConfig.backendServerUrl

  return backendServerUrl

}

export function getRpcServerUrl(){

  const ENV_MODE = getEnvironmentName()

  //@ts-ignore
  const localServerConfig:any = serverConfig[ENV_MODE]

  const rpcServerUrl = localServerConfig.rpcServerUrl

  return rpcServerUrl



}
export function getEtherscanRootUrl(chain_id) {
  let subdomain = '';
  
  switch (chain_id) {
    case 1:
       return `https://etherscan.io`
      break;
    case 8453:
      // Base
        return `https://basescan.org`
      break;
    
    case 42161:
      // Arbitrum
       return `https://arbiscan.io`
    
    default:
       return `https://etherscan.io`
  }
}

/**
 * Formats a credit amount for display, truncating to 2 decimal places
 * @param creditValue - The credit value in dollars (can be a raw number with > 2 decimal places)
 * @returns Formatted string in USD currency format with exactly 2 decimal places ($X.XX)
 */
export function formatCreditAmount(creditValue) {
  // Handle undefined or null values
  if (creditValue === undefined || creditValue === null) {
    return '$0.00';
  }
  
  // Truncate to 2 decimal places (not round)
  const truncated = Math.trunc(creditValue * 100) / 100;
  
  // Format with dollar sign and comma separators
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(truncated);
}
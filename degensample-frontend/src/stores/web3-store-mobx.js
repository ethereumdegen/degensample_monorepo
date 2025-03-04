import { ethers, BigNumber } from "ethers";
import { isArray } from "lodash";
import { createContext } from "react";
import axios from "axios";
import { makeObservable, observable, action, computed, runInAction } from "mobx";
import { getEnvironmentName } from "@/lib/app-helper";
import serverConfig from "@/config/server-config.json";

const ENV_MODE = getEnvironmentName();
const localServerConfig = serverConfig[ENV_MODE];

async function walletIsUnlocked() {
  return await window.ethereum._metamask.isUnlocked();
}

export class Web3Store {
  provider = undefined;
  signer = undefined;
  account = undefined;
  chainId = undefined;
  challenge = undefined;
  authToken = undefined;
  authTokenExpiresAt = undefined;
  authTokenScopes = [];
  customCallbacks = {};

  constructor() {
    makeObservable(this, {
      provider: observable,
      signer: observable,
      account: observable,
      chainId: observable,
      challenge: observable,
      authToken: observable,
      authTokenExpiresAt: observable,
      authTokenScopes: observable,
      active: computed,
      authorized: computed,
      testnetMode: computed,
      loadState: action,
      connect: action,
      soft_reconnect: action,
      disconnect: action,
      registerWalletCallbacks: action,
      requestChallengeAndSign: action,
      registerCustomCallback: action,
    });
    
    // Load saved state from localStorage on initialization
    this.loadState();
    
    // If we have a wallet connected, try to reconnect to it
    if (window.ethereum && this.account) {
      this.soft_reconnect();
    }
  }

  get active() {
    return this.account !== undefined;
  }

  get testnetMode() {
    console.log("chain id is ", this.chainId);
    return BigNumber.from(this.chainId ?? 0).eq(BigNumber.from("11155111"));
  }

  get authorized() {
    const isAuthed =
      this.authToken !== undefined &&
      this.authTokenExpiresAt !== undefined &&
      new Date(this.authTokenExpiresAt) > Date.now();
    console.log(
      { isAuthed },
      this.authTokenExpiresAt,
      new Date(this.authTokenExpiresAt) > Date.now()
    );
    return isAuthed;
  }

  async connect() {
    if (!window.ethereum) {
      window.open("https://www.metamask.io", "_blank");
      console.log("You must install metamask ");
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const account = await signer.getAddress();
    const { chainId } = await provider.getNetwork();

    runInAction(() => {
      this.provider = provider;
      this.signer = signer;
      this.account = account;
      this.chainId = BigNumber.from(chainId ?? 0).toString();
    });

    console.log("set chain id ", this.chainId);
    this.saveState();
  }

  async soft_reconnect() {
    try {
      // Check if MetaMask is available
      if (!window.ethereum) {
        console.log("MetaMask not available for reconnection");
        return;
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      
      // Try to get accounts without prompting user
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        const signer = provider.getSigner();
        const account = await signer.getAddress();
        const { chainId } = await provider.getNetwork();
        
        runInAction(() => {
          this.provider = provider;
          this.signer = signer;
          this.account = account;
          this.chainId = BigNumber.from(chainId ?? 0).toString();
        });
        
        console.log("Soft reconnected to wallet", this.account);
        this.registerWalletCallbacks();
      } else {
        console.log("No connected accounts found during soft reconnect");
      }
    } catch (error) {
      console.error("Error during soft reconnect:", error);
    }
  }

  async disconnect() {
    runInAction(() => {
      this.account = undefined;
      this.authToken = undefined;
      this.authTokenExpiresAt = undefined;
      this.authTokenScopes = [];
      this.signer = undefined;
      // Reset other relevant state properties
    });
    
    // Clear from localStorage
    localStorage.removeItem("w3Store");
    console.log("Disconnected and cleared auth state");
  }

  registerWalletCallbacks() {
    console.log("register wallet callbacks ", window.ethereum.isConnected());

    window.ethereum.on("connect", ({ chainId }) => {
      runInAction(() => {
        this.chainId = BigNumber.from(chainId ?? 0).toString();
      });
      this.emitCustomEvent("connect");
    });

    window.ethereum.on("chainChanged", (chainId) => {
      runInAction(() => {
        this.chainId = BigNumber.from(chainId ?? 0).toString();
      });
      this.emitCustomEvent("chainChanged");
      console.log("chain changed");
    });

    window.ethereum.on("accountsChanged", async (accounts) => {
      runInAction(() => {
        this.account = accounts[0];
      });
      this.emitCustomEvent("accountsChanged");
      console.log("account changed");
    });
  }

  emitCustomEvent(name) {
    if (isArray(this.customCallbacks[name])) {
      for (let cb of this.customCallbacks[name]) {
        cb();
      }
    }
  }

  registerCustomCallback(name, callback) {
    if (!isArray(this.customCallbacks[name])) {
      this.customCallbacks[name] = [];
    }
    this.customCallbacks[name].push(callback);
    console.log("registered callback ", name);
  }

  async requestChallengeAndSign() {
    const is_unlocked = await walletIsUnlocked();
    console.log("is unlocked", is_unlocked);
    if (!is_unlocked) {
      await this.connect();
    }

    const backendServerUrl = localServerConfig.backendServerUrl;
    const generateChallengeEndpointUrl = `${backendServerUrl}/api/session/generate_challenge`;

    let challengePostRequest = await axios.post(generateChallengeEndpointUrl, {
      public_address: this.account,
    });

    console.log({ challengePostRequest });

    if (challengePostRequest.status === 200) {
      const challenge = challengePostRequest.data.challenge;
      runInAction(() => {
        this.challenge = challenge;
      });

      const publicAddress = this.account;
      const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      const signature = await provider
        .getSigner(publicAddress)
        .signMessage(challenge);

      const generateSessionEndpointUrl = `${backendServerUrl}/api/session/validate_auth`;

      let authorizationPostRequest = await axios.post(
        generateSessionEndpointUrl,
        {
          public_address: this.account,
          signature: signature,
          challenge: challenge,
        }
      );

      console.log({ authorizationPostRequest });

      const { session_token, expires_at, scopes } = authorizationPostRequest.data?.data;
      console.log({ session_token, expires_at });

      runInAction(() => {
        this.authToken = session_token;
        this.authTokenExpiresAt = expires_at * 1000 ;
        this.authTokenScopes = scopes;
      });

      console.log("set auth token", this.authToken, this.authTokenExpiresAt);
      this.saveState();

      return true;
    } else {
      console.error("Challenge request error", challengePostRequest.error);
    }

    return false;
  }

  saveState() {
    const state = {
      authToken: this.authToken,
      authTokenExpiresAt: this.authTokenExpiresAt,
      authTokenScopes: this.authTokenScopes,
      account: this.account,
    };
    localStorage.setItem("w3Store", JSON.stringify(state));
  }

  loadState() {
    const storedState = localStorage.getItem("w3Store");
    if (storedState) {
      const state = JSON.parse(storedState);
      // If the loaded state has an expiration time and it's still valid
      if (state.authTokenExpiresAt && new Date(state.authTokenExpiresAt) > Date.now()) {
        console.log("Loading saved auth state from localStorage");
        runInAction(() => {
          this.account = state.account;
          this.authToken = state.authToken;
          this.authTokenScopes = state.authTokenScopes || [];
          this.authTokenExpiresAt = state.authTokenExpiresAt;
        });
      } else {
        console.log("Stored auth token has expired, not loading");
      }
    }
  }
}

export async function requestAddNetwork({ chainId, chainName, rpcUrl }) {
  console.log("request add network");

  const params = [
    {
      chainId,
      chainName,
      rpcUrls: [rpcUrl],
      nativeCurrency: {
        name: "ETH",
        symbol: "ETH",
        decimals: 18,
      },
    },
  ];

  console.log({ params });
  let addedNetwork = await window.ethereum.request({
    id: 1,
    jsonrpc: "2.0",
    method: "wallet_addEthereumChain",
    params,
  });

  console.log({ addedNetwork });
}

export function getNetworkNameFromChainId(chainId) {
  switch (chainId) {
    case 1:
      return "mainnet";
    case 11155111:
      return "sepolia";
    case 8453:
      return "base";
    default:
      return "unknown";
  }
}

const web3Store = new Web3Store();
export const Web3StoreContext = createContext(web3Store);

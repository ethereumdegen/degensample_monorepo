pub enum RpcNetwork {
    Mainnet,
    Base,
    Arbitrum,
    Polygon,
}

impl RpcNetwork {
    pub fn from_network_name(name: String) -> Option<Self> {
        match name.as_str() {
            "mainnet" => Some(Self::Mainnet),
            "polygon" => Some(Self::Polygon),
            "base" => Some(Self::Base),
            "arbitrum" => Some(Self::Arbitrum),

            _ => None,
        }
    }

    pub fn to_network_name_hypernative(&self) -> &str {
        match self {
            Self::Mainnet => "ethereum",
            Self::Polygon => "polygon",
            Self::Arbitrum => "arbitrum",
            Self::Base => "base",
        }
    }

    pub fn from_chain_id(chain_id: u64) -> Option<Self> {
        match chain_id {
            1 => Some(Self::Mainnet),
            137 => Some(Self::Polygon),
            8453 => Some(Self::Base),
            42161 => Some(Self::Arbitrum),

            _ => None,
        }
    }

    pub fn get_chain_id(&self) -> u64 {
        match self {
            Self::Mainnet => 1,
            Self::Polygon => 137,
            Self::Arbitrum => 42161,
            Self::Base => 8453,
        }
    }

    pub fn get_rpc_url_env_var(&self) -> &str {
        match self {
            Self::Mainnet => "MAINNET_RPC_URL",
            Self::Polygon => "POLYGON_RPC_URL",
            Self::Arbitrum => "ARBITRUM_RPC_URL",
            Self::Base => "BASE_RPC_URL",
        }
    }

    pub fn get_rpc_url(&self) -> Option<String> {
        let env_var_name = self.get_rpc_url_env_var();
        std::env::var(env_var_name).ok()
    }
}

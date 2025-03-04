use crate::types::domains::eth_address::DomainEthAddress;
use ethers::types::Address;
use serde_json;
use std::collections::HashMap;
use std::str::FromStr;

pub struct PayspecContractsConfig(pub HashMap<i64, DomainEthAddress>);

impl PayspecContractsConfig {
    pub fn load() -> Self {
        // Read the JSON file as a string
        let config_data_raw = include_str!("../../config/payspec_contracts.json");

        // Parse the JSON string into a temporary HashMap with string keys
        let config_map: HashMap<String, String> =
            serde_json::from_str(config_data_raw).expect("Failed to parse payspec_contracts.json");

        // Convert to our target format with i64 keys and DomainEthAddress values
        let mut contracts_map = HashMap::new();

        for (chain_id_str, address_str) in config_map {
            // Parse chain ID
            let chain_id = chain_id_str
                .parse::<i64>()
                .expect(&format!("Invalid chain ID: {}", chain_id_str));

            // Parse Ethereum address
            let eth_address = Address::from_str(&address_str)
                .expect(&format!("Invalid Ethereum address: {}", address_str));

            contracts_map.insert(chain_id, DomainEthAddress(eth_address));
        }

        PayspecContractsConfig(contracts_map)
    }

    pub fn get_contract_address(&self, chain_id: i64) -> Option<&DomainEthAddress> {
        self.0.get(&chain_id)
    }
}

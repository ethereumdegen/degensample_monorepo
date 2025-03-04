use defirelay_backend::db::postgres::models::events_model::EventsModel;
use defirelay_backend::db::postgres::models::payments_model::PaymentSummary;
use defirelay_backend::db::postgres::models::payments_model::PaymentsModel;
use defirelay_backend::types::domains::bytes32::DomainBytes32;
use defirelay_backend::types::domains::eth_address::DomainEthAddress;
use defirelay_backend::types::domains::h256::DomainH256;
use defirelay_backend::types::domains::pay_to_amounts::DomainPayToAmounts;
use defirelay_backend::types::domains::pay_to_array::DomainPayToArray;
use defirelay_backend::types::domains::uint256::DomainUint256;
use defirelay_backend::util::rpc_network::RpcNetwork;
use ethers::types::H256;
use log::warn;

use ethers_middleware::Middleware;

use chrono::DateTime;
use chrono::TimeZone;
use chrono::Utc;
use defirelay_backend::util::unix_day_index::UnixDayIndex;
use ethers::contract::abigen;
use ethers::providers::Http;
use ethers::providers::Provider;
use ethers::types::U64;
use log::info;

use std::env;

use tokio::sync::Mutex;

use ethers::abi::Address;
use ethers::abi::Token;

use degen_sql::db::postgres::postgres_db::Database;

use vibegraph::event::ContractEvent;

use dotenvy::dotenv;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::select;
use tokio::time::interval;
use tokio::time::Duration;


/*

RUST_LOG=info cargo run --bin loan_summary_bot
*/

pub struct AppState {
    pub database: Arc<Mutex<Database>>,

    pub indexing_state: IndexingState,
}

pub struct AppConfig {
    //  loan_protocol_abi : Abi,
    rpc_uri_map: HashMap<u64, String>,
}

#[derive(Default)]
pub struct IndexingState {
    //event_offset: u64,
    event_id_offset: Option<i32>,
}

#[tokio::main]
async fn main() {
    env_logger::init();
    dotenv().ok();
    run_payment_summary().await;
}

pub async fn run_payment_summary() {
    println!("booting payment summary bot ");

    let db_conn_url = std::env::var("DB_CONN_URL").expect(" DB_CONN_URL must be set in env ");

    // Attach database with proper error handling
    let database = match Database::new(db_conn_url.clone(), None) {
        Ok(db) => Arc::new(Mutex::new(db)), // Wrap in Arc<Mutex<T>> properly
        Err(e) => {
            eprintln!("Failed to connect to database: {}", e);
            return;
        }
    };

    let networks = vec![RpcNetwork::Mainnet, RpcNetwork::Base];

    let chain_ids: Vec<u64> = networks.iter().map(|n| n.get_chain_id()).collect();

    let rpc_uri_map = load_rpc_uris(&chain_ids);

    let app_state = AppState {
        database: Arc::clone(&database),

        indexing_state: IndexingState::default(),
    };

    let app_config = AppConfig { rpc_uri_map };

    // find the next database event to operate on

    // make sure there is no matching bot action

    // if not, add the bot action and add to watchlist !

    let index_rate: u64 = std::env::var("PULSE_TIME_MS")
        .ok()
        .map(|i| i.parse().ok())
        .flatten()
        .unwrap_or(4000);

    start(app_state, app_config, index_rate).await;
}

async fn start(mut app_state: AppState, app_config: AppConfig, tick_interval_time_ms: u64) {
    let mut tick_interval = interval(Duration::from_millis(tick_interval_time_ms));

    loop {
        select! {
            _ = tick_interval.tick() => {


                app_state = poll_event_and_fetch_payment_summary(
                    app_state,
                    &app_config
                ).await;

            }

        }
    }
}

async fn poll_event_and_fetch_payment_summary(
    mut app_state: AppState,
    app_config: &AppConfig,
) -> AppState {
    let offset = app_state.indexing_state.event_id_offset.clone();

    info!(
        "app_state.indexing_state.event_offset  {:?}",
        app_state.indexing_state.event_id_offset
    );

    let mut psql_db = app_state.database.lock().await;

    //may need a reconnection scheme ?

    let next_event =
        EventsModel::find_next_event_of_type("PaidInvoice".to_string(), offset, &mut psql_db).await;

    //  drop (psql_db);

    info!("found PAID INVOICE ");

    match next_event {
        Err(_) => {
            // reset event offset

            info!(" reset event offset  ");

            app_state.indexing_state.event_id_offset = None;
        }

        Ok((next_event_id, ref event_data)) => {
            if let Some(paid_invoice_data) = PaidInvoiceData::extract_paid_invoice_data(event_data)
            {
                // let contract_add_result = add_contract_to_watchlist( watchlist_id,  &deployed_pool_data ).await;
                match fetch_payment_summary(&paid_invoice_data, app_config).await {
                    Ok(loan_summary) => {
                        println!(" PaymentsModel::insert_or_update_one {:?} ", loan_summary);

                        let _inserted =
                            PaymentsModel::insert_or_update_one(loan_summary, &mut psql_db).await;
                    }

                    Err(e) => {
                        warn!("{:?}", e);
                    }
                }

                app_state.indexing_state.event_id_offset = Some(next_event_id.clone());
                println!("increment event offset  ");
            }else {

                warn!("could not extract extract_paid_invoice_data {:?}", event_data );

            }
        }
    }

    drop(psql_db);
    drop(next_event);

    app_state
}

#[derive(Debug, Clone)]
struct PaidInvoiceData {
    contract_address: Address,

    uuid: Vec<u8>,
    chain_id: u64,

    tx_hash: H256,

    from_address: Address,

    block_number: Option<U64>,
}

impl PaidInvoiceData {
    fn extract_paid_invoice_data(contract_event: &ContractEvent) -> Option<Self> {
        println!("extract {:?}", contract_event);
        let event_name = &contract_event.name;

        if event_name != "PaidInvoice" {
            return None;
        }

        let chain_id = contract_event.chain_id;
        let contract_address = contract_event.address;

        let tx_hash = contract_event.transaction_hash?;

        let block_number = contract_event.block_number;

        let mut uuid_opt = None;

        let mut from_address_opt = None;

        for arg in &contract_event.args {
            if arg.name == "uuid" {
                match &arg.value {
                    Token::FixedBytes(uuid_bytes) => uuid_opt = Some(uuid_bytes),
                    _ => {}
                }
            }

            if arg.name == "from" {
                match &arg.value {
                    Token::Address(from_addr) => from_address_opt = Some(from_addr),
                    _ => {}
                }
            }
        }

        // let bid_id = U256::zero(); // FIX

        if let Some(uuid) = uuid_opt {
            if let Some(from_address) = from_address_opt {
                return Some(Self {
                    contract_address,
                    chain_id,
                    uuid: uuid.to_vec(),
                    tx_hash,
                    block_number,
                    from_address: *from_address,
                });
            }
        }

        return None;
    }
}

#[derive(Debug, thiserror::Error)]
pub enum PaymentSummaryError {
    #[error("Failed to fetch summary from contract: {0}")]
    ContractCallError(#[from] ethers::contract::ContractError<Provider<Http>>),

    #[error("Failed to parse RPC URL for chain {0}")]
    RpcUrlParseError(String),

    #[error("Network provider initialization failed: {0}")]
    ProviderError(#[from] ethers::providers::ProviderError),

    #[error("abi parse failed: {0}")]
    ParseError(#[from] url::ParseError),

    #[error("Reqwest error: {0}")]
    ReqwestError(#[from] reqwest::Error),
}

// pass in the chain_id and contract_address
async fn fetch_payment_summary(
    payment_data: &PaidInvoiceData,
    app_config: &AppConfig,
) -> Result<PaymentSummary, PaymentSummaryError> {
    abigen!(
        Payspec,
        "./abi/payspec.json",
        event_derives(serde::Deserialize, serde::Serialize)
    );

    info!("fetch_payment_summary {:?}", payment_data);

    let payspec_contract_address = &payment_data.contract_address;

    let chain_id = &payment_data.chain_id;

    let block_number = &payment_data.block_number;

    let transaction_hash = &payment_data.tx_hash;

    let rpc_url = app_config
        .rpc_uri_map
        .get(chain_id)
        .ok_or_else(|| PaymentSummaryError::RpcUrlParseError(chain_id.to_string()))?;

    let provider =
        Provider::<Http>::try_from(rpc_url).map_err(|e| PaymentSummaryError::ParseError(e))?;

    let from_address = &payment_data.from_address;
    let uuid: &Vec<u8> = &payment_data.uuid;

    // ----

    let payment_at_block = block_number.clone();

    let mut payment_at_block_timestamp = None;
    let mut payment_at_unix_days_index = None;

    if let Some(payment_at_block) = payment_at_block {
        payment_at_block_timestamp = fetch_block_timestamp(payment_at_block, &provider)
            .await
            .ok();

        if let Some(accepted_at_block_timestamp) = payment_at_block_timestamp {
            payment_at_unix_days_index =
                payment_at_block_timestamp.map(|t| UnixDayIndex::from_timestamp(t));
        }
    }

    //  info!("accepted_at_block {:?}" , payment_at_block );

    //  info!("accepted_at_unix_days_index {:?}" , payment_at_unix_days_index );

    // ----

    let payspec_protocol_contract = Payspec::new(payment_data.contract_address, provider.into());

    // Ensure we have exactly 32 bytes for the UUID
    let mut uuid_bytes = [0u8; 32];
    let copy_len = std::cmp::min(uuid.len(), 32);

    // If the UUID is less than 32 bytes, it will be padded with zeros
    // If it's longer, it will be truncated
    uuid_bytes[..copy_len].copy_from_slice(&uuid[..copy_len]);

    let domain_uuid_bytes = DomainBytes32(uuid_bytes);

    let payment_details = payspec_protocol_contract
        .get_invoice_payment_details(domain_uuid_bytes.0)
        .await?;
    info!("payment_details {:?}", payment_details);

    //  access the tuple elements:
    let paid_by = payment_details.0;
    let payment_token_address = payment_details.1;
    let total_amount = payment_details.2;

    let nonce = payment_details.3;

    let pay_to_array = payment_details.4;
    let pay_to_amounts = payment_details.5;

    let payment_summary = PaymentSummary {
        uuid: domain_uuid_bytes.clone(),

        chain_id: *chain_id as i64,

        //  paid_by  , ...
        from_address: from_address.clone().into(),

        payment_token_address: DomainEthAddress(payment_token_address),
        //   totalAmount: DomainUint256(total_amount),
        pay_to_array: DomainPayToArray(pay_to_array),
        pay_to_amounts: DomainPayToAmounts(pay_to_amounts),

        payment_at_block: payment_at_block.map(|x| x.as_u64() as i64),
        payment_at_block_timestamp: payment_at_block_timestamp.map(|x| x.into()),
        payment_at_unix_days_index,

        payspec_contract_address: DomainEthAddress(payspec_contract_address.clone()),
        nonce: DomainUint256(nonce),

        transaction_hash: DomainH256(transaction_hash.clone()),
    };

    Ok(payment_summary)
}

/*

#[derive(Clone,Debug)]
pub struct PaymentSummary {

    uuid: String,

    chain_id: i64,

    payspec_contract_address: DomainEthAddress,

    payment_token_address: DomainEthAddress,


    totalAmount: DomainUint256,
    recipients: DomainPayToArray,
    amounts: DomainPayToAmounts,


    transaction_hash: DomainH256,


    payment_at_block: Option< U64 >,
    payment_at_block_timestamp: Option< DateTime<Utc> > ,
    payment_at_unix_days_index:  Option< i64 >


}
*/

pub fn load_rpc_uris(chain_ids: &[u64]) -> HashMap<u64, String> {
    let mut rpc_uri_map = HashMap::new();

    for &chain_id in chain_ids {
        let rpc_network = RpcNetwork::from_chain_id(chain_id);
        if let Some(network) = rpc_network {
            let rpc_url_env_var = network.get_rpc_url_env_var();
            if let Ok(rpc_url) = env::var(rpc_url_env_var) {
                rpc_uri_map.insert(chain_id, rpc_url);
            }
        }
    }

    rpc_uri_map
}

pub async fn fetch_block_timestamp(
    block_number: U64,
    provider: &Provider<Http>,
) -> Result<DateTime<Utc>, Box<dyn std::error::Error>> {
    // Fetch the block details
    if let Some(block) = provider.get_block(block_number).await? {
        if let Some(timestamp) = block.timestamp.try_into().ok() {
            // Convert timestamp to DateTime<Utc>
            let datetime = DateTime::from_timestamp(timestamp, 0).ok_or("Invalid timestamp")?;
            return Ok(datetime);
        }
    }

    Err("Block timestamp not found".into())
}

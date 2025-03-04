use defirelay_backend::db::postgres::models::webhook_triggers_model::WebhookTriggerStatus;
use defirelay_backend::db::postgres::models::webhook_triggers_model::WebhookTriggersModel;
use defirelay_backend::types::defi_relay_webhook_payload::DefiRelayWebhookPayload;
use defirelay_backend::util::http_request::perform_req;
use dotenvy::dotenv;
use reqwest::StatusCode;
use std::sync::Arc;
use std::time::Duration;
use tokio::select;
use tokio::time::interval;
/*



Finds webhook triggers that have not been acknowledged and sends POST !


RUST_LOG=info cargo run --bin webhook_trigger_bot


*/

use degen_sql::db::postgres::postgres_db::Database;
use tokio::sync::Mutex;

#[derive(Default)]
pub struct IndexingState {
    //event_offset: u64,
    event_id_offset: Option<i32>,
}

struct AppState {
    pub database: Arc<Mutex<Database>>,

    pub indexing_state: IndexingState,
}

#[tokio::main]
async fn main() {
    env_logger::init();
    dotenv().ok();
    run_webhook_trigger_bot().await;
}

pub async fn run_webhook_trigger_bot() {
    println!("booting webhook trigger bot ");

    let db_conn_url = std::env::var("DB_CONN_URL").expect(" DB_CONN_URL must be set in env ");

    // Attach database with proper error handling
    let database = match Database::new(db_conn_url.clone(), None) {
        Ok(db) => Arc::new(Mutex::new(db)), // Wrap in Arc<Mutex<T>> properly
        Err(e) => {
            eprintln!("Failed to connect to database: {}", e);
            return;
        }
    };

    // let networks = vec![RpcNetwork::Mainnet, RpcNetwork::Base];

    // let chain_ids: Vec<u64> = networks.iter().map(|n| n.get_chain_id()).collect();

    // let rpc_uri_map = load_rpc_uris(&chain_ids);

    let app_state = AppState {
        database: Arc::clone(&database),

        indexing_state: IndexingState::default(),
    };

    //   let app_config = AppConfig {  };

    let index_rate: u64 = std::env::var("PULSE_TIME_MS")
        .ok()
        .map(|i| i.parse().ok())
        .flatten()
        .unwrap_or(4000);

    start(app_state, index_rate).await;
}

async fn start(mut app_state: AppState, tick_interval_time_ms: u64) {
    let mut tick_interval = interval(Duration::from_millis(tick_interval_time_ms));

    loop {
        select! {
            _ = tick_interval.tick() => {


                app_state = poll_trigger_and_emit_post(
                    app_state,
                  //  &app_config
                ).await;

            }

        }
    }
}

/*

Find the next webhook_trigger who is 'pending' and has < 3 attempts
  Increment its attempts and make an attempt (POST) !


*/

async fn poll_trigger_and_emit_post(
    mut app_state: AppState,
    // app_config: &AppConfig,
) -> AppState {
    let offset = app_state.indexing_state.event_id_offset.clone();

    let psql_db = app_state.database.lock().await;

    let next_unacked_trigger =
        WebhookTriggersModel::find_next_pending_trigger_with_offset(offset, &psql_db).await;
    drop(psql_db);

    match next_unacked_trigger {
        Err(_) => {
            //reset?

            app_state.indexing_state.event_id_offset = None;
        }

        Ok(Some(selected_trig_record)) => {
            let trig_id = selected_trig_record.id.clone();

            app_state.indexing_state.event_id_offset = Some(trig_id.clone().into());

            // let trig =  & selected_trig_record.entry;

            println!("poll 3 ");

            //do the POST thing !

            let payload =
                DefiRelayWebhookPayload::from_webhook_trigger_joined(selected_trig_record);

            //  let post_endpoint_data = payload.to_endpoint_url_and_data();

            let webhook_response = perform_req(&payload).await;
            // increment attempt !

            println!("webhook res {:?} ", webhook_response);

            let mut webhook_succeeded = false;

            if let Ok(webhook_response) = webhook_response {
                if webhook_response.status() == StatusCode::OK {
                    // 200

                    webhook_succeeded = true;
                }
            }

            if webhook_succeeded {
                let psql_db = app_state.database.lock().await;
                let _incremented = WebhookTriggersModel::update_status(
                    trig_id.clone().into(),
                    WebhookTriggerStatus::Sent,
                    &psql_db,
                )
                .await;
                drop(psql_db);
            } else {
                let psql_db = app_state.database.lock().await;
                let _incremented = WebhookTriggersModel::increment_trigger_attempts(
                    trig_id.clone().into(),
                    &psql_db,
                )
                .await;
                drop(psql_db);
            }
        }

        Ok(None) => {
            //reset?

            app_state.indexing_state.event_id_offset = None;
        }
    }

    app_state
}

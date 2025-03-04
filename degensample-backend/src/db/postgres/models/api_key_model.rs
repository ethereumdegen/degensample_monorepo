use crate::app_state::AppState;
use actix_web::web::Data;
use chrono::{DateTime, Utc};
use degen_sql::db::postgres::{models::model::PostgresModelError, postgres_db::Database};
use ethers::types::Address;
use rand::Rng;
use serde::Serialize;
use tokio_postgres::Row;

use crate::types::domains::eth_address::DomainEthAddress;
use crate::types::selected_record::SelectedRecord;
use crate::util::built_from_row::BuiltFromDbRow;

use super::auth_sessions_model::validate_session_token;

/*

CREATE TABLE provider_api_key (
    id SERIAL PRIMARY KEY,



    provider_id INT REFERENCES providers(id),

    apikey TEXT NOT NULL ,


    name TEXT,

    scopes TEXT ,



    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()


);



*/

/// Represents an API key associated with a provider.
#[derive(Serialize, Clone, Debug)]
pub struct ApiKey {
    pub owner_wallet_address: DomainEthAddress,
    pub apikey: String,
    pub name: Option<String>,
    pub scopes: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl BuiltFromDbRow for ApiKey {
    fn from_row(row: &Row) -> Option<Self> {
        Some(Self {
            owner_wallet_address: row.get("owner_wallet_address"),
            apikey: row.get("apikey"),
            name: row.get("name"),
            scopes: row.get("scopes"),
            created_at: row.get("created_at"),
        })
    }
}

impl ApiKey {
    /// Creates a new `ApiKey` instance.
    pub fn new(
        owner_wallet_address: DomainEthAddress,
        name: Option<String>,
        scopes: Option<String>,
    ) -> Self {
        Self {
            owner_wallet_address,
            apikey: ApiKey::generate_api_key(),
            name,
            scopes,
            created_at: chrono::Utc::now(),
        }
    }

    fn generate_api_key() -> String {
        let mut rng = rand::thread_rng();
        (0..32)
            .map(|_| rng.gen_range(0..16))
            .map(|v| format!("{:x}", v))
            .collect()
    }
}

pub struct ApiKeysModel {}

impl ApiKeysModel {
    /// Inserts a new `ProviderApiKey` into the database.
    pub async fn insert_one(
        api_key: ApiKey,
        psql_db: &Database,
    ) -> Result<i32, PostgresModelError> {
        let insert_query = "INSERT INTO api_keys (owner_wallet_address, apikey, name, scopes)
                            VALUES ($1, $2, $3, $4)
                            RETURNING id;";
        let result = psql_db
            .query_one(
                insert_query,
                &[
                    &api_key.owner_wallet_address,
                    &api_key.apikey,
                    &api_key.name,
                    &api_key.scopes,
                ],
            )
            .await;

        match result {
            Ok(row) => Ok(row.get::<_, i32>("id")),
            Err(e) => Err(e.into()),
        }
    }

    /// Retrieves a `ProviderApiKey` by API key.
    pub async fn find_by_apikey(
        apikey: String,
        psql_db: &Database,
    ) -> Result<SelectedRecord<ApiKey>, PostgresModelError> {
        let query = "SELECT * FROM api_keys WHERE apikey = $1 LIMIT 1;";
        let result = psql_db.query_one(query, &[&apikey]).await?;

        SelectedRecord::<ApiKey>::from_row(&result).ok_or_else(|| {
            PostgresModelError::RowParseError(Some("Failed to build ApiKey from row".to_string()))
        })
    }

    pub async fn find_all_by_wallet_address(
        wallet_address: &DomainEthAddress,
        psql_db: &Database,
    ) -> Result<Vec<SelectedRecord<ApiKey>>, PostgresModelError> {
        let query =
            "SELECT * FROM api_keys WHERE owner_wallet_address = $1 ORDER BY created_at DESC;";
        let result = psql_db.query(query, &[wallet_address]).await?;

        let api_keys = result
            .iter()
            .filter_map(|row| SelectedRecord::<ApiKey>::from_row(row))
            .collect();

        Ok(api_keys)
    }

    /// Deletes an API key by ID, but only if it belongs to the specified wallet address
    /*pub async fn delete_by_id(
        id: i32,
        wallet_address: &DomainEthAddress,
        psql_db: &Database,
    ) -> Result<bool, PostgresModelError> {
        // First verify the API key belongs to the wallet address
        let check_query = "SELECT COUNT(*) FROM api_keys WHERE id = $1 AND owner_wallet_address = $2;";
        let check_result = psql_db.query_one(check_query, &[&id, wallet_address]).await?;
        let count: i64 = check_result.get(0);

        if count == 0 {
            // API key doesn't exist or doesn't belong to this wallet
            return Ok(false);
        }

        // Now delete the API key
        let delete_query = "DELETE FROM api_keys WHERE id = $1 AND owner_wallet_address = $2;";
        let result = psql_db.execute(delete_query, &[&id, wallet_address]).await;

        match result {
            Ok(rows_affected) => Ok(rows_affected > 0),
            Err(e) => Err(e.into())
        }
    }*/

    // make this only DISABLE it ?? ehh whatever
    pub async fn delete_by_apikey(
        apikey: &str,
        psql_db: &Database,
    ) -> Result<bool, PostgresModelError> {
        // First verify the API key belongs to the wallet address
        let check_query = "SELECT COUNT(*) FROM api_keys WHERE apikey = $1  ;";
        let check_result = psql_db.query_one(check_query, &[&apikey]).await?;
        let count: i64 = check_result.get(0);

        if count == 0 {
            // API key doesn't exist or doesn't belong to this wallet
            return Ok(false);
        }

        // Now delete the API key
        let delete_query = "DELETE FROM api_keys WHERE apikey = $1 ;";
        let result = psql_db.execute(delete_query, &[&apikey]).await;

        match result {
            Ok(rows_affected) => Ok(rows_affected > 0),
            Err(e) => Err(e.into()),
        }
    }
}

pub async fn validate_api_key(
    api_key: &String,
    app_state: &Data<AppState>,
) -> Option<ApiKeyOwnerData> {
    let existing_api_key =
        ApiKeysModel::find_by_apikey(api_key.to_string(), &app_state.database).await;

    if let Ok(selected_api_key) = existing_api_key {
        let owner_data = ApiKeyOwnerData {
            owner_public_address: selected_api_key.entry.owner_wallet_address.0,
        };

        return Some(owner_data);
    }

    None
}

pub async fn validate_api_key_or_session_token(
    api_key: &String,
    app_state: &Data<AppState>,
) -> Option<ApiKeyOwnerData> {
    if let Some(api_key_owner_data) = validate_api_key(api_key, app_state).await {
        return Some(api_key_owner_data);
    }

    if let Some(session_token_data) = validate_session_token(api_key, app_state).await {
        return Some(ApiKeyOwnerData {
            owner_public_address: session_token_data.public_address.0,
        });
    }

    None
}

pub struct ApiKeyOwnerData {
    pub owner_public_address: Address,
    //pub provider_id: i32
}

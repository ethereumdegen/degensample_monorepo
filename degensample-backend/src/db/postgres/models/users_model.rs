use degen_sql::db::postgres::{models::model::PostgresModelError, postgres_db::Database};
use serde::{Deserialize, Serialize};

use crate::types::domains::eth_address::DomainEthAddress;

/// A user entity is derived from their Ethereum wallet address
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct User {
    pub wallet_address: DomainEthAddress,
}

impl User {
    /// Creates a new User instance
    pub fn new(wallet_address: DomainEthAddress) -> Self {
        Self { wallet_address }
    }
}

/// User stats data structure
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UserStats {
    pub wallet_address: DomainEthAddress,
    pub invoices_count: i64,
    pub api_keys_count: i64,
    pub payments_count: i64,
}

pub struct UsersModel {}

impl UsersModel {
    /// Get stats for a user by wallet address
    pub async fn get_user_stats(
        wallet_address: &DomainEthAddress,
        psql_db: &Database,
    ) -> Result<UserStats, PostgresModelError> {
        // Get invoices count
        let invoices_count_query = "SELECT COUNT(*) FROM invoices WHERE owner_address = $1";
        let invoices_count_result = psql_db
            .query_one(invoices_count_query, &[wallet_address])
            .await?;
        let invoices_count: i64 = invoices_count_result.get(0);

        // Get API keys count
        let api_keys_count_query = "SELECT COUNT(*) FROM api_keys WHERE owner_wallet_address = $1";
        let api_keys_count_result = psql_db
            .query_one(api_keys_count_query, &[wallet_address])
            .await?;
        let api_keys_count: i64 = api_keys_count_result.get(0);

        // Get payments count where this user is a recipient (included in pay_to_array)
        let payments_count_query = "SELECT COUNT(*) FROM payments WHERE $1 = ANY(pay_to_array)";
        let payments_count_result = match psql_db
            .query_one(payments_count_query, &[wallet_address])
            .await
        {
            Ok(row) => row,
            Err(_) => {
                // If the query fails (e.g., table doesn't exist), set payments count to 0
                return Ok(UserStats {
                    wallet_address: wallet_address.clone(),
                    invoices_count,
                    api_keys_count,
                    payments_count: 0,
                });
            }
        };
        let payments_count: i64 = payments_count_result.get(0);

        Ok(UserStats {
            wallet_address: wallet_address.clone(),
            invoices_count,
            api_keys_count,
            payments_count,
        })
    }
}

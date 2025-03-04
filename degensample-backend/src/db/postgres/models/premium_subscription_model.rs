use chrono::DateTime;
use chrono::Utc;
use degen_sql::db::postgres::{models::model::PostgresModelError, postgres_db::Database};
use serde::{Deserialize, Serialize};

use crate::types::domains::eth_address::DomainEthAddress;

/*
These get added by a bot who is scraping vibegraph ... for payments to our
defi relay account




*/

/// Premium subscription status for a user
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PremiumSubscription {
    pub wallet_address: DomainEthAddress,
    pub is_premium: bool,
    pub created_at: DateTime<Utc>,
}

impl PremiumSubscription {
    /// Creates a new PremiumSubscription instance
    pub fn new(
        wallet_address: DomainEthAddress,
        is_premium: bool,
        created_at: DateTime<Utc>,
    ) -> Self {
        Self {
            wallet_address,
            is_premium,
            created_at,
        }
    }
}

pub struct PremiumSubscriptionsModel {}

impl PremiumSubscriptionsModel {
    /// Get premium subscription status for a user by wallet address
    pub async fn get_premium_status(
        wallet_address: &DomainEthAddress,
        psql_db: &Database,
    ) -> Result<Option<PremiumSubscription>, PostgresModelError> {
        use degen_sql::sql_builder::{OrderingDirection, SqlBuilder, SqlStatementBase};
        use std::collections::BTreeMap;
        use std::sync::Arc;
        use tokio_postgres::types::ToSql;

        // Create SQL builder with where condition
        let mut where_params: BTreeMap<String, Arc<dyn ToSql + Sync>> = BTreeMap::new();
        where_params.insert(
            "public_address".to_string(),
            Arc::new(wallet_address.clone()),
        );

        let sql_builder = SqlBuilder {
            statement_base: SqlStatementBase::SelectAll,
            table_name: "premium_subscriptions".to_string(),
            where_params,
            order: Some(("created_at".try_into().unwrap(), OrderingDirection::DESC)),
            limit: Some(1), // Only need the most recent record
            pagination: None,
        };

        // Build the SQL query and parameters
        let (query, params) = sql_builder.build();
        let built_params = &params.iter().map(|x| &**x).collect::<Vec<_>>();

        // Execute the query
        let row_result = psql_db.query(&query, &built_params).await;

        match row_result {
            Ok(rows) => {
                if rows.is_empty() {
                    return Ok(None);
                }

                let row = &rows[0];
                let is_premium: bool = row.get("is_premium");
                let created_at: DateTime<Utc> = row.get("created_at");

                Ok(Some(PremiumSubscription {
                    wallet_address: wallet_address.clone(),
                    is_premium,
                    created_at,
                }))
            }
            Err(e) => {
                // Handle error similar to before but with cleaner approach
                let error_str = format!("{:?}", e);
                if error_str.contains("RowCount") {
                    return Ok(None);
                }

                Err(e.into())
            }
        }
    }
}

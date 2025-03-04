use std::borrow::Cow;
use utoipa::openapi::schema::SchemaType;
use utoipa::openapi::KnownFormat;
use utoipa::openapi::ObjectBuilder;
use utoipa::openapi::RefOr;
use utoipa::openapi::Schema;
use utoipa::openapi::SchemaFormat;
use utoipa::PartialSchema;

use chrono::{DateTime, Utc};

use degen_sql::db::postgres::{models::model::PostgresModelError, postgres_db::Database};
use serde::{Deserialize, Serialize};
use tokio_postgres::Row;

use crate::types::domains::eth_address::DomainEthAddress;
use crate::types::domains::json::DomainJson;
use crate::types::selected_record::SelectedRecord;
use crate::util::built_from_row::BuiltFromDbRow;

/*
CREATE TABLE webhook_urls (
    id SERIAL PRIMARY KEY,

    owner_wallet_address VARCHAR(255) NOT NULL,

    webhook_url TEXT NOT NULL,

    scopes JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
*/

/// Represents a webhook URL associated with a user's wallet.
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WebhookUrl {
    pub owner_wallet_address: DomainEthAddress,
    pub webhook_url: String,
    pub scopes: Option<DomainJson>,
    pub created_at: DateTime<Utc>,
}

impl BuiltFromDbRow for WebhookUrl {
    fn from_row(row: &Row) -> Option<Self> {
        Some(Self {
            owner_wallet_address: row.get("owner_wallet_address"),
            webhook_url: row.get("webhook_url"),
            scopes: row.get("scopes"),
            created_at: row.get("created_at"),
        })
    }
}

impl utoipa::ToSchema for WebhookUrl {
    fn name() -> Cow<'static, str> {
        Cow::Borrowed("DomainBytes32")
    }

    fn schemas(schemas: &mut Vec<(String, RefOr<Schema>)>) {
        schemas.push((Self::name().to_string(), Self::schema()));
    }
}

impl utoipa::PartialSchema for WebhookUrl {
    fn schema() -> RefOr<Schema> {
        RefOr::T(Schema::Object(
            ObjectBuilder::new()
                .schema_type(SchemaType::Type(utoipa::openapi::Type::Integer))
                .format(Some(SchemaFormat::KnownFormat(KnownFormat::Byte)))
                /*.items(Some(Box::new(RefOr::T(Schema::Object(
                    ObjectBuilder::new()
                        .schema_type( SchemaType::Type(utoipa::openapi::Type::Integer ) ) // Changed to String since U256 is represented as a string
                        .description(Some("U256 number as string"))
                        .build()
                )))))*/
                .build(),
        ))
    }
}

impl WebhookUrl {
    /// Creates a new `WebhookUrl` instance.
    pub fn new(
        owner_wallet_address: DomainEthAddress,
        webhook_url: String,
        scopes: Option<DomainJson>,
    ) -> Self {
        Self {
            owner_wallet_address,
            webhook_url,
            scopes,
            created_at: chrono::Utc::now(),
        }
    }
}

pub struct WebhookUrlsModel {}

impl WebhookUrlsModel {
    /// Retrieves a `WebhookUrl` by its ID
    pub async fn find_by_id(
        id: i32,
        psql_db: &Database,
    ) -> Result<Option<SelectedRecord<WebhookUrl>>, PostgresModelError> {
        let query = "SELECT * FROM webhook_urls WHERE id = $1";
        let result = psql_db.query_one(query, &[&id]).await;

        match result {
            Ok(row) => Ok(SelectedRecord::from_row(&row)),
            Err(e) => {
                if e.to_string().contains("no rows") {
                    Ok(None)
                } else {
                    Err(e.into())
                }
            }
        }
    }

    /// Inserts a new `WebhookUrl` into the database.
    pub async fn insert_one(
        webhook_url: WebhookUrl,
        psql_db: &Database,
    ) -> Result<i32, PostgresModelError> {
        let insert_query = "INSERT INTO webhook_urls (owner_wallet_address, webhook_url, scopes)
                            VALUES ($1, $2, $3)
                            RETURNING id;";
        let result = psql_db
            .query_one(
                insert_query,
                &[
                    &webhook_url.owner_wallet_address,
                    &webhook_url.webhook_url,
                    &webhook_url.scopes,
                ],
            )
            .await;

        match result {
            Ok(row) => Ok(row.get::<_, i32>("id")),
            Err(e) => Err(e.into()),
        }
    }

    /// Retrieves a `WebhookUrl` by owner's wallet address
    pub async fn find_by_owner_address(
        owner_wallet_address: &DomainEthAddress,
        psql_db: &Database,
    ) -> Result<Vec<SelectedRecord<WebhookUrl>>, PostgresModelError> {
        use degen_sql::sql_builder::{OrderingDirection, SqlBuilder, SqlStatementBase};
        use std::collections::BTreeMap;
        use std::sync::Arc;
        use tokio_postgres::types::ToSql;

        // Create SQL builder with where condition
        let mut where_params: BTreeMap<String, Arc<dyn ToSql + Sync>> = BTreeMap::new();
        where_params.insert(
            "owner_wallet_address".to_string(),
            Arc::new(owner_wallet_address.clone()),
        );

        let sql_builder = SqlBuilder {
            statement_base: SqlStatementBase::SelectAll,
            table_name: "webhook_urls".to_string(),
            where_params,
            order: Some(("created_at".to_string(), OrderingDirection::DESC)),
            limit: None,
            pagination: None,
        };

        // Build the SQL query and parameters
        let (query, params) = sql_builder.build();
        let built_params = &params.iter().map(|x| &**x).collect::<Vec<_>>();

        // Execute the query
        let rows = psql_db.query(&query, &built_params).await?;

        let webhook_urls = rows
            .iter()
            .filter_map(|row| SelectedRecord::<WebhookUrl>::from_row(row))
            .collect();

        Ok(webhook_urls)
    }

    /// Delete a webhook URL by ID
    pub async fn delete_by_id(
        id: i32,
        //owner_wallet_address: &DomainEthAddress,
        psql_db: &Database,
    ) -> Result<bool, PostgresModelError> {
        use degen_sql::sql_builder::{SqlBuilder, SqlStatementBase};
        use std::collections::BTreeMap;
        use std::sync::Arc;
        use tokio_postgres::types::ToSql;

        // First verify the webhook URL belongs to the wallet address
        let mut check_params: BTreeMap<String, Arc<dyn ToSql + Sync>> = BTreeMap::new();
        check_params.insert("id".to_string(), Arc::new(id));
        // check_params.insert("owner_wallet_address".to_string(), Arc::new(owner_wallet_address.clone()));

        let check_builder = SqlBuilder {
            statement_base: SqlStatementBase::SelectCountAll,
            table_name: "webhook_urls".to_string(),
            where_params: check_params,
            order: None,
            limit: None,
            pagination: None,
        };

        // Build the SQL query and parameters
        let (check_query, check_params) = check_builder.build();
        let built_check_params = &check_params.iter().map(|x| &**x).collect::<Vec<_>>();

        // Execute the count query
        let row = psql_db.query_one(&check_query, &built_check_params).await?;
        let count: i64 = row.get(0);

        if count == 0 {
            // Webhook URL doesn't exist or doesn't belong to this wallet
            return Ok(false);
        }

        // Now delete the webhook URL
        let mut delete_params: BTreeMap<String, Arc<dyn ToSql + Sync>> = BTreeMap::new();
        delete_params.insert("id".to_string(), Arc::new(id));
        //   delete_params.insert("owner_wallet_address".to_string(), Arc::new(owner_wallet_address.clone()));

        let delete_builder = SqlBuilder {
            statement_base: SqlStatementBase::Delete,
            table_name: "webhook_urls".to_string(),
            where_params: delete_params,
            order: None,
            limit: None,
            pagination: None,
        };

        // Build the SQL query and parameters
        let (delete_query, delete_params) = delete_builder.build();
        let built_delete_params = &delete_params.iter().map(|x| &**x).collect::<Vec<_>>();

        // Execute the delete query
        let result = psql_db.execute(&delete_query, &built_delete_params).await?;

        Ok(result > 0)
    }
}

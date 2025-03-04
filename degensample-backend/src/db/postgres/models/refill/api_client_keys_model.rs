use std::borrow::Cow;
use std::collections::BTreeMap;
use std::sync::Arc;
use tokio_postgres::types::ToSql;
use utoipa::openapi::schema::SchemaType;
use utoipa::openapi::KnownFormat;
use utoipa::openapi::ObjectBuilder;
use utoipa::openapi::RefOr;
use utoipa::openapi::Schema;
use utoipa::openapi::SchemaFormat;
use utoipa::PartialSchema;
use utoipa::ToSchema;

use chrono::{DateTime, Utc};
use degen_sql::db::postgres::{models::model::PostgresModelError, postgres_db::Database};
use degen_sql::pagination::PaginationData;
use degen_sql::sql_builder::{OrderingDirection, SqlBuilder, SqlStatementBase};
use rand::Rng;
use serde::{Deserialize, Serialize};
use tokio_postgres::Row;

use crate::types::domains::bytes32::DomainBytes32;
use crate::types::domains::bytes8::DomainBytes8;
use crate::types::domains::decimal::DomainDecimal;
use crate::types::domains::eth_address::DomainEthAddress;
use crate::types::selected_record::SelectedRecord;
use crate::util::built_from_row::BuiltFromDbRow;

/// Represents an API client key
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ApiClientKey {
    pub name: Option<String>,
    pub client_key: String,
    pub client_address: DomainEthAddress,
    pub workspace_uuid: DomainBytes8,
    pub credits: DomainDecimal,
    pub created_at: DateTime<Utc>,
}

impl BuiltFromDbRow for ApiClientKey {
    fn from_row(row: &Row) -> Option<Self> {
        Some(Self {
            name: row.get("name"),
            client_key: row.get("client_key"),
            client_address: row.get("client_address"),
            workspace_uuid: row.get("workspace_uuid"),
            credits: row.get("credits"),
            created_at: row.get("created_at"),
        })
    }
}

impl utoipa::ToSchema for ApiClientKey {
    fn name() -> Cow<'static, str> {
        Cow::Borrowed("ApiClientKey")
    }

    fn schemas(schemas: &mut Vec<(String, RefOr<Schema>)>) {
        schemas.push((Self::name().to_string(), Self::schema()));
    }
}

impl utoipa::PartialSchema for ApiClientKey {
    fn schema() -> RefOr<Schema> {
        RefOr::T(Schema::Object(
            ObjectBuilder::new()
                .schema_type(SchemaType::Type(utoipa::openapi::Type::Integer))
                .format(Some(SchemaFormat::KnownFormat(KnownFormat::Byte)))
                .build(),
        ))
    }
}

impl ApiClientKey {
    /// Creates a new `ApiClientKey` instance
    pub fn new(
        name: Option<String>,
        client_address: DomainEthAddress,
        workspace_uuid: DomainBytes8,
    ) -> Self {
        Self {
            name,
            client_key: ApiClientKey::generate_client_key(),
            client_address,
            workspace_uuid,
            credits: DomainDecimal::default(),
            created_at: Utc::now(),
        }
    }

    fn generate_client_key() -> String {
        let mut rng = rand::thread_rng();
        (0..32)
            .map(|_| rng.gen_range(0..16))
            .map(|v| format!("{:x}", v))
            .collect()
    }
}

pub struct ApiClientKeysModel {}

impl ApiClientKeysModel {
    /// Inserts a new ApiClientKey into the database
    pub async fn insert_one(
        client_key: ApiClientKey,
        psql_db: &Database,
    ) -> Result<i32, PostgresModelError> {
        let insert_query = "INSERT INTO api_client_keys (name, client_key, client_address, workspace_uuid, credits)
                           VALUES ($1, $2, $3, $4, $5)
                           RETURNING id;";

        let result = psql_db
            .query_one(
                insert_query,
                &[
                    &client_key.name,
                    &client_key.client_key,
                    &client_key.client_address,
                    &client_key.workspace_uuid,
                    &client_key.credits,
                ],
            )
            .await;

        match result {
            Ok(row) => Ok(row.get::<_, i32>("id")),
            Err(e) => Err(e.into()),
        }
    }

    /// Finds a client key by its value
    pub async fn find_by_client_key(
        client_key: &str,
        psql_db: &Database,
    ) -> Result<SelectedRecord<ApiClientKey>, PostgresModelError> {
        let query = "SELECT * FROM api_client_keys WHERE client_key = $1 LIMIT 1;";
        let result = psql_db.query_one(query, &[&client_key]).await?;

        SelectedRecord::<ApiClientKey>::from_row(&result).ok_or_else(|| {
            PostgresModelError::RowParseError(Some(
                "Failed to build ApiClientKey from row".to_string(),
            ))
        })
    }

    /// Finds all client keys for a specific workspace with optional pagination
    pub async fn find_all_by_workspace(
        workspace_uuid: &DomainBytes8,
        psql_db: &Database,
        pagination: Option<&PaginationData>,
    ) -> Result<Vec<SelectedRecord<ApiClientKey>>, PostgresModelError> {
        // Create SQL builder with where condition
        let mut where_params: BTreeMap<String, Arc<dyn ToSql + Sync>> = BTreeMap::new();
        where_params.insert(
            "workspace_uuid".to_string(),
            Arc::new(workspace_uuid.clone()),
        );

        let sql_builder = SqlBuilder {
            statement_base: SqlStatementBase::SelectAll,
            table_name: "api_client_keys".to_string(),
            where_params,
            order: Some(("created_at".to_string(), OrderingDirection::DESC)),
            limit: None,
            pagination: pagination.cloned(),
        };

        // Build the SQL query and parameters
        let (query, params) = sql_builder.build();
        let built_params = &params.iter().map(|x| &**x).collect::<Vec<_>>();

        // Execute the query
        let result = psql_db.query(&query, &built_params).await?;

        let client_keys = result
            .iter()
            .filter_map(|row| SelectedRecord::<ApiClientKey>::from_row(row))
            .collect();

        Ok(client_keys)
    }

    /// Count total client keys for a workspace
    pub async fn count_by_workspace(
        workspace_uuid: &DomainBytes8,
        psql_db: &Database,
    ) -> Result<i64, PostgresModelError> {
        // Create SQL builder with where condition for count query
        let mut where_params: BTreeMap<String, Arc<dyn ToSql + Sync>> = BTreeMap::new();
        where_params.insert(
            "workspace_uuid".to_string(),
            Arc::new(workspace_uuid.clone()),
        );

        let sql_builder = SqlBuilder {
            statement_base: SqlStatementBase::SelectCountAll,
            table_name: "api_client_keys".to_string(),
            where_params,
            order: None, // Not needed for COUNT queries
            limit: None,
            pagination: None, // No pagination for COUNT queries
        };

        // Build the SQL query and parameters
        let (query, params) = sql_builder.build();
        let built_params = &params.iter().map(|x| &**x).collect::<Vec<_>>();

        // Execute the query
        let row = psql_db.query_one(&query, &built_params).await?;
        let count: i64 = row.get(0);

        Ok(count)
    }

    /// Finds all client keys for a specific workspace and client address with optional pagination
   /* pub async fn find_all_for_workspace_client(
        workspace_uuid: &str,
        client_address: &DomainEthAddress,
        psql_db: &Database,
        pagination: Option<&PaginationData>,
    ) -> Result<Vec<SelectedRecord<ApiClientKey>>, PostgresModelError> {
        // Create SQL builder with where conditions
        let mut where_params: BTreeMap<String, Arc<dyn ToSql + Sync>> = BTreeMap::new();
        where_params.insert(
            "workspace_uuid".to_string(),
            Arc::new(workspace_uuid.to_string()),
        );
        where_params.insert(
            "client_address".to_string(),
            Arc::new(client_address.clone()),
        );

        let sql_builder = SqlBuilder {
            statement_base: SqlStatementBase::SelectAll,
            table_name: "api_client_keys".to_string(),
            where_params,
            order: Some(("created_at".to_string(), OrderingDirection::DESC)),
            limit: None,
            pagination: pagination.cloned(),
        };

        // Build the SQL query and parameters
        let (query, params) = sql_builder.build();
        let built_params = &params.iter().map(|x| &**x).collect::<Vec<_>>();

        // Execute the query
        let result = psql_db.query(&query, &built_params).await?;

        let client_keys = result
            .iter()
            .filter_map(|row| SelectedRecord::<ApiClientKey>::from_row(row))
            .collect();

        Ok(client_keys)
    }*/
    
    /// Finds all client keys for a specific workspace and client address with optional pagination
    pub async fn find_all_for_workspace_client(
        workspace_uuid: &DomainBytes8,
        client_address: &DomainEthAddress,
        psql_db: &Database,
        pagination: Option<&PaginationData>,
    ) -> Result<Vec<SelectedRecord<ApiClientKey>>, PostgresModelError> {
        // Create SQL builder with where conditions
        let mut where_params: BTreeMap<String, Arc<dyn ToSql + Sync>> = BTreeMap::new();
        where_params.insert(
            "workspace_uuid".to_string(),
            Arc::new(workspace_uuid.clone()),
        );
        where_params.insert(
            "client_address".to_string(),
            Arc::new(client_address.clone()),
        );

        let sql_builder = SqlBuilder {
            statement_base: SqlStatementBase::SelectAll,
            table_name: "api_client_keys".to_string(),
            where_params,
            order: Some(("created_at".to_string(), OrderingDirection::DESC)),
            limit: None,
            pagination: pagination.cloned(),
        };

        // Build the SQL query and parameters
        let (query, params) = sql_builder.build();
        let built_params = &params.iter().map(|x| &**x).collect::<Vec<_>>();

        // Execute the query
        let result = psql_db.query(&query, &built_params).await?;

        let client_keys = result
            .iter()
            .filter_map(|row| SelectedRecord::<ApiClientKey>::from_row(row))
            .collect();

        Ok(client_keys)
    }
    
    /// Finds a single client key for a specific workspace and client address
    /// Since there should only be one key per workspace+client, this is more appropriate
    /// than the find_all_for_workspace_client method in most cases
    pub async fn find_one_for_workspace_client(
        workspace_uuid: &DomainBytes8,
        client_address: &DomainEthAddress,
        psql_db: &Database,
    ) -> Result<SelectedRecord<ApiClientKey>, PostgresModelError> {
        let mut where_params: BTreeMap<String, Arc<dyn ToSql + Sync>> = BTreeMap::new();
        where_params.insert(
            "workspace_uuid".to_string(),
            Arc::new(workspace_uuid.clone()),
        );
        where_params.insert(
            "client_address".to_string(),
            Arc::new(client_address.clone()),
        );

        let sql_builder = SqlBuilder {
            statement_base: SqlStatementBase::SelectAll,
            table_name: "api_client_keys".to_string(),
            where_params,
            order: Some(("created_at".to_string(), OrderingDirection::DESC)),
            limit: Some(1), // Limit to 1 result
            pagination: None,
        };


        // Build the SQL query and parameters
        let (query, params) = sql_builder.build();
        let built_params = &params.iter().map(|x| &**x).collect::<Vec<_>>();

        // Execute the query
        let result = psql_db.query_one(&query, &built_params).await?;




        SelectedRecord::<ApiClientKey>::from_row(&result).ok_or_else(|| {
            PostgresModelError::RowParseError(Some(
                "Failed to build ApiClientKey from row".to_string(),
            ))
        })
    }

    /// Updates the credits for a client key
    pub async fn update_credits(
        client_key: &DomainBytes32,
        credits: &DomainDecimal,
        psql_db: &Database,
    ) -> Result<bool, PostgresModelError> {
        let update_query = "UPDATE api_client_keys SET credits = $1 WHERE client_key = $2;";
        let result = psql_db.execute(update_query, &[credits, &client_key]).await;

        match result {
            Ok(rows_affected) => Ok(rows_affected > 0),
            Err(e) => Err(e.into()),
        }
    }
    
    /// Updates the credits for a client key by workspace and client address
    /// This applies a delta change to the current credits
    pub async fn update_credits_by_workspace_and_client(
        workspace_uuid: &DomainBytes8,
        client_address: &DomainEthAddress,
        credits_delta: &DomainDecimal,
        psql_db: &Database,
    ) -> Result<DomainDecimal, PostgresModelError> {
        // First, get the current client key to find its current credits
        //let client_key = Self::find_one_for_workspace_client(workspace_uuid, client_address, psql_db).await?;
        
        let find_query = "SELECT * from api_client_keys  
            WHERE workspace_uuid = $1 AND client_address = $2   
            ORDER BY created_at DESC  LIMIT 1;   
          ";

          let client_key_row = psql_db.query_one(
             &find_query, 
             &[ &workspace_uuid, &client_address ] ).await?;



          let client_key = ApiClientKey::from_row( &client_key_row ) 
          .ok_or( PostgresModelError::RowParseError(None) )   ?; 

          // params [ &workspace_uuid, &client_address ]

 




        // Calculate new credits value by adding the delta (can be positive or negative)
        let current_credits = client_key.credits;
        let new_credits = current_credits + credits_delta;
        
        // its OK if credits go below zero 
        /*let final_credits = if new_credits.0 < Decimal::default() {
            DomainDecimal::default()
        } else {
            new_credits
        };*/
        
        // Update the credits in the database
        let update_query = "UPDATE api_client_keys SET credits = $1 WHERE workspace_uuid = $2 AND client_address = $3 RETURNING credits;";
        let result = psql_db.query_one(update_query, &[&new_credits, &workspace_uuid, &client_address]).await?;
        
        // Return the new credits value
        let updated_credits: DomainDecimal = result.get("credits");
        Ok(updated_credits)
    }
}

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
use serde::{Deserialize, Serialize};
use tokio_postgres::Row;

use crate::types::domains::bytes32::DomainBytes32;
use crate::types::domains::bytes8::DomainBytes8;
use crate::types::domains::decimal::DomainDecimal;
use crate::types::domains::eth_address::DomainEthAddress;
use crate::types::domains::uint256::DomainUint256;
use crate::types::selected_record::SelectedRecord;
use crate::util::built_from_row::BuiltFromDbRow;

/// Represents an API credit refill record
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ApiCreditRefill {
    pub client_address: DomainEthAddress,
    pub invoice_uuid: String,
    pub workspace_uuid: DomainBytes8,
    pub payment_token_address: DomainEthAddress,
    pub payment_amount_raw: DomainUint256,
    pub status : String, 
    pub created_at: DateTime<Utc>,
}

impl BuiltFromDbRow for ApiCreditRefill {
    fn from_row(row: &Row) -> Option<Self> {
        Some(Self {
            client_address: row.get("client_address"),
            invoice_uuid: row.get("invoice_uuid"),
            workspace_uuid: row.get("workspace_uuid"),
            payment_token_address: row.get("payment_token_address"),
            payment_amount_raw: row.get("payment_amount_raw"),
            status: row.get("status"),
            created_at: row.get("created_at"),
        })
    }
}

impl utoipa::ToSchema for ApiCreditRefill {
    fn name() -> Cow<'static, str> {
        Cow::Borrowed("ApiCreditRefill")
    }

    fn schemas(schemas: &mut Vec<(String, RefOr<Schema>)>) {
        schemas.push((Self::name().to_string(), Self::schema()));
    }
}

impl utoipa::PartialSchema for ApiCreditRefill {
    fn schema() -> RefOr<Schema> {
        RefOr::T(Schema::Object(
            ObjectBuilder::new()
                .schema_type(SchemaType::Type(utoipa::openapi::Type::Integer))
                .format(Some(SchemaFormat::KnownFormat(KnownFormat::Byte)))
                .build(),
        ))
    }
}

impl ApiCreditRefill {
    /// Creates a new `ApiCreditRefill` instance
    pub fn new(
        client_address: DomainEthAddress,
        invoice_uuid: String,
        workspace_uuid: DomainBytes8,
        payment_token_address: DomainEthAddress,
        payment_amount_raw: DomainUint256,
      
    ) -> Self {
        Self {
            client_address,
            invoice_uuid,
            workspace_uuid,
            payment_token_address,
            payment_amount_raw,
            created_at: Utc::now(),
            status : "pending".into()  
        }
    }
}

pub struct ApiCreditRefillsModel {}

impl ApiCreditRefillsModel {
    /// Inserts a new ApiCreditRefill into the database
    pub async fn insert_one(
        refill: &ApiCreditRefill,
        psql_db: &Database,
    ) -> Result<i32, PostgresModelError> {

       

        let insert_query = "INSERT INTO api_credit_refill (client_address, invoice_uuid, workspace_uuid, payment_token_address, payment_amount_raw, status)
                           VALUES ($1, $2, $3, $4, $5, $6)
                           RETURNING id;";

        let result = psql_db
            .query_one(
                insert_query,
                &[
                    &refill.client_address,
                    &refill.invoice_uuid,
                    &refill.workspace_uuid,
                    &refill.payment_token_address,
                    &refill.payment_amount_raw,
                    &refill.status
                ],
            )
            .await;

        match result {
            Ok(row) => Ok(row.get::<_, i32>("id")),
            Err(e) => {


                println!("refill error {:?}", e );

                Err(e.into())


            },
        }
    }

    /// Finds a credit refill by invoice_uuid
    pub async fn find_by_invoice_uuid(
        invoice_uuid: &str,
        psql_db: &Database,
    ) -> Result<SelectedRecord<ApiCreditRefill>, PostgresModelError> {
        let query = "SELECT * FROM api_credit_refill WHERE invoice_uuid = $1 LIMIT 1;";
        let result = psql_db.query_one(query, &[&invoice_uuid]).await?;

        SelectedRecord::<ApiCreditRefill>::from_row(&result).ok_or_else(|| {
            PostgresModelError::RowParseError(Some(
                "Failed to build ApiCreditRefill from row".to_string(),
            ))
        })
    }

    /// Finds all credit refills for a specific workspace with optional pagination
    pub async fn find_all_by_workspace(
        workspace_uuid: &DomainBytes8,
        psql_db: &Database,
        pagination: Option<&PaginationData>,
    ) -> Result<Vec<SelectedRecord<ApiCreditRefill>>, PostgresModelError> {
        // Create SQL builder with where condition
        let mut where_params: BTreeMap<String, Arc<dyn ToSql + Sync>> = BTreeMap::new();
        where_params.insert(
            "workspace_uuid".to_string(),
            Arc::new(workspace_uuid .clone() ),
        );

        let sql_builder = SqlBuilder {
            statement_base: SqlStatementBase::SelectAll,
            table_name: "api_credit_refill".to_string(),
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

        let refills = result
            .iter()
            .filter_map(|row| SelectedRecord::<ApiCreditRefill>::from_row(row))
            .collect();

        Ok(refills)
    }

    /// Finds all credit refills for a specific client address with optional pagination
    pub async fn find_all_by_client(
        client_address: &DomainEthAddress,
        psql_db: &Database,
        pagination: Option<&PaginationData>,
    ) -> Result<Vec<SelectedRecord<ApiCreditRefill>>, PostgresModelError> {
        // Create SQL builder with where condition
        let mut where_params: BTreeMap<String, Arc<dyn ToSql + Sync>> = BTreeMap::new();
        where_params.insert(
            "client_address".to_string(),
            Arc::new(client_address.clone()),
        );

        let sql_builder = SqlBuilder {
            statement_base: SqlStatementBase::SelectAll,
            table_name: "api_credit_refill".to_string(),
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

        let refills = result
            .iter()
            .filter_map(|row| SelectedRecord::<ApiCreditRefill>::from_row(row))
            .collect();

        Ok(refills)
    }

    /// Count total refills for a workspace
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
            table_name: "api_credit_refill".to_string(),
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
    
    /// Count total refills for a client address
    pub async fn count_by_client(
        client_address: &DomainEthAddress,
        psql_db: &Database,
    ) -> Result<i64, PostgresModelError> {
        // Create SQL builder with where condition for count query
        let mut where_params: BTreeMap<String, Arc<dyn ToSql + Sync>> = BTreeMap::new();
        where_params.insert(
            "client_address".to_string(),
            Arc::new(client_address.clone()),
        );

        let sql_builder = SqlBuilder {
            statement_base: SqlStatementBase::SelectCountAll,
            table_name: "api_credit_refill".to_string(),
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
    
    /// Finds all credit refills for a specific client address in a specific workspace with optional pagination
    pub async fn find_all_by_client_in_workspace(
        client_address: &DomainEthAddress,
        workspace_uuid: &DomainBytes8,
        psql_db: &Database,
        pagination: Option<&PaginationData>,
    ) -> Result<Vec<SelectedRecord<ApiCreditRefill>>, PostgresModelError> {
        // Create SQL builder with where conditions
        let mut where_params: BTreeMap<String, Arc<dyn ToSql + Sync>> = BTreeMap::new();
        where_params.insert(
            "client_address".to_string(),
            Arc::new(client_address.clone()),
        );
        where_params.insert(
            "workspace_uuid".to_string(),
            Arc::new(workspace_uuid.clone()),
        );

        let sql_builder = SqlBuilder {
            statement_base: SqlStatementBase::SelectAll,
            table_name: "api_credit_refill".to_string(),
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

        let refills = result
            .iter()
            .filter_map(|row| SelectedRecord::<ApiCreditRefill>::from_row(row))
            .collect();

        Ok(refills)
    }
    
    /// Count total refills for a client address in a specific workspace
    pub async fn count_by_client_in_workspace(
        client_address: &DomainEthAddress,
        workspace_uuid: &DomainBytes8,
        psql_db: &Database,
    ) -> Result<i64, PostgresModelError> {
        // Create SQL builder with where condition for count query
        let mut where_params: BTreeMap<String, Arc<dyn ToSql + Sync>> = BTreeMap::new();
        where_params.insert(
            "client_address".to_string(),
            Arc::new(client_address.clone()),
        );
        where_params.insert(
            "workspace_uuid".to_string(),
            Arc::new(workspace_uuid.clone()),
        );

        let sql_builder = SqlBuilder {
            statement_base: SqlStatementBase::SelectCountAll,
            table_name: "api_credit_refill".to_string(),
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

    //update the status to 'paid' 
      /// Updates the status of an API credit refill to 'paid'
  /*  pub async fn update_one_as_paid(
        invoice_uuid: &DomainBytes32,
        psql_db: &Database,
    ) -> Result<(), PostgresModelError> {

        let new_status = "paid"; 
        let update_query = "UPDATE api_credit_refill SET status = $1 WHERE invoice_uuid = $2;";
        
        let result = psql_db
            .execute(
                update_query,
                &[
                    & new_status,
                    &invoice_uuid,
                ],
            )
            .await;

        match result {
            Ok(_) => Ok(()),
            Err(e) => {
                println!("Update refill error: {:?}", e);
                Err(e.into())
            },
        }
    }*/
pub async fn update_one_as_paid(
    invoice_uuid: &DomainBytes32,
    psql_db: &Database,
) -> Result< Option< SelectedRecord<  ApiCreditRefill > >, PostgresModelError> {
    // Only update records with a 'pending' status
    let update_query = "
        UPDATE api_credit_refill 
        SET status = $1 
        WHERE invoice_uuid = $2 
        AND status = $3
        RETURNING *;";  // Return ID to check if any row was updated
    
    let result = psql_db
        .query_one(  // Use query_opt to handle cases where no rows match
            update_query,
            &[
                &"paid".to_string(),
                &invoice_uuid,
                &"pending".to_string(),
            ],
        )
        .await;
    
    match result {
        Ok( row ) => {
            
            let selected_record = SelectedRecord::from_row(&row ); 
            Ok(  selected_record   )
        },
    
        Err(e) => {
            println!("Update refill error: {:?}", e);
            Err(e.into())
        },
    }
}






}
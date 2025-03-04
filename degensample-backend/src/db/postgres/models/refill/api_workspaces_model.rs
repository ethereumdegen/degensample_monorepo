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

use crate::types::domains::bytes8::DomainBytes8;
use crate::types::domains::eth_address::DomainEthAddress;
use crate::types::selected_record::SelectedRecord;
use crate::util::built_from_row::BuiltFromDbRow;

/// Represents an API workspace
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ApiWorkspace {
    pub workspace_uuid: DomainBytes8,
    pub owner_address: DomainEthAddress,
    pub name: String,
    pub description: Option<String>,
    //  pub invoice_template_uuid: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl BuiltFromDbRow for ApiWorkspace {
    fn from_row(row: &Row) -> Option<Self> {
        Some(Self {
            workspace_uuid: row.get("workspace_uuid"),
            owner_address: row.get("owner_address"),
            name: row.get("name"),
            description: row.get("description"),
            //   invoice_template_uuid: row.get("invoice_template_uuid"),
            created_at: row.get("created_at"),
        })
    }
}

impl utoipa::ToSchema for ApiWorkspace {
    fn name() -> Cow<'static, str> {
        Cow::Borrowed("ApiWorkspace")
    }

    fn schemas(schemas: &mut Vec<(String, RefOr<Schema>)>) {
        schemas.push((Self::name().to_string(), Self::schema()));
    }
}

impl utoipa::PartialSchema for ApiWorkspace {
    fn schema() -> RefOr<Schema> {
        RefOr::T(Schema::Object(
            ObjectBuilder::new()
                .schema_type(SchemaType::Type(utoipa::openapi::Type::Integer))
                .format(Some(SchemaFormat::KnownFormat(KnownFormat::Byte)))
                .build(),
        ))
    }
}

impl ApiWorkspace {
    /// Creates a new `ApiWorkspace` instance
    pub fn new(
        owner_address: DomainEthAddress,
        name: String,
        description: Option<String>,
        //   invoice_template_uuid: Option<String>,
    ) -> Self {
        Self {
            workspace_uuid: DomainBytes8::random(),
            owner_address,
            name,
            description,
            //   invoice_template_uuid,
            created_at: Utc::now(),
        }
    }
}

pub struct ApiWorkspacesModel {}

impl ApiWorkspacesModel {
    /// Inserts a new ApiWorkspace into the database
    pub async fn insert_one(
        workspace: ApiWorkspace,
        psql_db: &Database,
    ) -> Result<i32, PostgresModelError> {
        let insert_query =
            "INSERT INTO api_workspaces (workspace_uuid, owner_address, name, description )
                           VALUES ($1, $2, $3, $4 )
                           RETURNING id;";

        let result = psql_db
            .query_one(
                insert_query,
                &[
                    &workspace.workspace_uuid,
                    &workspace.owner_address,
                    &workspace.name,
                    &workspace.description,
                    //  &workspace.invoice_template_uuid,
                ],
            )
            .await;

        match result {
            Ok(row) => Ok(row.get::<_, i32>("id")),
            Err(e) => Err(e.into()),
        }
    }

    /// Finds a workspace by its UUID
    pub async fn find_by_uuid(
        workspace_uuid: &DomainBytes8,
        psql_db: &Database,
    ) -> Result<SelectedRecord<ApiWorkspace>, PostgresModelError> {
        let query = "SELECT * FROM api_workspaces WHERE workspace_uuid = $1 LIMIT 1;";
        let result = psql_db.query_one(query, &[&workspace_uuid]).await?;

        SelectedRecord::<ApiWorkspace>::from_row(&result).ok_or_else(|| {
            PostgresModelError::RowParseError(Some(
                "Failed to build ApiWorkspace from row".to_string(),
            ))
        })
    }

    /// Updates the invoice template UUID for a workspace
    /* pub async fn update_invoice_template_uuid(
        workspace_uuid: &str,
        invoice_template_uuid: &str,
        psql_db: &Database,
    ) -> Result<bool, PostgresModelError> {
        let update_query = "UPDATE api_workspaces SET invoice_template_uuid = $1 WHERE workspace_uuid = $2;";
        let result = psql_db.execute(update_query, &[&invoice_template_uuid, &workspace_uuid]).await;

        match result {
            Ok(rows_affected) => Ok(rows_affected > 0),
            Err(e) => Err(e.into()),
        }
    }*/

    /// Finds all workspaces owned by a specific address with optional pagination
    pub async fn find_all_by_owner(
        owner_address: &DomainEthAddress,
        psql_db: &Database,
        pagination: Option<&PaginationData>,
    ) -> Result<Vec<SelectedRecord<ApiWorkspace>>, PostgresModelError> {
        // Create SQL builder with where condition
        let mut where_params: BTreeMap<String, Arc<dyn ToSql + Sync>> = BTreeMap::new();
        where_params.insert("owner_address".to_string(), Arc::new(owner_address.clone()));

        let sql_builder = SqlBuilder {
            statement_base: SqlStatementBase::SelectAll,
            table_name: "api_workspaces".to_string(),
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

        let workspaces = result
            .iter()
            .filter_map(|row| SelectedRecord::<ApiWorkspace>::from_row(row))
            .collect();

        Ok(workspaces)
    }

    /// Count total workspaces for an owner
    pub async fn count_by_owner(
        owner_address: &DomainEthAddress,
        psql_db: &Database,
    ) -> Result<i64, PostgresModelError> {
        // Create SQL builder with where condition for count query
        let mut where_params: BTreeMap<String, Arc<dyn ToSql + Sync>> = BTreeMap::new();
        where_params.insert("owner_address".to_string(), Arc::new(owner_address.clone()));

        let sql_builder = SqlBuilder {
            statement_base: SqlStatementBase::SelectCountAll,
            table_name: "api_workspaces".to_string(),
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
}

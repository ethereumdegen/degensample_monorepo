use degen_sql::db::postgres::models::model::PostgresModelError;
use ethers::{
    types::Address,
    utils::to_checksum,
};
use log::info;
use rust_decimal::Decimal;
use tokio_postgres::types::ToSql;

use vibegraph::event::{ContractEvent};

use degen_sql::db::postgres::postgres_db::Database;

use std::str::FromStr;

pub struct EventsModel {}

impl EventsModel {
    pub async fn insert_one(
        event: &ContractEvent,

        psql_db: &Database,
    ) -> Result<i32, PostgresModelError> {
        let contract_address = to_checksum(&event.address, None).to_string();

        let name = &event.name;

        let signature = format!("{:?}", &event.signature); // serde_json::to_string(  &event.signature ).unwrap();

        let args = serde_json::to_string(&event.args).unwrap();

        let data = serde_json::to_string(&event.data).unwrap();

        let transaction_hash = format!(
            "{:?}",
            &event
                .transaction_hash
                .ok_or_else(|| PostgresModelError::RowParseError(Some(
                    "Missing transaction hash".to_string()
                )))?
        );

        let block_hash = format!(
            "{:?}",
            &event
                .block_hash
                .ok_or_else(|| PostgresModelError::RowParseError(Some(
                    "Missing block hash".to_string()
                )))?
        );

        let chain_id = event.chain_id as i64;

        let block_number_string: &String = &event.block_number.unwrap().low_u64().to_string();
        let block_number = Decimal::from_str(block_number_string).unwrap();

        let log_index: i64 = event.log_index.unwrap().low_u64() as i64;

        let transaction_index: i64 = event.transaction_index.unwrap().low_u64() as i64;

        let insert_result = psql_db
            .query_one(
                "
            INSERT INTO events 
            (
            contract_address,
            name,
            signature,
            args,
            data,
            chain_id,
            transaction_hash,
            block_number,
            block_hash,
            log_index,
            transaction_index            
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id;
            ",
                &[
                    &contract_address,
                    &name,
                    &signature,
                    &args,
                    &data,
                    &chain_id,
                    &transaction_hash,
                    &block_number,
                    &block_hash,
                    &log_index,
                    &transaction_index,
                ],
            )
            .await;

        match insert_result {
            Ok(row) => Ok(row.get(0)), // Successfully inserted new row and got its ID.
            Err(e) => {
                eprintln!("Database error: Event {:?}", e);

                Err(e.into())
            }
        }
    }

    pub async fn find_most_recent_event(
        contract_address: Address,
        psql_db: &Database,
    ) -> Result<ContractEvent, PostgresModelError> {
        let parsed_contract_address = to_checksum(&contract_address, None).to_string();

        let row = psql_db
            .query_one(
                "
        SELECT 
            contract_address,
            name,
            signature,
            args,
            data,
            chain_id,
            transaction_hash,
            block_number,
            block_hash,
            log_index,
            transaction_index,
            created_at
        FROM events
        WHERE (contract_address) = ($1)
        ORDER BY created_at DESC
        LIMIT 1;
        ",
                &[&parsed_contract_address],
            )
            .await;

        match row {
            Ok(row) => {
                //  let contract_address =  &row.get::<_, String>("contract_address");

                let event = ContractEvent::from_row(&row)?;

                Ok(event)
            }
            Err(e) => {
                eprintln!("Database error: Recent Event {:?}", e);
                Err(e.into())
            }
        }
    }

    pub async fn find_next_event(
        offset: i64,
        psql_db: &Database,
    ) -> Result<(u64, ContractEvent), PostgresModelError> {
        let row = psql_db
            .query_one(
                "
        SELECT 
            id,
            contract_address,
            name,
            signature,
            args,
            data,
            chain_id,
            transaction_hash,
            block_number,
            block_hash,
            log_index,
            transaction_index,
            created_at
        FROM events
       
        ORDER BY created_at DESC
        LIMIT 1 OFFSET ($1);
        ",
                &[&offset],
            )
            .await;

        match row {
            Ok(row) => {
                let id = (row.get::<_, i32>("id")) as u64;

                let event = ContractEvent::from_row(&row)?;

                Ok((id, event))
            }
            Err(e) => {
                eprintln!("Database error: Recent Event {:?}", e);
                Err(e.into())
            }
        }
    }

    pub async fn find_next_event_of_type(
        event_type: String,
        offset_id: Option<i32>,
        psql_db: &mut Database,
    ) -> Result<(i32, ContractEvent), PostgresModelError> {
        let row = match offset_id {
            Some(id) => {
                psql_db
                    .query_one(
                        "
                        SELECT     *  FROM events
                        WHERE name = $1 AND id > $2
                        ORDER BY id ASC 
                        LIMIT 1 ;
                        ",
                        &[&event_type, &id],
                    )
                    .await
            }
            None => {
                psql_db
                    .query_one(
                        "
                        SELECT  * FROM events
                        WHERE name = $1
                            ORDER BY id ASC 
                        LIMIT 1 ;
                        ",
                        &[&event_type],
                    )
                    .await
            }
        };

        match row {
            Ok(row) => {
                let id = (row.get::<_, i32>("id")) as i32;

                let event = ContractEvent::from_row(&row)?;

                Ok((id, event))
            }
            Err(e) => {
                eprintln!("Database error: Recent Event {:?}", e);
                Err(e.into())
            }
        }
    }

    pub async fn find_next_event_of_types(
        event_types: Vec<String>,
        offset_id: Option<i32>,
        psql_db: &mut Database,
    ) -> Result<(i32, ContractEvent), PostgresModelError> {
        if event_types.is_empty() {
            return Err(PostgresModelError::RowParseError(Some(
                "event_types cannot be empty".into(),
            )));
        }

        // Generate placeholders for each event type

        let mut query_params: Vec<&(dyn ToSql + Sync)> = Vec::new();

        let placeholders: Vec<String> = event_types
            .iter()
            .enumerate()
            .map(|(i, event_type)| {
                query_params.push(event_type); // Add event type reference to parameters
                format!("${}", i + 1) // Generate $1, $2, $3, etc.
            })
            .collect();

        let _out = format!(
            "
                SELECT * FROM events
                WHERE name IN ({})
                ORDER BY id ASC
                LIMIT 1;
                ",
            placeholders.join(", ")
        );
        // info!("{}", out  );

        /* let query: String;
        match offset_id {
            Some(id) => {


                let cloned_id = id .clone();
                query_params.push(   &cloned_id ); // Add offset_id as the last parameter
                query = format!(
                    "
                    SELECT * FROM events
                    WHERE name IN ({}) AND id > ${}
                    ORDER BY id ASC
                    LIMIT 1;
                    ",
                    placeholders.join(", "),
                    query_params.len() // Last placeholder for id
                );
            }
            None => {
                query = format!(
                    "
                    SELECT * FROM events
                    WHERE name IN ({})
                    ORDER BY id ASC
                    LIMIT 1;
                    ",
                    placeholders.join(", ")
                );
            }
        }*/

        let query: String;
        if offset_id.is_some() {
            query_params.push(&offset_id); // Add offset_id as the last parameter
            query = format!(
                "
                SELECT * FROM events
                WHERE name IN ({}) AND id > ${}
                ORDER BY id ASC
                LIMIT 1;
                ",
                placeholders.join(", "),
                query_params.len() // Last placeholder for id
            );
        } else {
            query = format!(
                "
                SELECT * FROM events
                WHERE name IN ({})
                ORDER BY id ASC
                LIMIT 1;
                ",
                placeholders.join(", ")
            );
        }

        //   let final_params = query_params.iter().map(|x| &**x).collect::<Vec<_>>() ;

        //   info!("{:?}", final_params  );

        let row = psql_db.query_one(&query, &query_params).await;

        //  drop (final_params ) ;

        match row {
            Ok(row) => {
                let id = row.get::<_, i32>("id");
                let event = ContractEvent::from_row(&row)?;

                info!("event {:?}", event);
                Ok((id, event))
            }
            Err(e) => {
                eprintln!("Database error: {:?}", e);
                Err(e.into())
            }
        }
    }
}

use crate::types::domains::bytes32::DomainBytes32;
use crate::types::domains::datetime::DomainDatetime;
use crate::types::domains::eth_address::DomainEthAddress;
use crate::types::domains::h256::DomainH256;
use crate::types::domains::pay_to_amounts::DomainPayToAmounts;
use crate::types::domains::pay_to_array::DomainPayToArray;
use crate::types::domains::uint256::DomainUint256;
use degen_sql::pagination::PaginationData;

use crate::types::selected_record::SelectedRecord;
use crate::util::built_from_row::BuiltFromDbRow;
use crate::util::unix_day_index::UnixDayIndex;
use log::info;
use serde;
use tokio_postgres::Row;

use degen_sql::db::postgres::models::model::PostgresModelError;
use degen_sql::db::postgres::postgres_db::Database;

use super::webhook_triggers_model::IntoWebhookEventData;

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct PaymentSummary {
    pub uuid: DomainBytes32,
    pub chain_id: i64,
    pub payspec_contract_address: DomainEthAddress,
    pub payment_token_address: DomainEthAddress,
    pub from_address: DomainEthAddress,
    pub nonce: DomainUint256,
    //  #[serde(rename = "total_amount")]
    //pub totalAmount: DomainUint256,
    pub pay_to_array: DomainPayToArray,
    pub pay_to_amounts: DomainPayToAmounts,
    pub transaction_hash: DomainH256,
    pub payment_at_block: Option<i64>,
    pub payment_at_block_timestamp: Option<DomainDatetime>,
    pub payment_at_unix_days_index: Option<i64>,
}

impl BuiltFromDbRow for PaymentSummary {
    fn from_row(row: &Row) -> Option<Self> {
        Some(Self {
            uuid: row.get("uuid"),
            chain_id: row.get("chain_id"),
            payspec_contract_address: row.get("contract_address"),
            payment_token_address: row.get("token_address"),
            from_address: row.get("from_address"),
            nonce: row.get("nonce"),
            // These fields may not be directly in the DB schema
            // totalAmount: DomainUint256::default(),
            pay_to_array: row.get("pay_to_array"),
            pay_to_amounts: row.get("pay_to_amounts"),
            transaction_hash: row.get("transaction_hash"),
            payment_at_block: row.get("block_number"),
            payment_at_block_timestamp: row.try_get("created_at").ok(),
            payment_at_unix_days_index: None,
        })
    }
}

impl PaymentSummary {
    pub fn generate_test_payment_summary() -> Self {
        use ethers::types::{H160, H256, U256};
        use std::str::FromStr;

        // Helper function to create an Ethereum address from a string
        fn eth_addr(s: &str) -> H160 {
            let addr_str = s.trim_start_matches("0x");
            if let Ok(addr) = H160::from_str(addr_str) {
                addr
            } else {
                H160::zero()
            }
        }

        // Helper function to create a bytes32 from a string
        fn bytes32(s: &str) -> DomainBytes32 {
            if let Ok(bytes) = DomainBytes32::from_hex(s) {
                bytes
            } else {
                // Default to empty bytes if parsing fails
                DomainBytes32([0u8; 32])
            }
        }

        // Helper function to create a transaction hash from a string
        fn tx_hash(s: &str) -> H256 {
            let hash_str = s.trim_start_matches("0x");
            if let Ok(hash) = H256::from_str(hash_str) {
                hash
            } else {
                H256::zero()
            }
        }

        Self {
            uuid: bytes32("0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"),
            chain_id: 1, // Ethereum mainnet
            payspec_contract_address: DomainEthAddress(eth_addr(
                "0x1234567890123456789012345678901234567890",
            )),
            payment_token_address: DomainEthAddress(eth_addr(
                "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            )), // USDC on mainnet
            from_address: DomainEthAddress(eth_addr("0x8765432109876543210987654321098765432109")),
            nonce: DomainUint256(U256::from(42u64)),
            pay_to_array: DomainPayToArray(vec![
                eth_addr("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
                eth_addr("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"),
            ]),
            pay_to_amounts: DomainPayToAmounts(vec![
                U256::from(100000000u64), // 100 USDC (assuming 6 decimals)
                U256::from(50000000u64),  // 50 USDC
            ]),
            transaction_hash: DomainH256(tx_hash(
                "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
            )),
            payment_at_block: Some(15000000),
            payment_at_block_timestamp: Some(DomainDatetime(chrono::Utc::now())),
            payment_at_unix_days_index: Some(UnixDayIndex::from_timestamp(chrono::Utc::now())),
        }
    }
}

impl IntoWebhookEventData for PaymentSummary {
    fn get_event_type(&self) -> String {
        "payment_summary".into()
    }

    fn get_event_data(&self) -> serde_json::Value {
        // Use to_value instead of from_value + into
        serde_json::to_value(self).unwrap_or_default()
    }
}

pub struct PaymentsModel {}

impl PaymentsModel {
    pub async fn insert_one(
        loan_summary: PaymentSummary,

        psql_db: &Database,
    ) -> Result<i32, PostgresModelError> {
        // let nonce_decimal = Decimal::from_str(&loan_summary.nonce.to_string()).unwrap();
        //  let block_number_decimal = Decimal::from_str(&loan_summary. block_number.to_string()).unwrap();

        let status = "paid".to_string();

        let insert_result = psql_db
            .query_one(
                "
                INSERT INTO payments 
                (
                contract_address,
                token_address,
                pay_to_array,
                pay_to_amounts,
                uuid,
                nonce,
                block_number,
                status,
                transaction_hash,
                chain_id
                ) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id;
                ",
                &[
                    &loan_summary.payspec_contract_address,
                    &loan_summary.payment_token_address,
                    &loan_summary.pay_to_array,
                    &loan_summary.pay_to_amounts,
                    &loan_summary.uuid,
                    &loan_summary.nonce,
                    &loan_summary.payment_at_block,
                    &status,
                    &loan_summary.transaction_hash,
                    &loan_summary.chain_id,
                ],
            )
            .await;

        match insert_result {
            Ok(row) => Ok(row.get(0)), // Successfully inserted new row and got its ID.
            Err(e) => {
                eprintln!("Database error: Payment {:?}", e);
                Err(e.into())
            }
        }
    }

    pub async fn insert_or_update_one(
        loan_summary: PaymentSummary,
        psql_db: &Database,
    ) -> Result<i32, PostgresModelError> {
        let status = "paid".to_string();

        // Using ON CONFLICT to handle the unique constraint (transaction_hash, chain_id)
        let upsert_result = psql_db
            .query_one(
                "
                INSERT INTO payments 
                (
                contract_address,
                token_address,
                from_address,
                pay_to_array,
                pay_to_amounts,
                uuid,
                nonce,
                block_number,
                status,
                transaction_hash,
                chain_id
                ) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (transaction_hash, chain_id) 
                DO UPDATE SET 
                    contract_address = EXCLUDED.contract_address,
                    token_address = EXCLUDED.token_address,
                    pay_to_array = EXCLUDED.pay_to_array,
                    pay_to_amounts = EXCLUDED.pay_to_amounts,
                    uuid = EXCLUDED.uuid,
                    nonce = EXCLUDED.nonce,
                    block_number = EXCLUDED.block_number,
                    from_address = EXCLUDED.from_address,
                    status = EXCLUDED.status
                RETURNING id;
                ",
                &[
                    &loan_summary.payspec_contract_address,
                    &loan_summary.payment_token_address,
                    &loan_summary.from_address,
                    &loan_summary.pay_to_array,
                    &loan_summary.pay_to_amounts,
                    &loan_summary.uuid,
                    &loan_summary.nonce,
                    &loan_summary.payment_at_block,
                    &status,
                    &loan_summary.transaction_hash,
                    &loan_summary.chain_id,
                ],
            )
            .await;

        match upsert_result {
            Ok(row) => {
                let id: i32 = row.get(0);
                info!("Payment upserted with id: {}", id);

                // Check for webhooks and create triggers
                // Self::create_webhook_triggers_for_payment(&loan_summary, psql_db).await?;

                Ok(id)
            }
            Err(e) => {
                eprintln!("Database error during upsert: Payment {:?}", e);
                Err(e.into())
            }
        }
    }

    /// Creates webhook triggers for all recipients of a payment
    /*  pub async fn create_webhook_triggers_for_payment(
            payment: &PaymentSummary,
            psql_db: &Database,
        ) -> Result<(), PostgresModelError> {
            // Get all recipient addresses from the payment
            let recipients = payment.pay_to_array.0.clone();

            for recipient in recipients {
                // Check if the recipient has a webhook URL configured
                let webhooks = WebhookUrlsModel::find_by_owner_address(&recipient.into(), psql_db).await?;

                // Create a webhook trigger for each webhook URL
                for webhook in webhooks {
                    let trigger = WebhookTrigger::new(webhook.id.into());
                    let _ = WebhookTriggersModel::insert_one(trigger, psql_db).await?;
                    info!("Created webhook trigger for payment to {}", recipient);
                }
            }

            Ok(())
        }
    */

    pub async fn find_by_transaction_hash(
        transaction_hash: &str,
        chain_id: i64,
        psql_db: &Database,
    ) -> Result<Option<SelectedRecord<PaymentSummary>>, PostgresModelError> {
        let row = psql_db
            .query_one(
                "
                SELECT * FROM payments
                WHERE transaction_hash = $1 AND chain_id = $2
                LIMIT 1;
                ",
                &[&transaction_hash, &chain_id],
            )
            .await;

        match row {
            Ok(row) => {
                let record = SelectedRecord::<PaymentSummary>::from_row(&row);
                Ok(record)
            }
            Err(e) => {
                // If not found, return Ok with None instead of error
                if e.to_string().contains("no rows") {
                    return Ok(None);
                }
                eprintln!("Database error: Payment lookup {:?}", e);
                Err(e.into())
            }
        }
    }

    pub async fn find_by_uuid(
        uuid: &DomainBytes32,
        psql_db: &Database,
    ) -> Result<Option<SelectedRecord<PaymentSummary>>, PostgresModelError> {
        let row = psql_db
            .query_one(
                "
                SELECT * FROM payments
                WHERE uuid = $1
                LIMIT 1;
                ",
                &[&uuid],
            )
            .await;

        match row {
            Ok(row) => {
                let record = SelectedRecord::<PaymentSummary>::from_row(&row);
                Ok(record)
            }
            Err(e) => {
                // If not found, return Ok with None instead of error
                if e.to_string().contains("no rows") {
                    return Ok(None);
                }
                eprintln!("Database error: Payment lookup {:?}", e);
                Err(e.into())
            }
        }
    }



    pub async fn find_next_payment(
          offset: Option<i32>,
        psql_db: &Database,
    ) -> Result<Option<SelectedRecord<PaymentSummary>>, PostgresModelError> {
       

            let row = match offset {

                Some(id) =>  psql_db
                    .query_one(
                        "
                        SELECT   *  FROM payments
                        WHERE  id > $1
                        ORDER BY id ASC 
                        LIMIT 1 ;
                        ",
                        &[&id],
                    )
                    .await,


                    None =>  psql_db
                    .query_one(
                        "
                        SELECT  *  FROM payments
                       
                        ORDER BY id ASC 
                        LIMIT 1 ;
                        ",
                        &[],
                    )
                    .await

            };

         

        match row {
            Ok(row) => {
                let record = SelectedRecord::<PaymentSummary>::from_row(&row);
                Ok(record)
            }
            Err(e) => {
                // If not found, return Ok with None instead of error
                if e.to_string().contains("no rows") {
                    return Ok(None);
                }
                eprintln!("Database error: Payment lookup {:?}", e);
                Err(e.into())
            }
        }
    }


    pub async fn update_status(
        id: i32,
        status: &str,
        psql_db: &Database,
    ) -> Result<(), PostgresModelError> {
        let result = psql_db
            .execute(
                "
                UPDATE payments
                SET status = $1
                WHERE id = $2;
                ",
                &[&status, &id],
            )
            .await;

        match result {
            Ok(_) => Ok(()),
            Err(e) => {
                eprintln!("Database error: Payment status update {:?}", e);
                Err(e.into())
            }
        }
    }

    pub async fn update_one_as_paid(
        uuid: &DomainBytes32,
        transaction_hash: &DomainH256,
        block_number: i64,
        psql_db: &Database,
    ) -> Result<Option<SelectedRecord<PaymentSummary>>, PostgresModelError> {
        // Update the payment status and transaction info
        let result = psql_db
            .execute(
                "
                UPDATE payments
                SET status = 'paid', 
                    transaction_hash = $1,
                    block_number = $2
                WHERE uuid = $3
                ",
                &[&transaction_hash, &block_number, &uuid],
            )
            .await;

        match result {
            Ok(rows_affected) => {
                if rows_affected == 0 {
                    // No payment was updated, likely because UUID wasn't found
                    return Ok(None);
                }
                
                // Fetch the updated payment
                Self::find_by_uuid(uuid, psql_db).await
            },
            Err(e) => {
                eprintln!("Database error: Payment update as paid {:?}", e);
                Err(e.into())
            }
        }
    }

    pub async fn find_most_recent_payment(
        contract_address: &str,
        psql_db: &Database,
    ) -> Result<Option<SelectedRecord<PaymentSummary>>, PostgresModelError> {
        let row = psql_db
            .query_one(
                "
                SELECT *
                FROM payments
                WHERE contract_address = $1
                ORDER BY created_at DESC
                LIMIT 1;
                ",
                &[&contract_address],
            )
            .await;

        match row {
            Ok(row) => {
                let record = SelectedRecord::<PaymentSummary>::from_row(&row);
                Ok(record)
            }
            Err(e) => {
                // If not found, return Ok with None instead of error
                if e.to_string().contains("no rows") {
                    return Ok(None);
                }
                eprintln!("Database error: Recent Payment {:?}", e);
                Err(e.into())
            }
        }
    }

    pub async fn find_payments_by_status(
        status: &str,
        limit: i64,
        offset: i64,
        psql_db: &Database,
    ) -> Result<Vec<SelectedRecord<PaymentSummary>>, PostgresModelError> {
        let rows = psql_db
            .query(
                "
                SELECT *
                FROM payments
                WHERE status = $1
                ORDER BY created_at ASC
                LIMIT $2 OFFSET $3;
                ",
                &[&status, &limit, &offset],
            )
            .await;

        match rows {
            Ok(rows) => {
                let records = rows
                    .iter()
                    .filter_map(|row| SelectedRecord::<PaymentSummary>::from_row(row))
                    .collect();
                Ok(records)
            }
            Err(e) => {
                eprintln!("Database error: Payments by status {:?}", e);
                Err(e.into())
            }
        }
    }

    pub async fn find_by_from_address(
        wallet_address: &str,
        psql_db: &Database,
    ) -> Result<Vec<SelectedRecord<PaymentSummary>>, PostgresModelError> {
        let rows = psql_db
            .query(
                "
                SELECT *
                FROM payments
                WHERE  from_address = $1
                ORDER BY created_at DESC;
                ",
                &[&wallet_address],
            )
            .await;

        match rows {
            Ok(rows) => {
                let records = rows
                    .iter()
                    .filter_map(|row| SelectedRecord::<PaymentSummary>::from_row(row))
                    .collect();
                Ok(records)
            }
            Err(e) => {
                eprintln!("Database error: Payments by wallet address {:?}", e);
                Err(e.into())
            }
        }
    }

    pub async fn find_by_pay_to_address(
        wallet_address: &DomainEthAddress,
        psql_db: &Database,
    ) -> Result<Vec<SelectedRecord<PaymentSummary>>, PostgresModelError> {
        println!("find_by_pay_to_address 1 {:?} ", wallet_address);
        let rows = psql_db
            .query(
                "
                SELECT *
                FROM payments
                WHERE $1 = ANY(pay_to_array) 
                ORDER BY created_at DESC;
                ",
                &[&wallet_address],
            )
            .await;

        match rows {
            Ok(rows) => {
                let records = rows
                    .iter()
                    .filter_map(|row| SelectedRecord::<PaymentSummary>::from_row(row))
                    .collect();
                Ok(records)
            }
            Err(e) => {
                eprintln!("Database error: Payments by wallet address {:?}", e);
                Err(e.into())
            }
        }
    }

    pub async fn find_by_pay_to_address_paginated(
        wallet_address: &DomainEthAddress,
        pagination: &PaginationData,
        psql_db: &Database,
    ) -> Result<(Vec<SelectedRecord<PaymentSummary>>, i64), PostgresModelError> {
        // First get total count
        let count_query = "
            SELECT COUNT(*) as total
            FROM payments
            WHERE $1 = ANY(pay_to_array)
        ";

        let count_row = psql_db.query_one(count_query, &[&wallet_address]).await?;

        let total_count: i64 = count_row.get("total");

        // Then get paginated data
        let rows = psql_db
            .query(
                &format!(
                    "
                    SELECT *
                    FROM payments
                    WHERE $1 = ANY(pay_to_array)
                    {}
                    ",
                    pagination.build_query_part()
                ),
                &[&wallet_address],
            )
            .await?;

        let records = rows
            .iter()
            .filter_map(|row| SelectedRecord::<PaymentSummary>::from_row(row))
            .collect();

        Ok((records, total_count))
    }

    ///
    pub async fn find_by_pay_to_address_and_chain_id(
        wallet_address: &DomainEthAddress,
        chain_id: i64,
        psql_db: &Database,
    ) -> Result<Vec<SelectedRecord<PaymentSummary>>, PostgresModelError> {
        let rows = psql_db
            .query(
                "
                SELECT *
                FROM payments
                WHERE $1 = ANY(pay_to_array) AND chain_id = $2
                ORDER BY created_at DESC;
                ",
                &[&wallet_address, &chain_id],
            )
            .await;

        match rows {
            Ok(rows) => {
                let records = rows
                    .iter()
                    .filter_map(|row| SelectedRecord::<PaymentSummary>::from_row(row))
                    .collect();
                Ok(records)
            }
            Err(e) => {
                eprintln!(
                    "Database error: Payments by wallet address and chain {:?}",
                    e
                );
                Err(e.into())
            }
        }
    }

    pub async fn find_by_pay_to_address_and_chain_id_paginated(
        wallet_address: &DomainEthAddress,
        chain_id: i64,
        pagination: &PaginationData,
        psql_db: &Database,
    ) -> Result<(Vec<SelectedRecord<PaymentSummary>>, i64), PostgresModelError> {
        // First get total count
        let count_query = "
            SELECT COUNT(*) as total
            FROM payments
            WHERE $1 = ANY(pay_to_array) AND chain_id = $2
        ";

        let count_row = psql_db
            .query_one(count_query, &[&wallet_address, &chain_id])
            .await?;

        let total_count: i64 = count_row.get("total");

        // Then get paginated data
        let rows = psql_db
            .query(
                &format!(
                    "
                    SELECT *
                    FROM payments
                    WHERE $1 = ANY(pay_to_array) AND chain_id = $2
                    {}
                    ",
                    pagination.build_query_part()
                ),
                &[&wallet_address, &chain_id],
            )
            .await?;

        let records = rows
            .iter()
            .filter_map(|row| SelectedRecord::<PaymentSummary>::from_row(row))
            .collect();

        Ok((records, total_count))
    }
}

/*

#[derive(Clone,Debug)]
pub struct PaymentSummary {

    uuid: String,

    chain_id: i64,


    payment_token_address: DomainEthAddress,


    totalAmount: DomainUint256,
    recipients: DomainPayToArray,
    amounts: DomainPayToAmounts,


    payment_at_block: Option< U64 >,
    payment_at_block_timestamp: Option< DateTime<Utc> > ,
    payment_at_unix_days_index:  Option< i64 >


}
*/

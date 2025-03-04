use super::web_controller::WebController;
use actix_web::{
    web::{self, Data, Json, ServiceConfig},
    HttpResponse, Responder,
};

use degen_sql::pagination::PaginationData;

use defirelay_backend::db::postgres::models::api_key_model::validate_api_key_or_session_token;
use defirelay_backend::db::postgres::models::payments_model::PaymentsModel;
use defirelay_backend::types::domains::bytes32::DomainBytes32;
use defirelay_backend::types::pagination::PaginatedResponse;
use defirelay_backend::{app_state::AppState, types::domains::eth_address::DomainEthAddress};
use serde::{Deserialize, Serialize};
use serde_json::json;
use utoipa::ToSchema;

#[derive(Deserialize, ToSchema)]
pub struct ListPaymentsQuery {
    pub session_token: String,
    pub chain_id: Option<i64>,
    pub pagination: Option<PaginationData>,
}

#[derive(Deserialize, ToSchema)]
pub struct FindByInvoiceUuidQuery {
    pub invoice_uuid: DomainBytes32,
}

#[derive(Serialize, ToSchema)]
struct AuthResponse<T> {
    success: bool,
    data: Option<T>,
    error: Option<String>,
}




pub struct PaymentsController {}

impl WebController for PaymentsController {
    fn config(cfg: &mut ServiceConfig) {
        cfg.service(
            web::scope("/api/payments")
                .route("/list", web::post().to(Self::list_payments))
                .route("/find_by_invoice_uuid", web::get().to(Self::find_payment_by_invoice_uuid)),
        );
    }
}

impl PaymentsController {
    async fn find_payment_by_invoice_uuid(
        web::Query(query): web::Query<FindByInvoiceUuidQuery>,
        app_state: Data<AppState>,
    ) -> impl Responder {
        match PaymentsModel::find_by_uuid(&query.invoice_uuid, &app_state.database).await {
            Ok(Some(payment)) => HttpResponse::Ok().json(json!({
                "success": true,
                "data": payment
            })),
            Ok(None) => HttpResponse::NotFound().json(json!({
                "success": false,
                "error": "Payment not found"
            })),
            Err(e) => {
                eprintln!("Error fetching payment by invoice UUID: {}", e);
                HttpResponse::InternalServerError().json(json!({
                    "success": false,
                    "error": "Failed to fetch payment"
                }))
            }
        }
    }

    async fn list_payments(
        query: Json<ListPaymentsQuery>,
        app_state: Data<AppState>,
    ) -> impl Responder {
        // Validate session token or API key
        let token_valid = validate_api_key_or_session_token(&query.session_token, &app_state).await;

        let Some(token_data) = token_valid else {
            return HttpResponse::Unauthorized().json(AuthResponse::<String> {
                success: false,
                data: None,
                error: Some("Invalid session".to_string()),
            });
        };

        // Get the wallet address
        let wallet_address = DomainEthAddress(token_data.owner_public_address);

        // Check if pagination is requested
        if query.pagination.is_some() {
            // Get pagination options
            let pagination = query.pagination.clone().unwrap_or_default();

            let result = if let Some(chain_id) = query.chain_id {
                // With chain_id and pagination
                PaymentsModel::find_by_pay_to_address_and_chain_id_paginated(
                    &wallet_address,
                    chain_id,
                    &pagination,
                    &app_state.database,
                )
                .await
            } else {
                // Without chain_id but with pagination
                PaymentsModel::find_by_pay_to_address_paginated(
                    &wallet_address,
                    &pagination,
                    &app_state.database,
                )
                .await
            };

            match result {
                Ok((items, total_count)) => {
                    // Create paginated response using the helper method
                    let paginated_response =
                        PaginatedResponse::from_pagination_data(&pagination, items, total_count);

                    HttpResponse::Ok().json(AuthResponse {
                        success: true,
                        data: Some(paginated_response),
                        error: None,
                    })
                }
                Err(e) => {
                    eprintln!("Error fetching paginated payments: {}", e);
                    HttpResponse::InternalServerError().json(AuthResponse::<String> {
                        success: false,
                        data: None,
                        error: Some(format!("Failed to fetch payments: {}", e)),
                    })
                }
            }
        } else {
            // Non-paginated response (backward compatibility)
            let result = if let Some(chain_id) = query.chain_id {
                PaymentsModel::find_by_pay_to_address_and_chain_id(
                    &wallet_address,
                    chain_id,
                    &app_state.database,
                )
                .await
            } else {
                PaymentsModel::find_by_pay_to_address(&wallet_address, &app_state.database).await
            };

            match result {
                Ok(payments) => HttpResponse::Ok().json(AuthResponse {
                    success: true,
                    data: Some(payments),
                    error: None,
                }),
                Err(e) => {
                    eprintln!("Error fetching payments: {}", e);
                    HttpResponse::InternalServerError().json(AuthResponse::<String> {
                        success: false,
                        data: None,
                        error: Some(format!("Failed to fetch payments: {}", e)),
                    })
                }
            }
        }
    }
}

#[utoipa::path(
    get,
    path = "/api/payments/find_by_invoice_uuid",
    params(
        ("invoice_uuid" = DomainBytes32, description = "UUID of the invoice to find payment for")
    ),
    responses(
        (status = 200, description = "Payment found", body = Object),
        (status = 404, description = "Payment not found", body = Object),
        (status = 500, description = "Internal server error", body = Object)
    )
)]
async fn find_payment_by_invoice_uuid(
    web::Query(query): web::Query<FindByInvoiceUuidQuery>,
    app_state: Data<AppState>,
) -> impl Responder {
    PaymentsController::find_payment_by_invoice_uuid(web::Query(query), app_state).await
}

#[utoipa::path(
    post,
    path = "/api/payments/list",
    request_body = ListPaymentsQuery,
    responses(
        (status = 200, description = "List of payments", body = AuthResponse<Vec<Object>>),
        (status = 401, description = "Unauthorized", body = AuthResponse<String>),
        (status = 500, description = "Internal server error", body = AuthResponse<String>)
    )
)]
async fn list_payments(
    query: Json<ListPaymentsQuery>,
    app_state: Data<AppState>,
) -> impl Responder {
    PaymentsController::list_payments(query, app_state).await
}

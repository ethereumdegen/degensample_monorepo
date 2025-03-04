use actix_web::web::{self, Data, Json, ServiceConfig};
use actix_web::HttpResponse;
use actix_web::Responder;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use defirelay_backend::app_state::AppState;
use defirelay_backend::db::postgres::models::api_key_model::validate_api_key_or_session_token;
use defirelay_backend::db::postgres::models::premium_subscription_model::PremiumSubscriptionsModel;
use defirelay_backend::db::postgres::models::users_model::UsersModel;
use defirelay_backend::types::domains::eth_address::DomainEthAddress;

use super::web_controller::{AuthResponse, WebController};

/*


curl -X POST http://localhost:8080/api/user/premium    -H "Content-Type: application/json"   -d '{"session_token": "b40733b6db3a07d1d7c179217238d886"}'



*/

pub struct UsersController {}

impl WebController for UsersController {
    fn config(cfg: &mut ServiceConfig) {
        cfg.service(
            web::scope("/api/user")
                .route("/stats", web::post().to(get_user_stats))
                .route("/premium", web::post().to(get_premium_status)),
        );
    }
}

#[derive(Serialize, Deserialize, Debug, ToSchema)]
pub struct UserStatsRequest {
    session_token: String,
    //wallet_public_address: DomainEthAddress,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UserStatsResponse {
    pub invoices_count: i64,
    pub api_keys_count: i64,
    pub payments_count: i64,
}

#[derive(Serialize, Deserialize, Debug, ToSchema)]
pub struct PremiumStatusRequest {
    session_token: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PremiumStatusResponse {
    pub is_premium: bool,
    pub subscription_date: Option<String>,
}

async fn get_user_stats(
    input: Json<UserStatsRequest>,
    app_state: Data<AppState>,
) -> impl Responder {
    // let wallet_address = input.wallet_public_address.0;

    // Validate session token
    let token_valid = validate_api_key_or_session_token(&input.session_token, &app_state).await;

    let Some(token_valid) = token_valid else {
        return HttpResponse::Unauthorized().json(AuthResponse::<String> {
            success: false,
            data: None,
            error: Some("Invalid session or wallet address mismatch".to_string()),
        });
    };

    let wallet_address = token_valid.owner_public_address;

    // Get user stats
    let domain_address = DomainEthAddress(wallet_address);
    match UsersModel::get_user_stats(&domain_address, &app_state.database).await {
        Ok(stats) => {
            let response = UserStatsResponse {
                invoices_count: stats.invoices_count,
                api_keys_count: stats.api_keys_count,
                payments_count: stats.payments_count,
            };

            HttpResponse::Ok().json(AuthResponse {
                success: true,
                data: Some(response),
                error: None,
            })
        }
        Err(e) => {
            eprintln!("Error getting user stats: {}", e);
            HttpResponse::InternalServerError().json(AuthResponse::<String> {
                success: false,
                data: None,
                error: Some("Failed to get user statistics".to_string()),
            })
        }
    }
}

async fn get_premium_status(
    input: Json<PremiumStatusRequest>,
    app_state: Data<AppState>,
) -> impl Responder {
    // Validate session token
    let token_valid = validate_api_key_or_session_token(&input.session_token, &app_state).await;

    let Some(token_valid) = token_valid else {
        return HttpResponse::Unauthorized().json(AuthResponse::<String> {
            success: false,
            data: None,
            error: Some("Invalid session or wallet address mismatch".to_string()),
        });
    };

    let wallet_address = token_valid.owner_public_address;
    let domain_address = DomainEthAddress(wallet_address);

    // Query premium subscription status
    match PremiumSubscriptionsModel::get_premium_status(&domain_address, &app_state.database).await
    {
        Ok(Some(subscription)) => {
            let response = PremiumStatusResponse {
                is_premium: subscription.is_premium,
                subscription_date: Some(subscription.created_at.to_rfc3339()),
            };

            HttpResponse::Ok().json(AuthResponse {
                success: true,
                data: Some(response),
                error: None,
            })
        }
        Ok(None) => {
            // User has no premium subscription record
            let response = PremiumStatusResponse {
                is_premium: false,
                subscription_date: None,
            };

            HttpResponse::Ok().json(AuthResponse {
                success: true,
                data: Some(response),
                error: None,
            })
        }
        Err(e) => {
            eprintln!("Error getting premium status: {}", e);
            HttpResponse::InternalServerError().json(AuthResponse::<String> {
                success: false,
                data: None,
                error: Some("Failed to get premium subscription status".to_string()),
            })
        }
    }
}

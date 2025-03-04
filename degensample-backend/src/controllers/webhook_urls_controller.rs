use actix_web::web::{self, Data, Json, ServiceConfig};
use actix_web::HttpResponse;
use actix_web::Responder;
use defirelay_backend::db::postgres::models::api_key_model::validate_api_key_or_session_token;
use defirelay_backend::db::postgres::models::payments_model::PaymentSummary;
use ethers::types::Address;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use defirelay_backend::app_state::AppState;
use defirelay_backend::db::postgres::models::auth_sessions_model::validate_session_token;
use defirelay_backend::db::postgres::models::webhook_triggers_model::{
    WebhookTrigger, WebhookTriggerStatus, WebhookTriggersModel,
};
use defirelay_backend::db::postgres::models::webhook_urls_model::{WebhookUrl, WebhookUrlsModel};
use defirelay_backend::types::domains::eth_address::DomainEthAddress;
use defirelay_backend::types::domains::json::DomainJson;
use defirelay_backend::types::selected_record::SelectedRecord;

use super::web_controller::{AuthResponse, WebController};

/* Example curl:
curl -X POST http://localhost:8080/api/webhook/create \
     -H "Content-Type: application/json" \
     -d '{ "session_token": "f97169e34730ca74ced6d59ee684d91e", "wallet_public_address":"0x810E096DDa9ae3Ae2b55a9c45068F9FE8eeea6db", "webhook_url": "https://example.com/webhook" }'
*/

pub struct WebhookUrlsController {}

impl WebhookUrlsController {}

impl WebController for WebhookUrlsController {
    fn config(cfg: &mut ServiceConfig) {
        cfg.service(
            web::scope("/api/webhooks")
                .route("/create", web::post().to(create_webhook_url))
                //  .route("/get", web::get().to(get_webhook_url))
                .route("/list", web::post().to(list_webhook_urls))
                .route("/delete", web::post().to(delete_webhook_url))
                .route("/test_trigger", web::post().to(test_trigger_webhook))
                .route("/ack", web::post().to(acknowledge_webhook_trigger)),
        );
    }
}

#[derive(Serialize, Deserialize, Debug, ToSchema)]
pub struct CreateWebhookUrlInput {
    session_token: String,
    // wallet_public_address: String,
    webhook_url: String,
    scopes: Option<serde_json::Value>,
}

#[derive(Serialize, Deserialize, Debug, ToSchema)]
struct WebhookUrlCreatedOutput {
    id: i32,
    webhook_url: String,
}

#[utoipa::path(
    post,
    path = "/api/webhook/create",
    request_body = CreateWebhookUrlInput,
    responses(
        (status = 200, description = "Creates a webhook URL.", body = AuthResponse<WebhookUrlCreatedOutput>),
    )  
)]
async fn create_webhook_url(
    input: Json<CreateWebhookUrlInput>,
    app_state: Data<AppState>,
) -> impl Responder {
    let token_valid = validate_api_key_or_session_token(&input.session_token, &app_state).await;

    let Some(token_valid) = token_valid else {
        return HttpResponse::Unauthorized().json(AuthResponse::<String> {
            success: false,
            data: None,
            error: Some("Invalid session".to_string()),
        });
    };

    let wallet_address = token_valid.owner_public_address.clone();

    // Create new webhook URL
    let scopes_domain = input
        .scopes
        .as_ref()
        .map(|json_value| DomainJson::new(json_value.clone()));

    let new_webhook_url = WebhookUrl::new(
        DomainEthAddress(wallet_address),
        input.webhook_url.clone(),
        scopes_domain,
    );

    let inserted = WebhookUrlsModel::insert_one(new_webhook_url, &app_state.database).await;

    match inserted {
        Ok(new_id) => {
            let webhook_created_output = WebhookUrlCreatedOutput {
                id: new_id,
                webhook_url: input.webhook_url.clone(),
            };

            HttpResponse::Ok().json(AuthResponse {
                success: true,
                data: Some(webhook_created_output),
                error: None,
            })
        }
        Err(_) => HttpResponse::InternalServerError().json(AuthResponse::<String> {
            success: false,
            data: None,
            error: Some("Database error".to_string()),
        }),
    }
}

#[derive(Serialize, Deserialize, Debug, ToSchema)]
pub struct ListWebhookUrlsInput {
    session_token: String, // or api key
                           // wallet_public_address: String,
}

#[derive(Serialize, Deserialize, Debug, ToSchema)]
pub struct GetWebhookUrlParams {
    id: i32,
    session_token: String,
}

/*
#[utoipa::path(
    get,
    path = "/api/webhook/get",
    params(
        ("id" = i32, Path, description = "Webhook URL ID"),
        ("session_token" = String, Query, description = "Session token for authentication")
    ),
    responses(
        (status = 200, description = "Returns a single webhook URL", body = AuthResponse<SelectedRecord<WebhookUrl>>),
    )
)]
async fn get_webhook_url(
    web::Query(params): web::Query<GetWebhookUrlParams>,
    app_state: Data<AppState>,
) -> impl Responder {
    // Validate session token
    let token_valid = validate_api_key_or_session_token(&params.session_token, &app_state).await;

    let Some(token_valid) = token_valid else {
        return HttpResponse::Unauthorized().json(AuthResponse::<String> {
            success: false,
            data: None,
            error: Some("Invalid session".to_string()),
        });
    };

    // Get the webhook URL from the database
    let webhook_result = WebhookUrlsModel::find_by_id(params.id, &app_state.database).await;

    match webhook_result {
        Ok(Some(webhook)) => {
            // Verify ownership if the token is a user session
            let wallet_address = token_valid.owner_public_address;
            if webhook.entry.owner_wallet_address.0 != wallet_address {
                return HttpResponse::Forbidden().json(AuthResponse::<String> {
                    success: false,
                    data: None,
                    error: Some("You do not have permission to view this webhook".to_string()),
                });
            }

            HttpResponse::Ok().json(AuthResponse {
                success: true,
                data: Some(webhook),
                error: None,
            })
        },
        Ok(None) => HttpResponse::NotFound().json(AuthResponse::<String> {
            success: false,
            data: None,
            error: Some("Webhook URL not found".to_string()),
        }),
        Err(_) => HttpResponse::InternalServerError().json(AuthResponse::<String> {
            success: false,
            data: None,
            error: Some("Database error".to_string()),
        }),
    }
}

*/

/*
#[derive(Serialize, Deserialize, Debug, ToSchema)]
pub struct WebhookUrlOutput {
    pub id: i32,
    pub webhook_url: String,
    pub scopes: Option<serde_json::Value>,
    pub created_at: i64,
}*/

#[utoipa::path(
    post,
    path = "/api/webhook/list",
    request_body = ListWebhookUrlsInput,
    responses(
        (status = 200, description = "Lists all webhook URLs for a user", body = AuthResponse<Vec<SelectedRecord<WebhookUrl>>>),
    )
)]
async fn list_webhook_urls(
    input: Json<ListWebhookUrlsInput>,
    app_state: Data<AppState>,
) -> impl Responder {
    // Validate session token
    let token_valid = validate_api_key_or_session_token(&input.session_token, &app_state).await;

    let Some(token_valid) = token_valid else {
        return HttpResponse::Unauthorized().json(AuthResponse::<String> {
            success: false,
            data: None,
            error: Some("Invalid session".to_string()),
        });
    };

    let wallet_address = &token_valid.owner_public_address;

    // Fetch webhook URLs for the wallet address
    let domain_address = DomainEthAddress(wallet_address.clone());
    let webhook_urls =
        WebhookUrlsModel::find_by_owner_address(&domain_address, &app_state.database).await;

    match webhook_urls {
        Ok(urls) => HttpResponse::Ok().json(AuthResponse {
            success: true,
            data: Some(urls),
            error: None,
        }),
        Err(_) => HttpResponse::InternalServerError().json(AuthResponse::<String> {
            success: false,
            data: None,
            error: Some("Database error".to_string()),
        }),
    }
}

#[derive(Serialize, Deserialize, Debug, ToSchema)]
pub struct DeleteWebhookUrlInput {
    session_token: String,
    //wallet_public_address: String,
    webhook_url_id: i32,
}

#[derive(Serialize, Deserialize, Debug, ToSchema)]
struct DeleteWebhookUrlOutput {
    deleted: bool,
}

#[utoipa::path(
    post,
    path = "/api/webhook/delete",
    request_body = DeleteWebhookUrlInput,
    responses(
        (status = 200, description = "Deletes a webhook URL by ID", body = AuthResponse<DeleteWebhookUrlOutput>),
    )
)]
async fn delete_webhook_url(
    input: Json<DeleteWebhookUrlInput>,
    app_state: Data<AppState>,
) -> impl Responder {
    // Validate session token
    let token_valid = validate_api_key_or_session_token(&input.session_token, &app_state).await;

    let Some(token_valid) = token_valid else {
        return HttpResponse::Unauthorized().json(AuthResponse::<String> {
            success: false,
            data: None,
            error: Some("Invalid session".to_string()),
        });
    };

    // Delete the webhook URL
    let delete_result =
        WebhookUrlsModel::delete_by_id(input.webhook_url_id, &app_state.database).await;

    match delete_result {
        Ok(deleted) => HttpResponse::Ok().json(AuthResponse {
            success: true,
            data: Some(DeleteWebhookUrlOutput { deleted }),
            error: None,
        }),
        Err(_) => HttpResponse::InternalServerError().json(AuthResponse::<String> {
            success: false,
            data: None,
            error: Some("Database error".to_string()),
        }),
    }
}

#[derive(Serialize, Deserialize, Debug, ToSchema)]
pub struct TestTriggerWebhookUrlInput {
    session_token: String,
    webhook_url_id: i32,
    // event_type: Option<String>,
    //event_data: Option<serde_json::Value>,
}

async fn test_trigger_webhook(
    input: Json<TestTriggerWebhookUrlInput>,
    app_state: Data<AppState>,
) -> impl Responder {
    // Validate session token
    let token_valid = validate_api_key_or_session_token(&input.session_token, &app_state).await;

    let Some(_) = token_valid else {
        return HttpResponse::Unauthorized().json(AuthResponse::<String> {
            success: false,
            data: None,
            error: Some("Invalid session".to_string()),
        });
    };

    let payment_data: PaymentSummary = PaymentSummary::generate_test_payment_summary();
    let webhook_trigger = WebhookTrigger::with_event_data(input.webhook_url_id, payment_data);

    // Create webhook trigger with payment data or custom data
    /*  let webhook_trigger = if let (Some(event_type), Some(event_data)) = (&input.event_type, &input.event_data) {
        // If custom event data is provided, use it
        let mut trigger = WebhookTrigger::new(input.webhook_url_id);
        trigger.event_type = Some(event_type.clone());
        trigger.event_data = Some(DomainJson::new(event_data.clone()));
        trigger
    } else {
        // Otherwise use default payment summary data
        let payment_data: PaymentSummary = PaymentSummary::generate_test_payment_summary();
        WebhookTrigger::with_event_data(input.webhook_url_id, payment_data)
    };*/

    let trigger_result =
        WebhookTriggersModel::insert_one(webhook_trigger, &app_state.database).await;

    match trigger_result {
        Ok(triggered) => HttpResponse::Ok().json(AuthResponse {
            success: true,
            data: Some(triggered),
            error: None,
        }),
        Err(_) => HttpResponse::InternalServerError().json(AuthResponse::<String> {
            success: false,
            data: None,
            error: Some("Database error".to_string()),
        }),
    }
}

#[derive(Serialize, Deserialize, Debug, ToSchema)]
pub struct AcknowledgeTriggerWebhookUrlInput {
    session_token: String,
    webhook_trigger_id: i32,
}

async fn acknowledge_webhook_trigger(
    input: Json<AcknowledgeTriggerWebhookUrlInput>,
    app_state: Data<AppState>,
) -> impl Responder {
    let token_valid = validate_api_key_or_session_token(&input.session_token, &app_state).await;

    let Some(_) = token_valid else {
        return HttpResponse::Unauthorized().json(AuthResponse::<String> {
            success: false,
            data: None,
            error: Some("Invalid session".to_string()),
        });
    };

    let trigger_result = WebhookTriggersModel::update_status(
        input.webhook_trigger_id,
        WebhookTriggerStatus::Acknowledged,
        &app_state.database,
    )
    .await;

    match trigger_result {
        Ok(triggered) => HttpResponse::Ok().json(AuthResponse {
            success: true,
            data: Some(triggered),
            error: None,
        }),
        Err(_) => HttpResponse::InternalServerError().json(AuthResponse::<String> {
            success: false,
            data: None,
            error: Some("Database error".to_string()),
        }),
    }
}

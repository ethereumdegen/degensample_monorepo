use actix_web::HttpResponse;
use actix_web::Responder;

use defirelay_backend::app_state::AppState;
use defirelay_backend::db::postgres::models::api_key_model::validate_api_key;
use defirelay_backend::db::postgres::models::api_key_model::ApiKey;
use defirelay_backend::db::postgres::models::api_key_model::ApiKeysModel;
use defirelay_backend::db::postgres::models::auth_sessions_model::validate_session_token;
use defirelay_backend::types::domains::eth_address::DomainEthAddress;
use defirelay_backend::types::selected_record::SelectedRecord;
use ethers::types::Address;
use serde::{Deserialize, Serialize};

use actix_web::web::{self, Data, Json, ServiceConfig};

use utoipa::ToSchema;

use super::web_controller::AuthResponse;
use super::web_controller::WebController;

/*


curl -X POST http://localhost:8080/api/apikey/create \
     -H "Content-Type: application/json" \
     -d '{ "session_token": "f97169e34730ca74ced6d59ee684d91e", "wallet_public_address":"0x810E096DDa9ae3Ae2b55a9c45068F9FE8eeea6db"  }'





*/

pub struct ApiKeyController {}

impl ApiKeyController {}

impl WebController for ApiKeyController {
    fn config(cfg: &mut ServiceConfig) {
        cfg.service(
            web::scope("/api/apikey")
                // Add your routes here, e.g.,
                .route("/create", web::post().to(create_api_key))
                .route("/list", web::post().to(list_api_keys))
                .route("/delete", web::post().to(delete_api_key)),
        );
    }
}

#[derive(Serialize, Deserialize, Debug, ToSchema)]
pub struct CreateApiKeyInput {
    session_token: String,
    wallet_public_address: String,

    name: Option<String>,
}

#[utoipa::path(
        post,
        path = "/api/apikey/create",

         request_body = CreateApiKeyInput,

        responses(
            (status = 200, description = "Creates an api key.", body = AuthResponse<CreateApiKeyInput>),
           
        )  

    )]
// Route Handler
async fn create_api_key(
    input: Json<CreateApiKeyInput>,
    app_state: Data<AppState>,
) -> impl Responder {
    let Ok(wallet_address) = input.wallet_public_address.parse::<Address>() else {
        return HttpResponse::InternalServerError().json(AuthResponse::<String> {
            success: false,
            data: None,
            error: Some("Invalid wallet_address".to_string()),
        });
    };

    let token_valid = validate_session_token(&input.session_token, &app_state).await;

    if token_valid.is_none_or(|t| t.public_address.0 != wallet_address) {
        return HttpResponse::InternalServerError().json(AuthResponse::<String> {
            success: false,
            data: None,
            error: Some("Invalid session".to_string()),
        });
    }

    // ------------

    // verify that the provider  id  matches up w the   wallet address  ..

    let scopes = None; // for now

    let new_api_key = ApiKey::new(DomainEthAddress(wallet_address), input.name.clone(), scopes);

    let inserted = ApiKeysModel::insert_one(new_api_key.clone(), &app_state.database).await;

    match inserted {
        Ok(new_id) => {
            let api_key_created_output = ApiKeyCreatedOutput {
                // id: new_id ,
                api_key: new_api_key.apikey,
            };

            HttpResponse::Ok().json(AuthResponse {
                success: true,
                data: Some(api_key_created_output),
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

#[derive(Deserialize, Serialize)]
struct ApiKeyCreatedOutput {
    // id: i32 ,
    api_key: String,
}

#[derive(Serialize, Deserialize, Debug, ToSchema)]
pub struct ListApiKeysInput {
    session_token: String,
    wallet_public_address: DomainEthAddress,
}

#[derive(Serialize, Deserialize, Debug, ToSchema)]
pub struct ListApiKeysOutput {
    pub api_key_id: i32,
    pub api_key: String,
    pub name: Option<String>,
    pub created_at: i64,
}

#[utoipa::path(
    post,
    path = "/api/apikey/list",
    params(
        ("session_token" = String, Query, description = "User's session token"),
        ("wallet_public_address" = String, Query, description = "User's wallet address")
    ),
    responses(
        (status = 200, description = "Lists all API keys for a user", body = AuthResponse<Vec<ListApiKeysOutput>>),
    )
)]
async fn list_api_keys(
    input: web::Query<ListApiKeysInput>,
    app_state: Data<AppState>,
) -> impl Responder {
    let wallet_address = input.wallet_public_address.0;

    // Validate session token
    let token_valid = validate_session_token(&input.session_token, &app_state).await;

    if token_valid.is_none_or(|t| t.public_address.0 != wallet_address) {
        return HttpResponse::Unauthorized().json(AuthResponse::<String> {
            success: false,
            data: None,
            error: Some("Invalid session".to_string()),
        });
    }

    // Fetch API keys for the wallet address
    let api_keys = ApiKeysModel::find_all_by_wallet_address(
        &DomainEthAddress(wallet_address),
        &app_state.database,
    )
    .await;

    match api_keys {
        Ok(keys) => {
            let keys_output: Vec<ListApiKeysOutput> = keys
                .into_iter()
                .map(|selected_key| ListApiKeysOutput {
                    api_key_id: selected_key.id.0,
                    api_key: selected_key.entry.apikey,
                    name: selected_key.entry.name,
                    created_at: selected_key.entry.created_at.timestamp(),
                })
                .collect();

            HttpResponse::Ok().json(AuthResponse {
                success: true,
                data: Some(keys_output),
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
pub struct DeleteApiKeyInput {
    api_key: String,
    //wallet_public_address: String,
    // api_key_id: i32, // We'll use this i32 directly since DomainId contains i32 internally
}

#[derive(Serialize, Deserialize, Debug, ToSchema)]
struct DeleteApiKeyOutput {
    deleted: bool,
}

#[utoipa::path(
    post,
    path = "/api/apikey/delete",
    request_body = DeleteApiKeyInput,
    responses(
        (status = 200, description = "Deletes an API key by ID", body = AuthResponse<DeleteApiKeyOutput>),
    )
)]
async fn delete_api_key(
    input: Json<DeleteApiKeyInput>,
    app_state: Data<AppState>,
) -> impl Responder {
    /*   let Ok(wallet_address) = input.wallet_public_address.parse::<Address>() else {
        return HttpResponse::BadRequest().json(AuthResponse::<String> {
            success: false,
            data: None,
            error: Some("Invalid wallet address".to_string()),
        });
    };*/

    // Validate session token
    let token_valid = validate_api_key(&input.api_key, &app_state).await;

    let Some(token_valid) = token_valid else {
        return HttpResponse::Unauthorized().json(AuthResponse::<String> {
            success: false,
            data: None,
            error: Some("Invalid session".to_string()),
        });
    };

    // Delete the API key
    let delete_result = ApiKeysModel::delete_by_apikey(&input.api_key, &app_state.database).await;

    match delete_result {
        Ok(deleted) => HttpResponse::Ok().json(AuthResponse {
            success: true,
            data: Some(DeleteApiKeyOutput { deleted }),
            error: None,
        }),
        Err(_) => HttpResponse::InternalServerError().json(AuthResponse::<String> {
            success: false,
            data: None,
            error: Some("Database error".to_string()),
        }),
    }
}

use defirelay_backend::app_state::AppState;
use degen_sql::db::postgres::postgres_db::Database;
use dotenvy::dotenv;
use std::sync::Arc;
use tokio::io;

use actix_cors::Cors;
use actix_web::web::Data;
use actix_web::{App, HttpServer};

mod controllers;

use crate::controllers::web_controller::WebController;

use controllers::api_key_controller::ApiKeyController;
 
 
 
use controllers::payments_controller::PaymentsController;
 
use controllers::session_controller::SessionController; 
use controllers::users_controller::UsersController;
use controllers::webhook_urls_controller::WebhookUrlsController;

//use controllers::refill::api_client_keys_controller::ApiClientKeysController;
//use controllers::refill::api_credit_refills_controller::ApiCreditRefillsController; 
//use controllers::refill::api_workspaces_controller::ApiWorkspacesController;





/*

Serves the HTTP api

See 'controllers' for routes and functions

*/

#[tokio::main]
async fn main() -> io::Result<()> {
    dotenv().ok();

    // Initialize the logger
    std::env::set_var("RUST_LOG", "actix_web=info,actix_server=info"); // Adjust as per your needs
    env_logger::init();

    println!("connecting to db.");

    // fs::create_dir_all("./tmp").unwrap();

    let db_conn_url = std::env::var("DB_CONN_URL").expect(" DB_CONN_URL must be set in env ");

    let database = Arc::new(Database::new(db_conn_url, None).unwrap());

    println!("connected to db.");

    //setup and launch the http server
    HttpServer::new(move || {
        let cors = Cors::default()
            //  .allowed_origin("http://localhost:3000")
            // .allowed_origin("http://localhost:8080")
            .allow_any_origin()
            .allowed_methods(vec!["GET", "POST"])
            .allowed_headers(vec!["Authorization", "Accept", "Content-Type"])
            .supports_credentials()
            .max_age(3600);

        let app_state = AppState {
            database: Arc::clone(&database),
        };

        App::new()
            .app_data(Data::new(app_state)) // Clone your db connection or use Arc
            .wrap(cors)
            .wrap(actix_web::middleware::Logger::default()) // Enable logger middleware
            .configure(SessionController::config) // log in with eth
            .configure(ApiKeyController::config) //create api keys
            
            .configure(PaymentsController::config) //find info abt payments
           
       
            .configure(UsersController::config) //user stats and management
            
            .configure(WebhookUrlsController::config) //manage webhook URLs
            //.configure(ApiClientKeysController::config)
           // .configure(ApiWorkspacesController::config)
           // .configure(ApiCreditRefillsController::config)   

          })
    .bind("0.0.0.0:8080")?
    .run()
    .await


    
}

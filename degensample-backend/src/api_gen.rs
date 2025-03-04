use std::fs::File;
use std::io::Write;
use std::path::Path;
use utoipa::OpenApi;

mod controllers;

#[derive(OpenApi)]
#[openapi(
    info(
        title = "defi-relay-backend",
        description = "A protocol for web3 payments.",
        license(
            name = "MIT"
        ),
        version = "0.2.0"
    ),

    paths(
        // API Key Controller 
        controllers::api_key_controller::create_api_key,
        controllers::api_key_controller::list_api_keys,
        controllers::api_key_controller::delete_api_key,
        
        // Invoices Controller (newly annotated)
   
         
        // Invoice Templates Controller (newly annotated)
        
        
        // Payments Controller
        controllers::payments_controller::find_payment_by_invoice_uuid,
        controllers::payments_controller::list_payments,
        
        // Token Symbols Controller
       
        
     
    )
)]
struct ApiDoc;

fn main() {
    // Generate the OpenAPI JSON
    let openapi_json = ApiDoc::openapi().to_pretty_json().unwrap();
    
    // Define the output file path
    let output_path = Path::new("api_docs.json");
    
    // Write to the file
    match File::create(output_path) {
        Ok(mut file) => {
            match file.write_all(openapi_json.as_bytes()) {
                Ok(_) => println!("OpenAPI documentation written to {}", output_path.display()),
                Err(e) => eprintln!("Error writing to file: {}", e),
            }
        },
        Err(e) => eprintln!("Error creating file: {}", e),
    }
    
    // Also print to stdout for convenience
    println!("{}", openapi_json);
}

// Note: To include additional endpoints in the API documentation, each controller endpoint 
// needs to be properly annotated with #[utoipa::path] and use #[derive(ToSchema)] for input/output types.
//
// The following endpoint paths are registered in webserver.rs but still need annotation before they can be 
// included in the API documentation:
//
// - Session Controller:
//   - /api/session/generate_challenge
//   - /api/session/validate_authentication
// 
// - Products Controller:
//   - /api/products/create
//   - /api/products/find_by_uuid
//   - /api/products/list
//
// - Checkouts Controller:
//   - /api/checkout/create
//   - /api/checkout/find_by_uuid
//   - /api/checkout/list
//
// - Users Controller:
//   - /api/users/get_user
//   - /api/users/update
//
// - Webhook URLs Controller:
//   - /api/webhook_url/create
//   - /api/webhook_url/list
//   - /api/webhook_url/delete

mod bots;

use bots::payment_summary_bot::run_payment_summary;
use bots::vibegraph_bot::run_vibegraph_bot;


use bots::webhook_trigger_bot::run_webhook_trigger_bot;

//use bots::credit_refill_bot::run_credit_refill_bot;

#[tokio::main]
async fn main() {
    env_logger::init();
    dotenvy::dotenv().ok();

    //if any panics, the entire combined bot panics
    let result = tokio::try_join!(
        tokio::spawn(run_vibegraph_bot()),
        tokio::spawn(run_payment_summary()),
        tokio::spawn(run_webhook_trigger_bot()) ,
        
    );

    match result {
        Ok(_) => println!("All workers completed successfully."),
        Err(err) => {
            eprintln!("A worker thread panicked or failed: {:?}", err);
            std::process::exit(1); // 🚨 Force the application to exit
        }
    }
}
 
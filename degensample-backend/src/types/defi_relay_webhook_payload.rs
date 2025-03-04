use crate::db::postgres::models::webhook_triggers_model::WebhookTriggerJoined;
use crate::types::domains::json::DomainJson;
use crate::types::selected_record::SelectedRecord;
use crate::util::header_map_preset::HeaderMapPreset;
use crate::util::http_request::EndpointType;
use crate::util::http_request::IntoHttpRequest;
use reqwest::header::HeaderMap;
use serde::Deserialize;
use serde::Serialize;


#[derive(Serialize, Deserialize)]
pub struct DefiRelayWebhookPayload {
    pub webhook_trigger_id: i32,
    pub webhook_id: i32,

    pub webhook_url: String,

    pub event_type: Option<String>,
    pub event_data: Option<DomainJson>,
}

impl DefiRelayWebhookPayload {
    pub fn from_webhook_trigger_joined(input: SelectedRecord<WebhookTriggerJoined>) -> Self {
        let id = input.id;
        let trig = input.entry.webhook_trigger;
        let webhook_url = input.entry.webhook_url;

        Self {
            webhook_trigger_id: id.into(),
            webhook_id: trig.webhook_id,
            webhook_url: webhook_url.webhook_url,
            event_type: trig.event_type, // often, 'payment_summary'
            event_data: trig.event_data, // often, PaymentSummary
        }
    }
}

impl IntoHttpRequest for DefiRelayWebhookPayload {
    fn get_url(&self) -> String {
        self.webhook_url.clone()
    }

    fn get_data(&self) -> serde_json::Value {
        serde_json::to_value(self).unwrap_or_default()
    }

    fn get_headers(&self) -> Option<HeaderMap> {
        Some(HeaderMapPreset::ApplicationJson.build())
    }

    fn get_endpoint_type(&self) -> EndpointType {
        EndpointType::POST
    }
}

/*
#[derive(Serialize,Deserialize)]
pub enum WebhookEventPayload {


    InvoicePayment(  PaymentSummary )



}
*/

/*


#[derive(Clone, Debug,  Serialize,  Deserialize)]
pub struct PaymentSummary {
    pub uuid: DomainBytes32,
    pub chain_id: i64,
    pub payspec_contract_address: DomainEthAddress,
    pub payment_token_address: DomainEthAddress,
    pub from_address: DomainEthAddress,
    pub nonce: DomainUint256,
  //  #[serde(rename = "total_amount")]
  //  pub totalAmount: DomainUint256,
    pub pay_to_array: DomainPayToArray,
    pub pay_to_amounts: DomainPayToAmounts,
    pub transaction_hash: DomainH256,
    pub payment_at_block: Option<i64>,
    pub payment_at_block_timestamp: Option<DateTime<Utc>>,
    pub payment_at_unix_days_index: Option<i64>,
}

 */

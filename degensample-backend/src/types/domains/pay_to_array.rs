use serde::de;
use serde::de::Visitor;
use serde::Deserializer;
use serde::Serializer;
use std::fmt;

use bytes::BytesMut;
use ethers::types::Address;
use serde::{Deserialize, Serialize};
use std::borrow::Cow;
use std::{error::Error, str::FromStr};
use tokio_postgres::types::{to_sql_checked, FromSql, IsNull, ToSql, Type};
use utoipa::openapi::schema::SchemaType;
use utoipa::openapi::KnownFormat;
use utoipa::openapi::ObjectBuilder;
use utoipa::openapi::RefOr;
use utoipa::openapi::Schema;
use utoipa::openapi::SchemaFormat;
use utoipa::PartialSchema;
use utoipa::ToSchema;

use crate::types::domains::eth_address::DomainEthAddress;

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct DomainPayToArray(pub Vec<Address>);

// Implement utoipa schema for OpenAPI documentation
impl utoipa::PartialSchema for DomainPayToArray {
    fn schema() -> RefOr<Schema> {
        RefOr::T(Schema::Object(
            ObjectBuilder::new()
                .schema_type(SchemaType::Type(utoipa::openapi::Type::Array))
                .description(Some("Array of Ethereum addresses"))
                .build(),
        ))
    }
}

impl utoipa::ToSchema for DomainPayToArray {
    fn name() -> Cow<'static, str> {
        Cow::Borrowed("DomainPayToArray")
    }

    fn schemas(schemas: &mut Vec<(String, RefOr<Schema>)>) {
        schemas.push((Self::name().to_string(), Self::schema()));
    }
}

// PostgreSQL serialization/deserialization
impl<'a> FromSql<'a> for DomainPayToArray {
    fn from_sql(ty: &Type, raw: &'a [u8]) -> Result<Self, Box<dyn Error + Sync + Send>> {
        // Parse the PostgreSQL array into a Vec<String> first
        let address_strings = <Vec<String> as FromSql>::from_sql(ty, raw)?;

        // Convert each string address to an ethers Address
        let mut addresses = Vec::new();
        for addr_str in address_strings {
            addresses.push(Address::from_str(&addr_str)?);
        }

        Ok(DomainPayToArray(addresses))
    }

    fn accepts(sql_type: &Type) -> bool {
        // Accept array of text/varchar types
        sql_type == &Type::TEXT_ARRAY || sql_type == &Type::VARCHAR_ARRAY
    }
}

impl ToSql for DomainPayToArray {
    fn to_sql(
        &self,
        ty: &Type,
        out: &mut BytesMut,
    ) -> Result<IsNull, Box<dyn Error + Sync + Send>> {
        // Convert the Vec<Address> to Vec<String> using DomainEthAddress format
        let addresses: Vec<String> = self
            .0
            .iter()
            .map(|addr| {
                let domain_addr = DomainEthAddress(*addr);
                domain_addr.to_string_full()
            })
            .collect();

        // Use the PostgreSQL array serialization for Vec<String>
        <Vec<String> as ToSql>::to_sql(&addresses, ty, out)
    }

    fn accepts(sql_type: &Type) -> bool {
        sql_type == &Type::TEXT_ARRAY || sql_type == &Type::VARCHAR_ARRAY
    }

    to_sql_checked!();
}

// Implement Serialize for JSON conversion
impl Serialize for DomainPayToArray {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        // Serialize as a vector of strings using DomainEthAddress format
        let string_values: Vec<String> = self
            .0
            .iter()
            .map(|addr| {
                let domain_addr = DomainEthAddress(*addr);
                domain_addr.to_string_full()
            })
            .collect();

        string_values.serialize(serializer)
    }
}

// Implement Deserialize for JSON conversion
impl<'de> Deserialize<'de> for DomainPayToArray {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct DomainPayToArrayVisitor;

        impl<'de> Visitor<'de> for DomainPayToArrayVisitor {
            type Value = DomainPayToArray;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a sequence of strings representing Ethereum addresses")
            }

            fn visit_seq<A>(self, mut seq: A) -> Result<Self::Value, A::Error>
            where
                A: de::SeqAccess<'de>,
            {
                let mut addresses = Vec::new();

                // Process each element in the sequence
                while let Some(value) = seq.next_element::<serde_json::Value>()? {
                    match value {
                        serde_json::Value::String(s) => {
                            // Try to parse the string as an Ethereum address
                            match Address::from_str(&s) {
                                Ok(addr) => addresses.push(addr),
                                Err(e) => {
                                    return Err(de::Error::custom(format!(
                                        "Invalid Ethereum address: {}",
                                        e
                                    )))
                                }
                            }
                        }
                        _ => return Err(de::Error::custom("Expected string for Ethereum address")),
                    }
                }

                Ok(DomainPayToArray(addresses))
            }
        }

        deserializer.deserialize_seq(DomainPayToArrayVisitor)
    }
}

// Helper methods
impl DomainPayToArray {
    pub fn to_string_array(&self) -> Vec<String> {
        self.0
            .iter()
            .map(|addr| {
                let domain_addr = DomainEthAddress(*addr);
                domain_addr.to_string_full()
            })
            .collect()
    }

    pub fn new(addresses: Vec<Address>) -> Self {
        Self(addresses)
    }

    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    pub fn len(&self) -> usize {
        self.0.len()
    }
}

// Allow easy conversion from Vec<Address> to DomainPayToArray
impl From<Vec<Address>> for DomainPayToArray {
    fn from(addresses: Vec<Address>) -> Self {
        Self(addresses)
    }
}

// Allow iteration over the addresses
impl AsRef<[Address]> for DomainPayToArray {
    fn as_ref(&self) -> &[Address] {
        &self.0
    }
}

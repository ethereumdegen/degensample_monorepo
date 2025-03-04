use bytes::BytesMut;
use ethers::types::U256;
use serde::de;
use serde::de::Visitor;
use serde::Deserializer;
use serde::Serializer;
use serde::{Deserialize, Serialize};
use std::borrow::Cow;
use std::error::Error;
use std::fmt;
use tokio_postgres::types::{to_sql_checked, FromSql, IsNull, ToSql, Type};
use utoipa::openapi::schema::SchemaType;
use utoipa::openapi::KnownFormat;
use utoipa::openapi::ObjectBuilder;
use utoipa::openapi::RefOr;
use utoipa::openapi::Schema;
use utoipa::openapi::SchemaFormat;
use utoipa::PartialSchema;
use utoipa::ToSchema;

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct DomainPayToAmounts(pub Vec<U256>);

// Implement utoipa schema for OpenAPI documentation
impl utoipa::PartialSchema for DomainPayToAmounts {
    fn schema() -> RefOr<Schema> {
        RefOr::T(Schema::Object(
            ObjectBuilder::new()
                .schema_type(SchemaType::Type(utoipa::openapi::Type::Array))
                .description(Some("Array of token amounts as strings"))
                .build(),
        ))
    }
}

impl utoipa::ToSchema for DomainPayToAmounts {
    fn name() -> Cow<'static, str> {
        Cow::Borrowed("DomainPayToAmounts")
    }
    fn schemas(schemas: &mut Vec<(String, RefOr<Schema>)>) {
        schemas.push((Self::name().to_string(), Self::schema()));
    }
}

// PostgreSQL serialization/deserialization for DomainPayToAmounts
impl<'a> FromSql<'a> for DomainPayToAmounts {
    fn from_sql(ty: &Type, raw: &'a [u8]) -> Result<Self, Box<dyn Error + Sync + Send>> {
        // Parse the PostgreSQL array into a Vec<String>
        let string_amounts = <Vec<String> as FromSql>::from_sql(ty, raw)?;

        // Convert each string to U256 (decimal representation)
        let u256_amounts = string_amounts
            .into_iter()
            .map(|str_value| {
                // Debug log
                println!("Converting from SQL to U256: {}", str_value);

                match U256::from_dec_str(&str_value) {
                    Ok(value) => Ok(value),
                    Err(e) => Err(Box::new(std::io::Error::new(
                        std::io::ErrorKind::InvalidData,
                        format!(
                            "Failed to parse U256 from string: {}. Input: {}",
                            e, str_value
                        ),
                    )) as Box<dyn Error + Sync + Send>),
                }
            })
            .collect::<Result<Vec<U256>, Box<dyn Error + Sync + Send>>>()?;

        Ok(DomainPayToAmounts(u256_amounts))
    }

    fn accepts(sql_type: &Type) -> bool {
        sql_type == &Type::TEXT_ARRAY
    }
}

impl ToSql for DomainPayToAmounts {
    fn to_sql(
        &self,
        ty: &Type,
        out: &mut BytesMut,
    ) -> Result<IsNull, Box<dyn Error + Sync + Send>> {
        // Convert Vec<U256> to Vec<String> as decimal strings
        let string_amounts: Vec<String> = self
            .0
            .iter()
            .map(|u256| {
                // Explicitly use decimal string representation (no hex, no 0x prefix)
                let decimal_str = u256.to_string();

                // Debug log
                println!("Converting U256 to SQL: {}", decimal_str);

                decimal_str
            })
            .collect();

        // Use the PostgreSQL array serialization for Vec<String>
        <Vec<String> as ToSql>::to_sql(&string_amounts, ty, out)
    }

    fn accepts(sql_type: &Type) -> bool {
        sql_type == &Type::TEXT_ARRAY
    }

    to_sql_checked!();
}

// Helper methods
impl DomainPayToAmounts {
    pub fn to_string_array(&self) -> Vec<String> {
        self.0
            .iter()
            .map(|amount| amount.to_string()) // Explicitly decimal
            .collect()
    }

    pub fn new(amounts: Vec<U256>) -> Self {
        Self(amounts)
    }

    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    pub fn len(&self) -> usize {
        self.0.len()
    }

    pub fn sum(&self) -> U256 {
        self.0.iter().fold(U256::zero(), |acc, x| acc + *x)
    }
}

// Allow easy conversion from Vec<U256> to DomainPayToAmounts
impl From<Vec<U256>> for DomainPayToAmounts {
    fn from(amounts: Vec<U256>) -> Self {
        Self(amounts)
    }
}

// Allow iteration over the amounts
impl AsRef<[U256]> for DomainPayToAmounts {
    fn as_ref(&self) -> &[U256] {
        &self.0
    }
}

impl Serialize for DomainPayToAmounts {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        // Serialize as a vector of strings where each U256 is represented as a decimal string
        let string_values: Vec<String> = self
            .0
            .iter()
            .map(|amount| amount.to_string()) // Explicitly decimal
            .collect();

        string_values.serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for DomainPayToAmounts {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct DomainPayToAmountsVisitor;

        impl<'de> Visitor<'de> for DomainPayToAmountsVisitor {
            type Value = DomainPayToAmounts;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a sequence of strings or numbers representing U256 values")
            }

            fn visit_seq<A>(self, mut seq: A) -> Result<Self::Value, A::Error>
            where
                A: de::SeqAccess<'de>,
            {
                let mut amounts = Vec::new();

                // Process each element in the sequence
                while let Some(value) = seq.next_element::<serde_json::Value>()? {
                    match value {
                        serde_json::Value::String(s) => {
                            // Handle possible hexadecimal representation
                            let clean_str = s.trim_start_matches("0x");

                            let amount = if s.starts_with("0x") {
                                // Handle hex string with 0x prefix
                                U256::from_str_radix(clean_str, 16).map_err(|e| {
                                    de::Error::custom(format!("Invalid hex U256 string: {}", e))
                                })?
                            } else {
                                // Handle decimal string
                                // Check if the string is too long before parsing
                                if s.len() > 78 {
                                    // U256 max decimal digits
                                    return Err(de::Error::custom(
                                        "Invalid decimal: overflow from too many digits",
                                    ));
                                }

                                U256::from_dec_str(&s).map_err(|e| {
                                    de::Error::custom(format!("Invalid decimal U256 string: {}", e))
                                })?
                            };

                            amounts.push(amount);
                        }
                        serde_json::Value::Number(n) => {
                            let num_str = n.to_string();
                            // Check if the number string is too long
                            if num_str.len() > 78 {
                                // U256 max decimal digits
                                return Err(de::Error::custom(
                                    "Invalid decimal: overflow from too many digits",
                                ));
                            }

                            if let Some(n_u64) = n.as_u64() {
                                amounts.push(U256::from(n_u64));
                            } else {
                                return Err(de::Error::custom(
                                    "Number too large for u64 or negative",
                                ));
                            }
                        }
                        _ => return Err(de::Error::custom("Expected string or number for U256")),
                    }
                }

                Ok(DomainPayToAmounts(amounts))
            }
        }

        deserializer.deserialize_seq(DomainPayToAmountsVisitor)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json;

    #[test]
    fn test_decimal_string_conversion() {
        // Create test values of various sizes
        let values = vec![
            U256::from(123),
            U256::from(u64::MAX),
            U256::from(2).pow(U256::from(100)),
            U256::from(2).pow(U256::from(200)),
        ];

        // Test that each value correctly converts to a decimal string (not hex)
        for value in &values {
            let decimal_str = value.to_string();

            // Verify it doesn't have 0x prefix (not hex)
            assert!(!decimal_str.starts_with("0x"));

            // Verify it contains only decimal digits
            assert!(decimal_str.chars().all(|c| c.is_digit(10)));

            // Verify we can parse it back correctly
            let parsed = U256::from_dec_str(&decimal_str).unwrap();
            assert_eq!(*value, parsed);
        }
    }

    #[test]
    fn test_serde_roundtrip() {
        // Create a DomainPayToAmounts with various sized values
        let values = vec![
            U256::from(123),
            U256::from(u64::MAX),
            U256::from(2).pow(U256::from(100)),
            U256::from(2).pow(U256::from(200)),
        ];

        let original = DomainPayToAmounts(values);

        // Serialize to JSON
        let json = serde_json::to_string(&original).unwrap();
        println!("Serialized JSON: {}", json);

        // Verify it's an array of decimal strings (not hex)
        assert!(!json.contains("0x"));

        // Deserialize back
        let deserialized: DomainPayToAmounts = serde_json::from_str(&json).unwrap();

        // Verify roundtrip worked
        assert_eq!(original, deserialized);
        assert_eq!(original.0, deserialized.0);

        // Check individual values
        for (i, val) in original.0.iter().enumerate() {
            assert_eq!(*val, deserialized.0[i]);
            println!("Value {} roundtrip successful: {}", i, val);
        }
    }

    #[test]
    fn test_deserialize_hex_and_decimal() {
        // Test JSON with mix of decimal and hex strings
        let json = r#"["123", "0x1a", 456]"#;

        let deserialized: DomainPayToAmounts = serde_json::from_str(json).unwrap();

        assert_eq!(deserialized.0.len(), 3);
        assert_eq!(deserialized.0[0], U256::from(123));
        assert_eq!(deserialized.0[1], U256::from(26)); // 0x1a = 26
        assert_eq!(deserialized.0[2], U256::from(456));
    }

    #[test]
    fn test_sql_simulation() {
        // Create test values
        let values = vec![
            U256::from(123),
            U256::from(u64::MAX),
            U256::from(2).pow(U256::from(100)),
        ];

        let domain = DomainPayToAmounts(values);

        // Convert to strings as it would happen in to_sql
        let string_amounts: Vec<String> = domain.0.iter().map(|u256| u256.to_string()).collect();

        // Verify all strings are decimal format (no hex, no 0x)
        for s in &string_amounts {
            assert!(!s.starts_with("0x"));
            assert!(s.chars().all(|c| c.is_digit(10)));
        }

        // Simulate conversion back as would happen in from_sql
        let u256_amounts: Vec<U256> = string_amounts
            .iter()
            .map(|s| U256::from_dec_str(s).unwrap())
            .collect();

        let roundtrip = DomainPayToAmounts(u256_amounts);

        // Verify roundtrip worked
        assert_eq!(domain, roundtrip);

        // Check individual values
        for (i, val) in domain.0.iter().enumerate() {
            assert_eq!(*val, roundtrip.0[i]);
            println!("SQL Value {} roundtrip successful: {}", i, val);
        }
    }
}

use serde::{   Deserializer,    Serializer};
use serde::de::{self, Visitor};
use std::fmt;
 
use ethers::types::U64;
use ethers::types::{Address, U256};
use rust_decimal::Decimal;
use rust_decimal::prelude::*;
use tokio_postgres::types::{FromSql, ToSql};
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::str::FromStr;

/// Trait for converting between Web3 types and PostgreSQL-compatible SQL types
pub trait Web3Sql<T>: Sized {
    fn to_sql(&self) -> Box<dyn ToSql + Sync>; // Convert to a format PostgreSQL understands
    fn from_sql(input: T) -> Result<Self, Box<dyn Error>>; // Convert from PostgreSQL type
}

/// Wrapper for `Address` (stored as `VARCHAR(255)` in PostgreSQL)
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Web3Address(pub Address);

/// Implement `Web3Sql` for `Web3Address`

// use VARCHAR(255) in sql 
impl<T> Web3Sql<T> for Web3Address
where
    T: ToString, // Ensures the input can be converted to a string
{
    fn to_sql(&self) -> Box<dyn ToSql + Sync> {
        Box::new(self.0.to_string()) // Convert Address to String for storage
    }

    fn from_sql(input: T) -> Result<Self, Box<dyn Error>> {
        let addr_str = input.to_string(); // Convert input to String
        let addr = Address::from_str(&addr_str)?; // Convert String to Address
        Ok(Web3Address(addr))
    }
}

/// Wrapper for `U256` (stored as `DECIMAL` in PostgreSQL)
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Web3U256(pub U256);

/// Implement `Web3Sql` for `Web3U256`
 
 
 //use DECIMAL in sql 
impl Web3Sql<Decimal> for Web3U256 {
    fn to_sql(&self) -> Box<dyn ToSql + Sync> {
        let decimal_value = Decimal::from_u128(self.0.low_u128()).unwrap(); // Convert U256 to Decimal
        Box::new(decimal_value)
    }

    fn from_sql(input: Decimal) -> Result<Self, Box<dyn Error>> {


        // Convert Decimal directly to U256
        let u256_value = U256::from_dec_str(input.to_u128().ok_or("Invalid decimal conversion")? .to_string().as_str() );
        Ok(Web3U256(u256_value?))
    }
}



#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Web3i64(pub i64);

/// Implement `Web3Sql` for `Web3U256`
 
 
 //use BIGINT in sql 
/// Implement `Web3Sql` for `Web3U64`
impl Web3Sql<i64> for Web3i64 {
    fn to_sql(&self) -> Box<dyn ToSql + Sync> {
        let i64_value = self.0  ; // Convert U64 to u64
        Box::new(i64_value) // Store as BIGINT in PostgreSQL
    }

    fn from_sql(input: i64) -> Result<Self, Box<dyn Error>> {
        Ok(Web3i64( input )) // Convert u64 to U64 and wrap in Web3U64
    }
}




#[derive(Debug, Clone, PartialEq, Eq )]
pub struct Web3RawBytes(pub Vec<u8>);

// use BYTEA in sql 
 
 impl Web3Sql<Vec<u8>> for Web3RawBytes {
    fn to_sql(&self) -> Box<dyn ToSql + Sync> {
        Box::new(self.0.clone()) // Store `Vec<u8>` directly in PostgreSQL as BYTEA
    }

    fn from_sql(input: Vec<u8>) -> Result<Self, Box<dyn Error>> {
        Ok(Web3RawBytes(input)) // Directly wrap the binary data
    }
}


impl Serialize for Web3RawBytes {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let hex_string = hex::encode(&self.0);
        serializer.serialize_str(&format!("0x{}", hex_string))
    }
}

impl<'de> Deserialize<'de> for Web3RawBytes {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_str(Web3RawBytesVisitor)
    }
}

struct Web3RawBytesVisitor;

impl<'de> Visitor<'de> for Web3RawBytesVisitor {
    type Value = Web3RawBytes;

    fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
        formatter.write_str("a hex string representing bytes")
    }

    fn visit_str<E>(self, v: &str) -> Result<Web3RawBytes, E>
    where
        E: de::Error,
    {
        if v.starts_with("0x") {
            hex::decode(&v[2..])
                .map(Web3RawBytes)
                .map_err(de::Error::custom)
        } else {
            Err(de::Error::custom("expected hex string to start with '0x'"))
        }
    }
}
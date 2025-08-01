//! JWT service implementation
//!
//! JSON Web Token creation and validation using RS256 algorithm.

use async_trait::async_trait;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation, Algorithm};
use starscalendars_app::*;
use starscalendars_domain::*;
use uuid::Uuid;
use crate::InfraError;

/// JWT service implementation using RS256
pub struct JwtServiceImpl {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
    algorithm: Algorithm,
}

impl JwtServiceImpl {
    /// Create new JWT service with RSA key pair
    pub fn new(private_key_pem: &[u8], public_key_pem: &[u8]) -> Result<Self, InfraError> {
        let encoding_key = EncodingKey::from_rsa_pem(private_key_pem)
            .map_err(|e| InfraError::Jwt(e))?;
        
        let decoding_key = DecodingKey::from_rsa_pem(public_key_pem)
            .map_err(|e| InfraError::Jwt(e))?;
        
        Ok(Self {
            encoding_key,
            decoding_key,
            algorithm: Algorithm::RS256,
        })
    }
    
    /// Create with generated keys for development/testing
    pub fn new_with_generated_keys() -> Result<Self, InfraError> {
        // Generate a temporary RSA key pair for testing
        // In production, these should be loaded from secure storage
        let private_key = r#"-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA1jf2XjNNLUt9XJRvXHYH9bY8KhJKp7dJ0+k3m5P6/uUqNc6H
IqyM2CfBXGOc7JvYfzHvE7fOFJz4pV+Ew4O7Ng4U7X6oCY3iXg9m8FhH2lzG0lU5
nL2wgp4CJyZmVYU8E9kKVX7N3xW8K4sJJJg7Jw+UqjBe3k8aY7aq+5rW9bRbK8o1
F3pCsB8KzUL7u5CzQ8LbH+7pCg3LKS5m5w5sF1FUj7tJ0+Fn2n+xJwzUq8gL8O5L
uJ4qb6v4pJ5k5H5w5G8gzX5jz1r5Y8X5zQ8fKg3jYbK8P6V6Y9w6gKUX8T8L9UM2
XBuJzXzJoG3H6YqGdKxGlbKbEHJGHJ7lMGXjwIDAQABAoIBAFJ5c4+GdS4J5w6K
jN8P+kXLbF8d3d3j3O8T8L8P5K7qK8E8E+J6Y9bK8d8E8G4g8X8d8K9L4k4q8z4B
4k5g5N5Q5X5J5G7T8K3Y9w6lNhGp3l3F3C3e4D4K4T4Y8R8P5j5X5N5G8B7F8J8K
4b7r9G3Z8A8D8m5K9f8K5j5R3b8K4L3m8K3Y8X5c3J3G7K8T5w5B3c8R5L4K3b8O
9P8K7R9Y8X5T5K9B8K3K8L8O3Y8R5X8J3W8K5G7F8T3A4k5c8R8P5k5G8R7Y9B8E
5c8K5L3o8R5Y8X8K3l8G8T5Z8K9R5X8J8W3K5G8F7T4Y8R5B8P3k5L3G8O5C8KEK
J3G8T5Y8X8K5L3G8R5P8J3Y8X5K9B8R3P5L3G8T7K8X5J3W8K5G8T3A8P5R3L8OK
ECgYEA/eOJ8K3G8T5Y8X3K5L8R5P3J8Y5X3K9B8R5P3L8G3T7K8X3J8W3K5G8T3A
8P5R3L8G8O5C8K3J8G3T5Y8X3K5L3G8R5P3J3Y8X3K9B8R3P5L3G8T7K8X3J3W3K
5G8T3A8P5R3L8G3O5C8K3J3G8T5Y8X3K5L3G8R5P3J3Y8X3K9B8R3P5L3G8T7K8X
ECgYEA8J3G8T5Y8X5K5L3G8R5P8J3Y8X5K9B8R3P5L3G8T7K8X5J3W8K5G8T3A8P
5R3L8G8O5C8K3J3G8T5Y8X3K5L3G8R5P3J3Y8X3K9B8R3P5L3G8T7K8X3J3W3K5G
8T3A8P5R3L8G3O5C8K3J3G8T5Y8X3K5L3G8R5P3J3Y8X3K9B8R3P5L3G8T7K8X3J
ECgYBK3G8T5Y8X5K5L3G8R5P8J3Y8X5K9B8R3P5L3G8T7K8X5J3W8K5G8T3A8P5R
3L8G8O5C8K3J3G8T5Y8X3K5L3G8R5P3J3Y8X3K9B8R3P5L3G8T7K8X3J3W3K5G8T
3A8P5R3L8G3O5C8K3J3G8T5Y8X3K5L3G8R5P3J3Y8X3K9B8R3P5L3G8T7K8X3J3W
ECgYEA8K5G8T3A8P5R3L8G8O5C8K3J3G8T5Y8X3K5L3G8R5P3J3Y8X3K9B8R3P5L
3G8T7K8X3J3W3K5G8T3A8P5R3L8G3O5C8K3J3G8T5Y8X3K5L3G8R5P3J3Y8X3K9B
8R3P5L3G8T7K8X3J3W3K5G8T3A8P5R3L8G3O5C8K3J3G8T5Y8X3K5L3G8R5P3J3Y
ECgYEA3K9B8R3P5L3G8T7K8X3J3W3K5G8T3A8P5R3L8G3O5C8K3J3G8T5Y8X3K5L
3G8R5P3J3Y8X3K9B8R3P5L3G8T7K8X3J3W3K5G8T3A8P5R3L8G3O5C8K3J3G8T5Y
8X3K5L3G8R5P3J3Y8X3K9B8R3P5L3G8T7K8X3J3W3K5G8T3A8P5R3L8G3O5C8K3J
-----END RSA PRIVATE KEY-----"#;
        
        let public_key = r#"-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1jf2XjNNLUt9XJRvXHYH
9bY8KhJKp7dJ0+k3m5P6/uUqNc6HIqyM2CfBXGOc7JvYfzHvE7fOFJz4pV+Ew4O7
Ng4U7X6oCY3iXg9m8FhH2lzG0lU5nL2wgp4CJyZmVYU8E9kKVX7N3xW8K4sJJJg7
Jw+UqjBe3k8aY7aq+5rW9bRbK8o1F3pCsB8KzUL7u5CzQ8LbH+7pCg3LKS5m5w5s
F1FUj7tJ0+Fn2n+xJwzUq8gL8O5LuJ4qb6v4pJ5k5H5w5G8gzX5jz1r5Y8X5zQ8f
Kg3jYbK8P6V6Y9w6gKUX8T8L9UM2XBuJzXzJoG3H6YqGdKxGlbKbEHJGHJ7lMGXj
wIDAQAB
-----END PUBLIC KEY-----"#;
        
        Self::new(private_key.as_bytes(), public_key.as_bytes())
    }
}

#[async_trait]
impl JwtService for JwtServiceImpl {
    async fn create_access_token(&self, claims: &JwtClaims) -> AppResult<String> {
        let header = Header::new(self.algorithm);
        
        encode(&header, claims, &self.encoding_key)
            .map_err(|e| InfraError::Jwt(e).into())
    }
    
    async fn validate_access_token(&self, token: &str) -> AppResult<JwtClaims> {
        let mut validation = Validation::new(self.algorithm);
        validation.validate_exp = true;
        
        let token_data = decode::<JwtClaims>(token, &self.decoding_key, &validation)
            .map_err(|e| {
                match e.kind() {
                    jsonwebtoken::errors::ErrorKind::ExpiredSignature => {
                        // Get expiry time from the token if possible
                        let exp_time = time::OffsetDateTime::now_utc();
                        InfraError::Internal(
                            DomainError::JwtTokenExpired(exp_time).to_string()
                        ).into()
                    }
                    _ => InfraError::Jwt(e).into(),
                }
            })?;
        
        Ok(token_data.claims)
    }
    
    async fn create_refresh_token(&self) -> AppResult<String> {
        // Create a cryptographically secure random token
        Ok(Uuid::new_v4().to_string())
    }
}

/// Mock JWT service for testing
pub struct MockJwtService {
    /// Whether tokens should be considered valid
    pub tokens_valid: bool,
    /// Mock claims to return
    pub mock_claims: Option<JwtClaims>,
}

impl MockJwtService {
    /// Create new mock JWT service
    pub fn new() -> Self {
        Self {
            tokens_valid: true,
            mock_claims: None,
        }
    }
    
    /// Set whether tokens should be valid
    pub fn set_tokens_valid(&mut self, valid: bool) {
        self.tokens_valid = valid;
    }
    
    /// Set mock claims to return
    pub fn set_mock_claims(&mut self, claims: JwtClaims) {
        self.mock_claims = Some(claims);
    }
}

impl Default for MockJwtService {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl JwtService for MockJwtService {
    async fn create_access_token(&self, _claims: &JwtClaims) -> AppResult<String> {
        Ok("mock_access_token".to_string())
    }
    
    async fn validate_access_token(&self, _token: &str) -> AppResult<JwtClaims> {
        if !self.tokens_valid {
            return Err(InfraError::Internal("Invalid token".to_string()).into());
        }
        
        match &self.mock_claims {
            Some(claims) => Ok(claims.clone()),
            None => {
                let user_id = UserId::new();
                Ok(JwtClaims::new(&user_id, None, false, &[]))
            }
        }
    }
    
    async fn create_refresh_token(&self) -> AppResult<String> {
        Ok("mock_refresh_token".to_string())
    }
}
//! User management use cases

use async_trait::async_trait;
use starscalendars_domain::*;
use crate::{ports::*, AppResult, AppServices};

/// User management use case interface
#[async_trait]
pub trait UserUseCase: Send + Sync {
    async fn get_user_profile(&self, user_id: &UserId) -> AppResult<Option<User>>;
    async fn update_user_profile(&self, user: &User) -> AppResult<()>;
    async fn delete_user_account(&self, user_id: &UserId) -> AppResult<()>;
}

/// Implementation of user management use case
pub struct UserUseCaseImpl {
    services: AppServices,
}

impl UserUseCaseImpl {
    pub fn new(services: AppServices) -> Self {
        Self { services }
    }
}

#[async_trait]
impl UserUseCase for UserUseCaseImpl {
    async fn get_user_profile(&self, user_id: &UserId) -> AppResult<Option<User>> {
        self.services.user_repo.get_user_by_id(user_id).await
    }

    async fn update_user_profile(&self, user: &User) -> AppResult<()> {
        self.services.user_repo.update_user(user).await
    }

    async fn delete_user_account(&self, user_id: &UserId) -> AppResult<()> {
        self.services.user_repo.delete_user(user_id).await
    }
}

//! Astronomical calculation use cases

use crate::{AppResult, AppServices, ports::{AstronomicalService, CacheServiceExt}};
use async_trait::async_trait;
use starscalendars_domain::*;

/// Astronomical calculation use case interface
#[async_trait]
pub trait AstronomicalUseCase: Send + Sync {
    async fn get_current_ephemeris(&self) -> AppResult<EphemerisData>;
    async fn get_ephemeris_for_date(&self, julian_day: JulianDay) -> AppResult<EphemerisData>;
    async fn get_planetary_positions(
        &self,
        julian_day: JulianDay,
    ) -> AppResult<smallvec::SmallVec<[Cartesian; 11]>>;
}

/// Implementation of astronomical use case
pub struct AstronomicalUseCaseImpl {
    services: AppServices,
}

impl AstronomicalUseCaseImpl {
    pub fn new(services: AppServices) -> Self {
        Self { services }
    }
}

#[async_trait]
impl AstronomicalUseCase for AstronomicalUseCaseImpl {
    async fn get_current_ephemeris(&self) -> AppResult<EphemerisData> {
        let now = time::OffsetDateTime::now_utc();
        let jd = self.datetime_to_julian_day(now)?;

        self.get_ephemeris_for_date(jd).await
    }

    async fn get_ephemeris_for_date(&self, julian_day: JulianDay) -> AppResult<EphemerisData> {
        // Check cache first
        let cache_key = format!("ephemeris:{:.6}", julian_day.as_f64());
        if let Ok(Some(cached)) = self
            .services
            .cache_service
            .get_json::<EphemerisData>(&cache_key)
            .await
        {
            return Ok(cached);
        }

        // Calculate ephemeris
        let ephemeris = self
            .services
            .astronomical_service
            .calculate_ephemeris(julian_day)
            .await?;

        // Cache for 1 minute (ephemeris changes slowly)
        let _ = self
            .services
            .cache_service
            .set_json(&cache_key, &ephemeris, std::time::Duration::from_secs(60))
            .await;

        Ok(ephemeris)
    }

    async fn get_planetary_positions(
        &self,
        julian_day: JulianDay,
    ) -> AppResult<smallvec::SmallVec<[Cartesian; 11]>> {
        self.services
            .astronomical_service
            .calculate_planetary_positions(julian_day)
            .await
    }
}

impl AstronomicalUseCaseImpl {
    fn datetime_to_julian_day(&self, datetime: time::OffsetDateTime) -> AppResult<JulianDay> {
        // Convert OffsetDateTime to Julian Day
        // This is a simplified conversion - in production use proper astronomical conversion
        // Convert i64 unix timestamp to f64 for Julian Day calculation
        // This is safe because unix timestamp fits within f64 precision for astronomical calculations
        let unix_timestamp = datetime.unix_timestamp() as f64; // @allow: safe time conversion
        let jd = 2440587.5 + unix_timestamp / 86400.0;

        JulianDay::new(jd).map_err(|e| crate::AppError::Domain(e))
    }
}

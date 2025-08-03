//! Domain events for the spiritual astronomy platform
//!
//! Event-driven architecture for decoupled communication between
//! domain aggregates and external systems integration.

use serde::{Deserialize, Serialize};
use time::OffsetDateTime;
use uuid::Uuid;
use crate::{TelegramUserId, JulianDay, CelestialBody};

/// Unique identifier for domain events
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct EventId(pub Uuid);

impl EventId {
    pub fn new() -> Self {
        Self(Uuid::new_v4())
    }
}

impl Default for EventId {
    fn default() -> Self {
        Self::new()
    }
}

/// Base trait for all domain events
pub trait DomainEvent {
    fn event_id(&self) -> EventId;
    fn occurred_at(&self) -> OffsetDateTime;
    fn event_type(&self) -> &'static str;
}

/// User authentication events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UserEvent {
    /// User initiated authentication through Telegram deep link
    AuthenticationStarted {
        event_id: EventId,
        occurred_at: OffsetDateTime,
        linking_token: crate::LinkingToken,
    },
    
    /// User completed Telegram verification
    TelegramVerificationCompleted {
        event_id: EventId,
        occurred_at: OffsetDateTime,
        telegram_user_id: TelegramUserId,
        linking_token: crate::LinkingToken,
    },
    
    /// User session established successfully
    SessionEstablished {
        event_id: EventId,
        occurred_at: OffsetDateTime,
        telegram_user_id: TelegramUserId,
    },
    
    /// User subscription status changed
    SubscriptionStatusChanged {
        event_id: EventId,
        occurred_at: OffsetDateTime,
        telegram_user_id: TelegramUserId,
        old_status: crate::SubscriptionStatus,
        new_status: crate::SubscriptionStatus,
    },
    
    /// User accessed premium feature
    PremiumFeatureAccessed {
        event_id: EventId,
        occurred_at: OffsetDateTime,
        telegram_user_id: TelegramUserId,
        feature_name: String,
    },
}

impl DomainEvent for UserEvent {
    fn event_id(&self) -> EventId {
        match self {
            Self::AuthenticationStarted { event_id, .. } => *event_id,
            Self::TelegramVerificationCompleted { event_id, .. } => *event_id,
            Self::SessionEstablished { event_id, .. } => *event_id,
            Self::SubscriptionStatusChanged { event_id, .. } => *event_id,
            Self::PremiumFeatureAccessed { event_id, .. } => *event_id,
        }
    }
    
    fn occurred_at(&self) -> OffsetDateTime {
        match self {
            Self::AuthenticationStarted { occurred_at, .. } => *occurred_at,
            Self::TelegramVerificationCompleted { occurred_at, .. } => *occurred_at,
            Self::SessionEstablished { occurred_at, .. } => *occurred_at,
            Self::SubscriptionStatusChanged { occurred_at, .. } => *occurred_at,
            Self::PremiumFeatureAccessed { occurred_at, .. } => *occurred_at,
        }
    }
    
    fn event_type(&self) -> &'static str {
        match self {
            Self::AuthenticationStarted { .. } => "UserAuthenticationStarted",
            Self::TelegramVerificationCompleted { .. } => "UserTelegramVerificationCompleted",
            Self::SessionEstablished { .. } => "UserSessionEstablished",
            Self::SubscriptionStatusChanged { .. } => "UserSubscriptionStatusChanged",
            Self::PremiumFeatureAccessed { .. } => "UserPremiumFeatureAccessed",
        }
    }
}

/// Astronomical calculation and visualization events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AstronomicalEvent {
    /// High-precision calculation completed
    CalculationCompleted {
        event_id: EventId,
        occurred_at: OffsetDateTime,
        julian_day: JulianDay,
        celestial_bodies: Vec<CelestialBody>,
        calculation_duration_micros: u64,
    },
    
    /// 3D scene updated with new positions
    SceneUpdated {
        event_id: EventId,
        occurred_at: OffsetDateTime,
        julian_day: JulianDay,
        frame_rate: f32,
    },
    
    /// Significant astronomical event detected
    SignificantEventDetected {
        event_id: EventId,
        occurred_at: OffsetDateTime,
        event_type: String,
        julian_day: JulianDay,
        celestial_bodies: Vec<CelestialBody>,
        description: String,
    },
}

impl DomainEvent for AstronomicalEvent {
    fn event_id(&self) -> EventId {
        match self {
            Self::CalculationCompleted { event_id, .. } => *event_id,
            Self::SceneUpdated { event_id, .. } => *event_id,
            Self::SignificantEventDetected { event_id, .. } => *event_id,
        }
    }
    
    fn occurred_at(&self) -> OffsetDateTime {
        match self {
            Self::CalculationCompleted { occurred_at, .. } => *occurred_at,
            Self::SceneUpdated { occurred_at, .. } => *occurred_at,
            Self::SignificantEventDetected { occurred_at, .. } => *occurred_at,
        }
    }
    
    fn event_type(&self) -> &'static str {
        match self {
            Self::CalculationCompleted { .. } => "AstronomicalCalculationCompleted",
            Self::SceneUpdated { .. } => "AstronomicalSceneUpdated",
            Self::SignificantEventDetected { .. } => "AstronomicalSignificantEventDetected",
        }
    }
}

/// Spiritual and community events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SpiritualEvent {
    /// Spiritual recommendation generated
    RecommendationGenerated {
        event_id: EventId,
        occurred_at: OffsetDateTime,
        telegram_user_id: TelegramUserId,
        julian_day: JulianDay,
        recommendation_type: String,
        content: String,
    },
    
    /// User engaged with spiritual content
    SpiritualContentEngaged {
        event_id: EventId,
        occurred_at: OffsetDateTime,
        telegram_user_id: TelegramUserId,
        content_type: String,
        engagement_type: String, // viewed, shared, saved, etc.
    },
    
    /// Community interaction occurred
    CommunityInteraction {
        event_id: EventId,
        occurred_at: OffsetDateTime,
        telegram_user_id: TelegramUserId,
        interaction_type: String,
        channel_id: Option<crate::TelegramChannelId>,
    },
}

impl DomainEvent for SpiritualEvent {
    fn event_id(&self) -> EventId {
        match self {
            Self::RecommendationGenerated { event_id, .. } => *event_id,
            Self::SpiritualContentEngaged { event_id, .. } => *event_id,
            Self::CommunityInteraction { event_id, .. } => *event_id,
        }
    }
    
    fn occurred_at(&self) -> OffsetDateTime {
        match self {
            Self::RecommendationGenerated { occurred_at, .. } => *occurred_at,
            Self::SpiritualContentEngaged { occurred_at, .. } => *occurred_at,
            Self::CommunityInteraction { occurred_at, .. } => *occurred_at,
        }
    }
    
    fn event_type(&self) -> &'static str {
        match self {
            Self::RecommendationGenerated { .. } => "SpiritualRecommendationGenerated",
            Self::SpiritualContentEngaged { .. } => "SpiritualContentEngaged",
            Self::CommunityInteraction { .. } => "SpiritualCommunityInteraction",
        }
    }
}

/// Unified event type for the entire domain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Event {
    User(UserEvent),
    Astronomical(AstronomicalEvent),
    Spiritual(SpiritualEvent),
}

impl DomainEvent for Event {
    fn event_id(&self) -> EventId {
        match self {
            Self::User(event) => event.event_id(),
            Self::Astronomical(event) => event.event_id(),
            Self::Spiritual(event) => event.event_id(),
        }
    }
    
    fn occurred_at(&self) -> OffsetDateTime {
        match self {
            Self::User(event) => event.occurred_at(),
            Self::Astronomical(event) => event.occurred_at(),
            Self::Spiritual(event) => event.occurred_at(),
        }
    }
    
    fn event_type(&self) -> &'static str {
        match self {
            Self::User(event) => event.event_type(),
            Self::Astronomical(event) => event.event_type(),
            Self::Spiritual(event) => event.event_type(),
        }
    }
}

/// Event publisher trait for dependency injection
pub trait EventPublisher {
    type Error;
    
    fn publish(&self, event: Event) -> Result<(), Self::Error>;
    fn publish_batch(&self, events: Vec<Event>) -> Result<(), Self::Error>;
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn event_id_generation() {
        let id1 = EventId::new();
        let id2 = EventId::new();
        assert_ne!(id1, id2);
    }
    
    #[test]
    fn user_event_trait_implementation() {
        let event = UserEvent::SessionEstablished {
            event_id: EventId::new(),
            occurred_at: OffsetDateTime::now_utc(),
            telegram_user_id: TelegramUserId::new(123456789).expect("test user ID should be valid"),
        };
        
        assert_eq!(event.event_type(), "UserSessionEstablished");
        assert!(event.occurred_at() <= OffsetDateTime::now_utc());
    }
    
    #[test]
    fn astronomical_event_serialization() {
        let event = AstronomicalEvent::CalculationCompleted {
            event_id: EventId::new(),
            occurred_at: OffsetDateTime::now_utc(),
            julian_day: JulianDay::new(2451545.0).expect("test J2000 JD should be valid"),
            celestial_bodies: vec![CelestialBody::Sun, CelestialBody::Moon],
            calculation_duration_micros: 1500,
        };
        
        let serialized = serde_json::to_string(&event).expect("test event should serialize");
        let deserialized: AstronomicalEvent = serde_json::from_str(&serialized).expect("test event should deserialize");
        
        assert_eq!(event.event_type(), deserialized.event_type());
    }
}
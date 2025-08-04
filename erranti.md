Run echo "🛡️ Quality Guardian: Comprehensive anti-pattern scanning..."
🛡️ Quality Guardian: Comprehensive anti-pattern scanning...
📊 Scanning 95 Rust files
🔍 Scanning for: HashMap::new()
✅ No violations found for: HashMap::new()
🔍 Scanning for: panic!(
✅ No violations found for: panic!(
🔍 Scanning for: .unwrap()
✅ No violations found for: .unwrap()
🔍 Scanning for: unreachable!()
✅ No violations found for: unreachable!()
🔍 Scanning for: unimplemented!()
✅ No violations found for: unimplemented!()
🔍 Scanning for: BTreeMap::new()
✅ No violations found for: BTreeMap::new()
🔍 Scanning for: .expect(
❌ CRITICAL: Found forbidden pattern: .expect(
📝 Suggestion: Use Result<T, E> with custom error types
📁 Files:
  - ./libs/domain/src/events.rs
  - ./libs/domain/src/telegram.rs
📍 Locations:
  ./libs/domain/src/events.rs:282:            telegram_user_id: TelegramId::new(123456789).expect("test user ID should be valid"),
  ./libs/domain/src/events.rs:294:            julian_day: JulianDay::new(2451545.0).expect("test J2000 JD should be valid"),
  ./libs/domain/src/events.rs:299:        let serialized = serde_json::to_string(&event).expect("test event should serialize");
  ./libs/domain/src/events.rs:300:        let deserialized: AstronomicalEvent = serde_json::from_str(&serialized).expect("test event should deserialize");
  ./libs/domain/src/telegram.rs:272:        let user_id = TelegramUserId::new(123456789).expect("test user ID should be valid");
  ./libs/domain/src/telegram.rs:273:        session.complete_verification(user_id).expect("test verification should succeed");
  ./libs/domain/src/telegram.rs:274:        session.establish_session().expect("test session establishment should succeed");
🔍 Scanning for: todo!()
✅ No violations found for: todo!()
🔍 Scanning for: HashSet::new()
✅ No violations found for: HashSet::new()
🔍 Scanning for: Vec::new()
✅ No violations found for: Vec::new()
🦀 Rust 1.88+ specific pattern validation...
⚠️ WARNING: Inefficient string operations detected
📝 Use format! macro or String::with_capacity() + push_str()
🚫 QUALITY ENFORCEMENT FAILED
Fix all critical violations above before proceeding.
Error: Process completed with exit code 1.

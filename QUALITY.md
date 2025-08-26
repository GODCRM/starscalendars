# 🛡️ Quality Guardian System
## Zero-Tolerance Quality Enforcement for StarsCalendars Spiritual Platform

[![Quality Guardian](https://img.shields.io/badge/Quality-Guardian%20Enforced-green)](https://github.com/starscalendars/starscalendars)
[![Rust 1.89+](https://img.shields.io/badge/Rust-1.89%2B-orange)](https://www.rust-lang.org/)
[![Zero Anti-patterns](https://img.shields.io/badge/Anti--patterns-Zero%20Tolerance-red)](./QUALITY.md)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20Compliance-blue)](./CLAUDE.md)

> **Mission**: Ensure every line of code in the StarsCalendars spiritual platform meets production-grade quality, security, and performance standards worthy of connecting seekers to cosmic wisdom.

## 🚨 Critical Rules - ZERO TOLERANCE

### **FORBIDDEN PATTERNS** - Automatic blocking at multiple levels:

#### **Rust Anti-patterns (Compilation Blocking)**
```rust
// ❌ FORBIDDEN - Will block commit/compilation
unwrap()          // Use Result<T, E> with proper error handling
expect("msg")     // Use Result<T, E> with custom error types  
panic!("msg")     // Use Result<T, E> - never panic in production
HashMap::new()    // Use HashMap::with_capacity(n) for O(1) performance
Vec::new()        // Use Vec::with_capacity(n) for pre-allocation
x as T           // Use TryFrom trait for safe type conversions
unsafe { }       // Forbidden except in very specific WASM contexts

// ✅ REQUIRED - Production-grade patterns
Result<T, CustomError>     // Comprehensive error handling
HashMap::with_capacity(n)  // Pre-allocated collections
Vec::with_capacity(n)      // Memory-efficient initialization  
TryFrom::try_from(x)      // Safe type conversions
```

#### **Performance Anti-patterns (Real-time Blocking)**
```rust
// ❌ FORBIDDEN - Violates O(1) hot path requirement
for planet in planets {
    wasm.compute_state(time); // Multiple WASM calls per frame
}

// Multiple .await in loops - blocking in real-time context
for user in users {
    api.fetch_data().await; // Blocks event loop
}

// ✅ REQUIRED - O(1) hot path patterns
let results = wasm.compute_state(time); // Exactly ONE call per frame
let futures: Vec<_> = users.iter().map(|u| api.fetch_data(u)).collect();
let results = join_all(futures).await; // Parallel processing
```

#### **Architecture Anti-patterns (Clean Architecture Violation)**
```rust
// ❌ FORBIDDEN - Dependency direction violations
// In libs/domain/src/
use crate::infrastructure::database; // Domain depends on infrastructure

// In libs/app/src/  
use postgres::Client; // Use-case directly uses external service

// ✅ REQUIRED - Clean Architecture compliance
// Domain layer - pure business logic
pub trait UserRepository {
    async fn find_by_telegram_id(&self, id: i64) -> Result<User, DomainError>;
}

// Infrastructure layer - implements ports
impl UserRepository for PostgresUserRepository {
    async fn find_by_telegram_id(&self, id: i64) -> Result<User, DomainError> {
        // Database implementation
    }
}
```

## 🎯 Performance Targets - Production Requirements

### **WASM Astronomical Calculations**
- **Target**: <1ms per `compute_state()` call
- **Requirement**: Exactly ONE `compute_state(time)` call per frame
- **Pattern**: Thread-local buffers with Float64Array view (zero-copy)
- **Enforcement**: Automatic blocking of multiple WASM calls

### **Backend API Response Times**
- **Target**: <100ms per API request
- **Database**: O(1) indexed queries only, no N+1 patterns
- **Authentication**: JWT verification <10ms
- **Rate Limiting**: <1ms per check with in-memory cache

### **Frontend Performance**
- **Target**: 60 FPS cinematic 3D rendering
- **Bundle Size**: <2MB initial load
- **Load Time**: <3s first contentful paint
- **Memory**: Zero allocations in Babylon.js render loop
- **Scene Rules**: 1× `compute_state(jd)` per frame (zenith included in state); no manual mipmap/anisotropy toggles; LH system with RH→LH Z flip applied in the scene (no flips in bridge)
- **Immutable Asset**: `astro-rust/` — READ-ONLY для разработчиков проекта. Исключён из автоматических линтеров/форматтеров/антипаттерн‑сканов. Любые правки в нём запрещены политикой репозитория и код‑ревью (без технического запрета на FS уровне).

### **Telegram Bot Performance**
- **Target**: <500ms response time for all commands
- **Subscription Verification**: <2s via getChatMember API
- **Webhook Processing**: <100ms per incoming message
- **Concurrent Users**: 10,000+ without degradation

## 🔧 Quality Enforcement Tools

### **1. Pre-commit Hooks** - `.githooks/pre-commit`
```bash
# Install git hooks
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit

# Automatic blocking of:
# - All forbidden patterns (unwrap, panic, etc.)
# - Performance violations (await in loops)
# - Architecture violations (wrong dependencies)
# - Security issues (SQL injection patterns)
```

### **2. GitHub Actions CI/CD** - `.github/workflows/quality-guardian.yml`
```yaml
# Runs on every PR/push:
# ✅ Anti-pattern detection with zero tolerance
# ✅ Clippy strict linting with custom rules  
# ✅ Architecture compliance validation
# ✅ Security scanning with cargo-deny
# ✅ Performance benchmark validation
# ✅ WASM-specific performance checks
```

### **3. VS Code Integration** - `.vscode/settings.json`
```json
{
  "rust-analyzer.check.command": "clippy",
  "rust-analyzer.check.extraArgs": [
    "-D", "clippy::unwrap_used",    // Block unwrap()
    "-D", "clippy::expect_used",    // Block expect()  
    "-D", "clippy::panic",          // Block panic!()
    "-D", "clippy::as_conversions"  // Block unsafe 'as'
  ],
  "todohighlight.keywords": [
    {"text": "unwrap()", "color": "#ff0000", "backgroundColor": "#ffcccc"}
  ]
}
```

### **4. Cargo Configuration** - `quality-rules.toml`
```toml
[lints.clippy]
unwrap_used = "deny"              # Compilation blocking
expect_used = "deny"              # Compilation blocking  
panic = "deny"                    # Compilation blocking
as_conversions = "deny"           # Compilation blocking
await_holding_lock = "deny"       # Async safety
inefficient_to_string = "deny"   # Performance
large_stack_arrays = "deny"       # Memory efficiency
```

### **5. Security Scanning** - `deny.toml`
```toml
[advisories]
vulnerability = "deny"            # Block known vulnerabilities
unmaintained = "warn"             # Warn about unmaintained crates

[bans]
deny = [
  { name = "openssl" },           # Use rustls instead
  { name = "lazy_static" },       # Use std::sync::OnceLock
]

[licenses]  
deny = ["GPL-2.0", "GPL-3.0"]    # Ensure license compatibility
```

## 📊 Quality Monitoring Commands

### **Daily Quality Checks**
```bash
# Full quality validation (run before every commit)
make quality-check

# Specific checks
make anti-patterns      # Scan for forbidden patterns
make clippy            # Strict Rust linting  
make security          # Security vulnerability scan
make arch             # Clean Architecture compliance
make wasm-perf        # WASM performance validation

# Quality reporting
make quality-report    # Generate quality metrics report
```

### **Continuous Integration**
```bash
# Pre-commit preparation
make pre-commit        # Format + quality checks + performance tests

# Security scanning
cargo deny check       # Dependency vulnerability scan
cargo audit           # Additional security audit

# Performance validation  
cargo bench           # Run performance benchmarks
make wasm-perf        # WASM-specific performance checks
```

## 🎭 Spiritual Platform Specific Standards

### **10-Language Internationalization Quality**
- **Requirement**: All text must be localizable via Fluent ICU MessageFormat
- **Pattern**: `t!("key", args)` for all user-facing strings
- **Validation**: No hardcoded English strings in components
- **Script Support**: Complex typography validation for 10 supported languages

### **Cultural Sensitivity Enforcement**
```rust
// ✅ REQUIRED - Culturally adaptive patterns
match user.culture_preference {
    Culture::Western => format_date_western(date),
    Culture::Chinese => format_date_lunar(date), 
    Culture::Hindu => format_date_vedic(date),
    // ... 8 more cultural adaptations
}
```

### **Astronomical Precision Standards**
- **Accuracy**: ±0.1 arcsecond for all celestial calculations
- **Ephemeris**: Local `astro-rust/` only (READ-ONLY); Swiss Ephemeris not used
- **Time Systems**: UTC, TAI, TT, UT1 support with proper conversions
- **Coordinate Systems**: J2000.0, Date, Apparent with precession/nutation

### **Telegram Authentication Security**
- **JWT**: RS256 signatures only, no HS256 allowed
- **Session**: Telegram user_id as primary authentication
- **Verification**: getChatMember API for subscription validation
- **Rate Limiting**: Anti-abuse protection on all bot endpoints

## 🚨 Quality Gate Enforcement

### **Commit Blocking (Pre-commit)**
```bash
# These patterns will BLOCK your commit:
❌ Found .unwrap() usage
❌ Found .expect() usage  
❌ Found panic!() usage
❌ Found HashMap::new() - use with_capacity()
❌ Found Vec::new() - use with_capacity()
❌ Multiple WASM calls detected - violates O(1) requirement
❌ .await in loop detected - blocking operation in real-time context
```

### **Compilation Blocking (Cargo)**
```rust
// These will prevent compilation:
error: usage of `unwrap` is not allowed
error: usage of `expect` is not allowed  
error: usage of `panic` is not allowed
error: usage of `as` conversion is not allowed
```

### **CI/CD Blocking (GitHub Actions)**
```yaml
# PR will be blocked if any of these fail:
✅ Anti-Pattern Detection: MUST pass
✅ Clippy Strict Linting: MUST pass
✅ Architecture Compliance: MUST pass  
✅ Security Scanning: MUST pass
✅ Performance Benchmarks: MUST meet targets
```

## 📈 Success Metrics

### **Code Quality KPIs**
- **Anti-patterns**: 0 violations (enforced at compilation)
- **Clippy Warnings**: 0 warnings with strict ruleset
- **Architecture**: 100% Clean Architecture compliance
- **Security**: 0 known vulnerabilities in dependencies
- **Documentation**: 95%+ documentation coverage for public APIs

### **Performance KPIs**  
- **WASM**: <1ms astronomical calculations
- **Backend**: <100ms API response times
- **Frontend**: 60 FPS sustained rendering
- **Database**: <10ms query response times
- **Bot**: <500ms command processing

### **Spiritual Platform KPIs**
- **Accuracy**: ±0.1 arcsecond astronomical precision
- **Availability**: 99.9% uptime for spiritual community
- **Scalability**: 10,000+ concurrent users supported
- **Localization**: 10 languages with cultural adaptation
- **Community**: Telegram-first authentication flow

## 🔄 Quality Workflow Integration

### **Development Workflow**
1. **Write Code** → Real-time VS Code highlighting of issues
2. **Save File** → Auto-formatting and immediate linting feedback
3. **Run Tests** → `make quality-check` validates all standards
4. **Commit** → Pre-commit hooks block forbidden patterns
5. **Push** → GitHub Actions comprehensive quality validation
6. **Merge** → Only after all quality gates pass

### **Release Workflow**
1. **Performance Benchmarks** → Validate all targets met
2. **Security Audit** → Complete dependency scanning
3. **Architecture Review** → Clean Architecture compliance
4. **Cultural Testing** → 10-language validation
5. **Production Deploy** → Only after quality certification

## 🎯 Quality Champion Guidelines

### **For Developers**
- **Write Quality First**: Think about error handling before implementation
- **Pre-allocate Collections**: Always use `with_capacity()` for performance
- **Test Early**: Run `make quality-check` frequently during development
- **Document Thoroughly**: Quality includes comprehensive documentation

### **For Code Reviewers**
- **Zero Tolerance**: No exceptions for anti-patterns, even in "quick fixes"
- **Performance Focus**: Every line should consider the 60 FPS requirement
- **Architecture Compliance**: Verify clean dependency directions
- **Cultural Sensitivity**: Ensure proper localization patterns

### **For DevOps**
- **Monitor Continuously**: Quality metrics in production dashboards
- **Alert on Regressions**: Immediate alerts for performance degradation
- **Security First**: Regular dependency updates and vulnerability scans
- **Spiritual Standards**: Uptime and accuracy metrics for community trust

---

> **Remember**: We are guardians of a platform that connects spiritual seekers to cosmic wisdom. Every line of code must reflect the excellence and precision worthy of this sacred mission. Quality is not optional - it is our spiritual practice in code.

## 🔗 Related Documentation

- [CLAUDE.md](./CLAUDE.md) - Complete development guidelines and architecture
- [tz.md](./tz.md) - Technical specification and requirements  
- [Makefile](./Makefile) - Quality enforcement commands
- [quality-rules.toml](./quality-rules.toml) - Clippy and Rust linting rules
- [deny.toml](./deny.toml) - Security and dependency scanning rules
- [.githooks/pre-commit](./.githooks/pre-commit) - Git commit validation
- [.github/workflows/quality-guardian.yml](./.github/workflows/quality-guardian.yml) - CI/CD quality pipeline

---

## ✅ PR Checklist (Quality Gate)
- [ ] No `unwrap()`, `expect()`, or `panic!()` in production code
- [ ] No `as` casts; use `TryFrom`/`TryInto`
- [ ] No `.await` inside loops on hot/request paths (batch + join)
- [ ] No string-built SQL (use `sqlx::query!`/`query_as!`)
- [ ] Functions returning `Result` do NOT contain unwrap/expect
- [ ] Errors are typed (`thiserror`); proper propagation with `?`
- [ ] Rate limits on public endpoints; no secrets in logs
- [ ] Cargo MAJOR pins only; `cargo build --locked` passes

## 📚 Documentation
- Anti-patterns guide: see `./anti.md`

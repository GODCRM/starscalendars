# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

You are an expert in Rust 1.88+ (26.06.2025 release), Axum (latest), Teloxide for Telegram Bot API, WASM, astronomical calculations using astro-rust 2.0.0, TypeScript 5.9.2, Babylon.js 8.20.0, Vite 7.0.6, React 19.1.1, and high-performance 3D web development with production-grade Telegram-only authentication.

## Communication Style
- DO NOT GIVE ME HIGH LEVEL STUFF, IF I ASK FOR FIX OR EXPLANATION, I WANT ACTUAL CODE OR EXPLANATION!!! I DON'T WANT "Here's how you 
can blablabla"
- Be casual unless otherwise specified
- Be terse
- Suggest solutions that I didn't think about—anticipate my needs
- Treat me as an expert
- Be accurate and thorough
- Give the answer immediately. Provide detailed explanations and restate my query in your own words if necessary after giving the answer
- Value facts from web search on new programming principles for second half of 2025 over good arguments over authorities, the source is 
irrelevant
- Use web_search for broad/general internet research, and curl for deep/detailed parsing of specific relevant pages (e.g., docs, RFCs, release notes) when needed
- Consider new technologies and contrarian ideas, not just the conventional wisdom
- You may use high levels of speculation or prediction, just flag it for me
- No moral lectures
- Discuss safety only when it's crucial and non-obvious
- If your content policy is an issue, provide the closest acceptable response and expl

## **CRITICAL RULE:**
**When writing code, be 100% sure you don't break anything existing.**

## Current Project Status

**Phase**: Planning/Specification
**Status**: No source code exists yet - project is specification-driven

### Existing Files
- `CLAUDE.md` - This guidance document
- `tz.md` - Comprehensive technical specification (416 lines)
- `prd.md` - Product requirements document (304 lines)  
- `Makefile` - Quality enforcement commands (93 lines)
- `quality-rules.toml` - Clippy and Rust linting rules (38 lines)
- `AGENTS_UPDATE_REPORT.md` - Agent configuration status

### To Be Created
The following directory structure will be implemented:
```
starscalendars/
├── frontend/          # TypeScript + Vite + Babylon.js
├── wasm-astro/        # Rust WASM: эфемеридное ядро  
├── backend/           # Axum HTTP/WS, PostgreSQL, Telegram, JWT
├── dioxus-app/        # Dioxus fullstack для auth/profile/admin
├── libs/
│   ├── domain/        # Чистые типы и бизнес-правила
│   ├── app/           # Use-cases, портовые интерфейсы
│   └── infra/         # Клиенты PostgreSQL/Telegram/Cache
└── ops/               # Миграции, Helm/compose, CI/CD
```

## Project Overview

StarsCalendars is a spiritual astronomy platform that combines high-precision astronomical calculations with esoteric knowledge. The project integrates 3D visualization using Babylon.js 8, WebAssembly astronomical computations, and spiritual/astrological features for a community of spiritual seekers. The platform uses TELEGRAM-ONLY authentication with 11-language localization system (Tier 1-5 priority: English, Chinese, Spanish, Hindi, Portuguese, German, French, Japanese, Russian, Georgian, Armenian) for global spiritual community access.

## Architecture (Clean Architecture per tz.md)

This project follows clean architecture with clear separation of layers:

```
starscalendars/
├── frontend/          # TypeScript + Vite + Babylon.js
├── wasm-astro/        # Rust WASM: эфемеридное ядро  
├── backend/           # Axum HTTP/WS, PostgreSQL, Telegram, JWT
├── dioxus-app/        # Dioxus fullstack для auth/profile/admin
├── libs/
│   ├── domain/        # Чистые типы и бизнес-правила
│   ├── app/           # Use-cases, портовые интерфейсы
│   └── infra/         # Клиенты PostgreSQL/Telegram/Cache
└── ops/               # Миграции, Helm/compose, CI/CD
```

## Key Technologies & Stack

- **Frontend Main Scene**: Babylon.js 8.20.0 with TypeScript 5.9.2/Vite 7.0.6/React 19.1.1
- **Astronomical Calculations**: Rust + WebAssembly using local astro-rust library (📚 READ-ONLY: astro-rust/ folder must NOT be modified!)
- **Backend**: Axum (Rust 1.88+) with PostgreSQL and WebSockets
- **Authentication System**: Telegram-only auth via Teloxide with subscription verification
- **Multilingual System**: 11-language support with Fluent (ICU MessageFormat)
- **GUI Strategy**: HTML/CSS overlay for performance, Babylon.js GUI only for 3D-integrated elements
- **WASM Interface**: Thread-local buffers with Float64Array view for zero-copy data transfer
- **Database**: PostgreSQL with Telegram user mapping and subscription status

## Development Approach

### Project Setup
- Use pnpm workspaces for monorepo management
- Each module (frontend, backend, wasm-astro, telegram-bot, i18n) is a separate workspace
- WASM modules compile to bundler target for Vite integration
- Telegram bot runs as independent service with webhook/polling support
- **🚨 CRITICAL**: astro-rust/ folder contains local copy of astronomical library - NEVER modify this folder!

### Key Design Decisions (per tz.md)
- **Clean Architecture**: Domain → UseCases → Adapters → Delivery layers
- **WASM Interface**: Exactly `compute_all(jd: f64) -> *const f64` with thread-local buffer
- **Sun Position**: Static at (0,0,0) for геоцентрическая сцена  
- **JWT**: RS256 with custom claims `is_telegram_subscribed: boolean`
- **Database**: PostgreSQL with specific schema: `users`, `refresh_tokens`, `telegram_linking`
- **Authentication**: Pure Telegram-only, no traditional passwords
- **GUI Strategy**: HTML/CSS overlay for performance, Babylon.js GUI only for 3D-integrated elements
- **Data Transfer**: Float64Array view в WebAssembly.Memory без копирования
- **Multilingual System**: Fluent (ICU MessageFormat) with 12-language support
- **Telegram Integration**: UUID tokens for account linking, getChatMember verification
- **WebSocket Protocol**: Compact JSON/CBOR with JWT as first message
- **Dioxus Server Functions**: Type-safe RPC between client and server

## Performance Requirements

- Target 60 FPS for cinematic quality 3D rendering
- Page load time < 3 seconds
- Support 10,000+ concurrent spiritual seekers with Telegram bot interactions
- High-precision astronomical calculations without performance bottlenecks
- Telegram bot response time < 500ms for all commands
- Subscription verification < 2s via getChatMember API
- 99.9% uptime for production spiritual community
- Language loading < 200ms, language switching < 100ms
- WASM-JS interop: zero-copy data transfer via Float64Array view

## Spiritual & Astronomical Features

- Quantum calendar calculations for spiritual cycles
- High-precision lunar and astrological computations
- Integration with Telegram channels for spiritual community subscriptions
- Personalized spiritual recommendations based on astronomical data
- Cinematic 3D visualization of celestial bodies with artistic proportions

## Security & Authentication

- **Telegram-Only Authentication**: Complete elimination of traditional login systems
- **Deep Linking Flow**: UUID tokens for seamless account linking from web to Telegram
- **Subscription Verification**: Real-time channel membership checks via getChatMember
- **Premium Feature Gating**: Automatic access control based on Telegram subscription status
- **Webhook Security**: Signature verification for all Telegram webhook requests
- **Rate Limiting**: Anti-abuse protection for bot interactions and API calls
- **Session Management**: Telegram user ID as primary authentication identifier
- **JWT Security**: RS256 with custom claims, short-lived access tokens
- **WebSocket Security**: JWT as first message, immediate connection closure on invalid auth

## Common Development Tasks

**Current Status: Planning Phase** - The project is currently in specification phase. The following commands are available now:

### Quality Assurance Commands (Available Now)
- `make quality-check` - Run all quality checks (anti-patterns, clippy, security, architecture)
- `make anti-patterns` - Scan for forbidden patterns (unwrap, expect, panic, etc.)
- `make clippy` - Run strict Clippy checks with denial rules
- `make security` - Security validation (JWT, SQL injection prevention)
- `make arch` - Architecture compliance validation (Clean Architecture)
- `make wasm-perf` - WASM performance pattern validation
- `make quality-report` - Generate comprehensive quality report
- `make pre-commit` - Full pre-commit validation
- `make fmt` - Format all code

### Future Build Commands (To Be Implemented)
Once source code is created, these commands will be available:
- `pnpm run build` - Build all workspaces
- `pnpm run build:frontend` - Vite build for frontend
- `pnpm run build:wasm` - wasm-pack build --release for wasm-astro
- `pnpm run build:dioxus` - dioxus build for auth app
- `cargo build --release` - Axum server production build
- `pnpm run build:i18n` - Generate Fluent bundles for all 11 languages
- `pnpm run build:wasm` - Build WASM astronomical core with wasm-pack

### Future Development Commands (To Be Implemented)
- `pnpm run dev` - Start all development servers
- `pnpm run dev:frontend` - Vite dev server
- `cargo run -p backend` - Axum server with hot reload
- `cargo run -p telegram-bot` - If separate telegram service
- `dioxus serve` - Dioxus development mode

### Testing
- Focus on astronomical calculation accuracy testing
- Performance profiling for 60 FPS target
- Comprehensive Telegram Bot API integration testing
- Subscription verification accuracy testing
- 12-language localization completeness validation
- Load testing for 10,000+ concurrent bot users
- WASM-JS interop performance testing
- GUI performance comparison (HTML overlay vs Babylon GUI)
- Cross-platform language rendering testing

## Important Notes

- This project serves a spiritual community focused on astronomical/astrological practices
- Emphasis on "cinematic quality" and "high precision" astronomical calculations
- Community integration through Telegram is a core feature
- The main astronomical scene is accessible to all users without authentication
- Premium features require active Telegram channel subscription
- All user interactions route through Telegram for community building
- 12-language support with cultural sensitivity for global spiritual community
- GUI performance: HTML/CSS overlay significantly faster than Babylon.js GUI
- WASM performance: exactly one `compute_all(t)` call per frame
- Multilingual system: Fluent with ICU MessageFormat for 11-language support

## Code Quality Requirements (tz.md Standards)

### **Clean Architecture Compliance:**
- **Domain**: No dependencies on infrastructure, pure business logic
- **UseCases**: Depend only on domain and abstract ports
- **Infrastructure**: Implement ports, depend on external services
- **Delivery**: HTTP/WS handlers, depend on use-cases through DI

### **Performance Requirements (O(1) горячий путь):**
- Горячий путь кадра: ровно один вызов WASM `compute_all(t)`
- Доступ к результатам через view на WebAssembly.Memory
- Ни одной аллокации в Babylon.js в кадре
- SQL: индексные планы, подготовленные запросы

### **WASM Requirements:**
- Thread-local буфер как в примере tz.md
- Нолевое копирование через Float64Array view
- Feature flags для browser/Node.js
- Exactly one `compute_all(t)` call per frame
- No string passing between WASM-JS

### **Database Requirements:**
- PostgreSQL schema exactly per tz.md
- SQLX compile-time проверки
- Индексы по username, telegram_user_id, exp
- UUID tokens for Telegram account linking
- Subscription status caching

## Anti-patterns FORBIDDEN (tz.md Strict)

### **Clean Architecture Violations:**
- Domain layer depending on infrastructure
- Use-cases directly calling external services
- Infrastructure in domain logic
- Circular dependencies between layers

### **Performance Critical (O(1) requirement):**
- Multiple WASM calls per frame (only ONE `compute_all(t)` allowed)
- Data copying between WASM-JS (use Float64Array view only)
- Babylon.js allocations in render loop
- SQL N+1 queries (use indexed queries only)
- Dynamic allocations in hot path

### **WASM Specific:**
- `panic!()` in WASM context (forbidden)
- String passing WASM↔JS (use numbers only)
- Multiple memory copies (zero-copy only)
- Missing thread-local buffers

### **Database:**
- Generic `AppError` (use specific error enums)
- Missing SQLX compile-time checks
- Blocking database calls in async
- Missing database indices

### **Telegram:**
- Missing webhook signature verification
- Hardcoded bot tokens
- Unhandled rate limits
- Missing getChatMember caching
- Missing UUID token generation for account linking
- Missing cultural adaptations for 12 languages

### **General Rust:**
- `unwrap()`, `expect()`, `panic!()`
- `as` conversions (use `TryFrom`)
- `Vec::new()` (use `Vec::with_capacity()`)
- `.await` in loops

## 🌟 ASTRO-RUST API USAGE RULES (MANDATORY)

### **КРИТИЧЕСКИЕ ПРАВИЛА ИСПОЛЬЗОВАНИЯ ASTRO-RUST:**

#### **1. ОБЯЗАТЕЛЬНОЕ ИСПОЛЬЗОВАНИЕ ЛОКАЛЬНОЙ КОПИИ:**
```toml
# ✅ ПРАВИЛЬНО - локальная копия с багфиксами (🚨 НЕ ИЗМЕНЯТЬ astro-rust/ папку!)
astro = { path = "./astro-rust" }

# ❌ ЗАПРЕЩЕНО - оригинал с багами
astro = "2.0.0"  # Broken decimal_day & lunar equations!
```
**🔒 ВАЖНО**: Папка `astro-rust/` содержит неприкосновенный код библиотеки:
- **✅ МОЖНО**: Читать, изучать, анализировать код для создания WASM оберток
- **✅ НУЖНО**: Полностью изучить API библиотеки перед написанием кода
- **❌ ЗАПРЕЩЕНО**: Изменять, модифицировать любые файлы в этой папке

#### **2. ОСНОВНЫЕ ФУНКЦИИ API:**
```rust
// ✅ Солнечная позиция (геоцентрическая эклиптическая)
let (sun_ecl, sun_dist_km) = astro::sun::geocent_ecl_pos(julian_day);
// sun_ecl.long, sun_ecl.lat в РАДИАНАХ!

// ✅ Лунная позиция ELP-2000/82 (геоцентрическая эклиптическая)  
let (moon_ecl, moon_dist_km) = astro::lunar::geocent_ecl_pos(julian_day);
// moon_ecl.long, moon_ecl.lat в РАДИАНАХ!

// ✅ Планетарные позиции VSOP87 (гелиоцентрические эклиптические)
let (long_rad, lat_rad, dist_au) = astro::planet::heliocent_coords(&astro::planet::Planet::Earth, julian_day);
```

#### **3. ПОДДЕРЖИВАЕМЫЕ ПЛАНЕТЫ:**
```rust
use astro::planet::Planet;
// ✅ Доступны: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune
// ✅ Pluto доступен через astro::pluto модуль (отдельно)
```

#### **4. КООРДИНАТНЫЕ СИСТЕМЫ:**
```rust
// ✅ EclPoint структура
struct EclPoint {
    pub long: f64,  // Эклиптическая долгота в РАДИАНАХ
    pub lat: f64,   // Эклиптическая широта в РАДИАНАХ  
}

// ✅ Конвертация в Cartesian для 3D сцены
fn ecl_to_cartesian(ecl_point: &EclPoint, radius_au: f64) -> Cartesian {
    let cos_lat = ecl_point.lat.cos();
    let x = radius_au * cos_lat * ecl_point.long.cos();
    let y = radius_au * cos_lat * ecl_point.long.sin();
    let z = radius_au * ecl_point.lat.sin();
    Cartesian::new(x, y, z)
}
```

#### **5. КОРРЕКЦИИ НУТАЦИИ И ПРЕЦЕССИИ:**
```rust
// ✅ Нутация (если нужна высокая точность)
let (nut_long, nut_oblq) = astro::nutation::nutation(julian_day);

// ✅ Прецессия между эпохами
let corrected_coords = astro::precess::precess_ecl_coords(ecl_coords, jd_old, jd_new);
```

#### **6. ЗАПРЕЩЕННЫЕ ПАТТЕРНЫ:**
```rust
// ❌ НИКОГДА не изобретать свои формулы если они есть в astro-rust!
// ❌ НИКОГДА не использовать градусы - все в радианах!
// ❌ НИКОГДА не игнорировать коррекции нутации/прецессии для точных расчетов!
```

## Key Development Patterns (tz.md Compliance)

### **Domain Layer Patterns:**
```rust
pub struct JulianDay(pub f64);
pub struct EclipticSpherical {
    pub lon_rad: f64,
    pub lat_rad: f64,
    pub r_au: f64,
}
pub struct Cartesian { pub x: f64, pub y: f64, pub z: f64 }
```

### **UseCase Patterns:**
```rust
#[async_trait::async_trait]
pub trait TelegramApi {
    async fn is_member_of_channel(&self, user_id: i64) -> anyhow::Result<bool>;
}
```

### **Performance Patterns (O(1) горячий путь):**
- Ровно один вызов WASM `compute_all(t)` на кадр
- Float64Array view без копирования
- Переиспользование Vector3/Quaternion в Babylon.js
- O(1) SQL операции с индексами
- Thread-local буферы в WASM
- HTML/CSS overlay for GUI performance
- Language switching < 100ms

### **Infrastructure Patterns:**
- Custom error enums with `thiserror`
- Async patterns with `tokio::spawn()`
- Zero-copy WASM-JS communication
- Production logging with `tracing`
- Fluent i18n with ICU MessageFormat
- Dioxus Server Functions for type-safe RPC
- WebSocket JWT authentication as first message

## Documentation Links

- **Babylon.js 8.20.0 - Main**: https://doc.babylonjs.com/
- **Babylon.js 8.20.0 - API**: https://doc.babylonjs.com/typedoc/
- **Babylon.js 8.20.0 - CDN**: https://cdn.babylonjs.com/babylon.js
- **Vite 7.0.6 - Main**: https://vite.dev/
- **React 19.1.1 - Main**: https://react.dev/
- **TypeScript 5.9.2 - Main**: https://www.typescriptlang.org/

- **Astro Rust - Main**: https://docs.rs/astro/latest/astro/
- **Astro Rust - ЛОКАЛЬНАЯ КОПИЯ**: `./astro-rust/` папка в корне проекта (🔒 НЕ ИЗМЕНЯТЬ!)
- **Astro Rust - GIT ORIGINAL**: https://github.com/saurvs/astro-rust (⚠️ DEPRECATED - has bugs)
- **Astro Rust - CORRECTED FORK**: https://github.com/arossbell/astro-rust (📚 Reference only - use local copy!)

- **Teloxide - Main**: https://docs.rs/teloxide/latest/teloxide/
- **Teloxide - GIT**: https://github.com/teloxide/teloxide
- **Teloxide - Examples**: https://github.com/teloxide/teloxide/tree/master/examples
- **Telegram Bot API**: https://core.telegram.org/bots/api
- **ICU MessageFormat**: https://unicode-org.github.io/icu/userguide/format_parse/messages/
- **Fluent L10n**: https://projectfluent.org/
- **Rust I18N**: https://docs.rs/rust-i18n/latest/rust_i18n/

- **Dioxus - Article**: https://habr.com/ru/articles/865980/
- **Dioxus - Main**: https://dioxuslabs.com/learn/0.6/
- **Dioxus - Main guide**: https://dioxuslabs.com/learn/0.6/guide
- **Dioxus - Main fullstack**: https://dioxuslabs.com/learn/0.6/guides/fullstack/
- **Dioxus - GIT**: https://github.com/DioxusLabs/dioxus/tree/v0.6
- **Dioxus - GIT Examples**: https://github.com/DioxusLabs/dioxus/tree/v0.6/examples
- **Dioxus - GIT Examples Projects**: https://github.com/DioxusLabs/dioxus/tree/v0.6/example-projects
- **Dioxus - Additional**: https://docs.rs/dioxus/latest/dioxus/

## Quality Enforcement System

### Automated Quality Gates
- **Makefile targets**: Available now - `make quality-check` validates all code patterns
- **Quality rules**: `quality-rules.toml` defines linting rules for Cargo.toml integration  
- **Future implementations**: `.githooks/pre-commit`, GitHub Actions, VS Code settings (to be created with source code)

### Command Usage
```bash
# Полная проверка качества
make quality-check

# Проверка антипаттернов
make anti-patterns

# Проверка производительности WASM
make wasm-perf

# Отчет о качестве
make quality-report

# Подготовка к коммиту
make pre-commit
```

### 📚 ОБЯЗАТЕЛЬНЫЙ ПРОЦЕСС РАБОТЫ С ASTRO-RUST
**СНАЧАЛА - ИЗУЧЕНИЕ КОДОВОЙ БАЗЫ:**
1. **Читай код в `./astro-rust/src/`** - изучи все модули: sun, lunar, planet, nutation, precess
2. **Найди все доступные функции** - не придумывай свои формулы!
3. **Понимай API параметры** - что принимает, что возвращает, в каких единицах
4. **ЗАТЕМ создавай WASM обертки** используя найденные функции

### КРИТИЧЕСКИ ЗАПРЕЩЕНО
**Enforced by quality-rules.toml and Makefile:**
- `unwrap()`, `expect()`, `panic!()` - блокируется на уровне компиляции (clippy deny)
- `HashMap::new()`, `Vec::new()` - только `with_capacity()` (detected by make anti-patterns)
- `as` conversions - только `TryFrom` (clippy as_conversions = deny)
- `unsafe_code` - полностью запрещен (rust lint deny)
- Multiple WASM calls per frame - только один `compute_all(t)` (make wasm-perf)
- `.await` в циклах - блокирующие операции в real-time контексте (clippy await_holding_lock = deny)
- `mem_forget` - denial rule (clippy mem_forget = deny)
- `todo!()`, `unimplemented!()` - блокируется компиляцией (clippy deny)
- **Изменение файлов в `./astro-rust/`** - строго read-only!

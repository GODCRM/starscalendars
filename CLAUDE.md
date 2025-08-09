# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

You are an expert in Rust 1.88+ (26.06.2025 release), Axum (latest), Teloxide for Telegram Bot API, WASM, astronomical calculations using astro-rust (local fork), TypeScript 5.9, Babylon.js 8, Vite 7, React 19, and high-performance 3D web development with production-grade Telegram-only authentication.

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

## **CRITICAL RULES:**
**1. When writing code, be 100% sure you don't break anything existing.**

**2. 🚨 MANDATORY RESEARCH REQUIREMENT:**
**🔥 НИКАКОЙ ЭКОНОМИИ ТОКЕНОВ! ТОЛЬКО ПОЛНОЦЕННЫЕ ИССЛЕДОВАНИЯ! 🔥**
**BEFORE writing ANY code, ALL agents MUST:**
- **WebFetch** official documentation for ALL libraries and frameworks
- **Study** breaking changes, new APIs, deprecated methods, migration guides
- **Research** 2025 professional production-ready best practices and patterns
- **Analyze** latest features, optimization techniques, and memory management
- **🚨 VERIFY EXACT LATEST VERSIONS:**
  - **Rust крейты**: **docs.rs** как основной источник (там есть документация + версии)  
  - **npm пакеты**: **https://www.npmjs.com/package/** как основной источник
  - **crates.io** - как дополнительный источник для Rust
- **🚨 ДОКУМЕНТАЦИЯ: "latest stable"** - в tz.md, CLAUDE.md указывать минимальные версии для справки
- **🚨 КОНФИГ ФАЙЛЫ БЕЗ PATCH/MINOR** - в Cargo.toml/package.json: `tokio = "1"`, `serde = "1"`, `axum = "0.8"` (БЕЗ .4!)
- **🚨 ДЛЯ 0.x ВЕРСИЙ**: `some-crate = "0.1"` (именно так, НЕ "0.1.x"!)
- **Document** ALL research findings before implementation
- **Never assume** - always verify current standards and professional practices
- **🔥 ЭКОНОМИЯ ТОКЕНОВ ПРИВОДИТ К МНОГОДНЕВНЫМ ПРОБЛЕМАМ! 🔥**

**⚠️ This comprehensive research is MANDATORY and comes FIRST for every agent.**

## 🚨 КРИТИЧЕСКИЕ ПРАВИЛА WASM ОБЕРТКИ ASTRO-RUST:

### **СТРОГИЕ ОГРАНИЧЕНИЯ (НАРУШЕНИЕ = ПРОВАЛ ЗАДАЧИ):**

**1. 🚫 АБСОЛЮТНО ЗАПРЕЩЕНО:**
- **Mock-данные любого рода** (даже в тестах используй реальные astro-rust функции)
- **Любая отсебятина** или кастомные астрономические расчеты
- **Hardcoded значения** планетарных позиций или констант
- **Математические формулы не из astro-rust библиотеки**
- **Изменение кода в папке `./astro-rust/`** - она read-only!
- **eval()** в любом контексте - критическая уязвимость

**2. ✅ ОБЯЗАТЕЛЬНО ИСПОЛЬЗОВАТЬ:**
- **ТОЛЬКО функции из astro-rust** для всех астрономических расчетов
- **Полное покрытие API** (ориентир в ~24 функций) — обертка предоставляет чистые экспонированные функции для всех разделов astro-rust. Горячий путь фронтенда использует только единый `compute_state(jd)`.
- **Zero-copy data transfer** через Float64Array и thread-local буферы
- **Максимальная точность** с коррекциями нутации и прецессии
- **Production-ready паттерны** Rust 1.88+ с WASM-bindgen

## Current Project Status

**Phase**: Active Development
**Status**: Substantial implementation across all layers - frontend, backend, WASM, and domain/app/infra libraries

### Implemented Components
- **Frontend**: React 19 + Babylon.js 8 + TypeScript 5.9 with Vite 7 (needs TypeScript config fixes)
- **Backend**: Axum server with clean architecture layers implemented (needs SQLX database setup)  
- **WASM Module**: ✅ ПОЛНОСТЬЮ РАБОТАЕТ — полный набор оберток соответствует astro-rust; горячий путь — единый `compute_state(jd)` (включая солнечный зенит для поворота Земли)
- **Domain/App/Infra Libraries**: Clean architecture implementation (some import issues)
- **Dioxus App**: Authentication and profile management (configured)
- **Quality System**: Comprehensive Makefile and quality rules (fully working)
- **Build System**: pnpm workspaces with Rust workspace integration (mostly working)

### Directory Structure (Implemented)
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
└── ops/               # Миграции, ручное развертывание, скрипты CI/CD
```

## Project Overview

StarsCalendars is a spiritual astronomy platform that combines high-precision astronomical calculations with esoteric knowledge. The project integrates 3D visualization using Babylon.js 8, WebAssembly astronomical computations, and spiritual/astrological features for a community of spiritual seekers. The platform uses TELEGRAM-ONLY authentication with 10-language localization system (Tier 1-5 priority: Russian, English, Chinese, Spanish, Hindi, Portuguese, German, French, Japanese, Armenian) for global spiritual community access.

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
└── ops/               # Миграции, ручное развертывание, скрипты CI/CD
```

## Key Technologies & Stack

- **Frontend Main Scene**: Babylon.js 8 (major; latest 8.x at build time) with TypeScript 5.9/Vite 7/React 19
- **Astronomical Calculations**: Rust + WebAssembly using local astro-rust library (📚 READ-ONLY: astro-rust/ folder must NOT be modified!)
- **🌟 WASM ОБЕРТКА**: Полное покрытие всех функций astro-rust с СТРОГИМ ЗАПРЕТОМ на mock-данные и отсебятину!
- **Backend**: Axum (Rust 1.88+) with PostgreSQL and WebSockets
- **Authentication System**: Telegram-only auth via Teloxide with subscription verification
- **Multilingual System**: 10-language support with Fluent (ICU MessageFormat)
- **GUI Strategy**: Babylon GUI for date/quantum date; a single `#stats` div overlay for FPS; no other HTML overlays
- **WASM Interface**: Thread-local buffers with Float64Array view for zero-copy data transfer
- **Database**: PostgreSQL with Telegram user mapping and subscription status

## Development Approach

### Environment Setup (Required Tools)

#### Prerequisites
```bash
# 1. Rust 1.88+ (managed automatically via rust-toolchain.toml)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# 2. Node.js 20+ and pnpm 9+
# Install Node.js via nvm or package manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh

# 3. wasm-pack for WebAssembly builds
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# 4. PostgreSQL 17+ (for development)
# macOS: brew install postgresql@17
# Ubuntu: sudo apt install postgresql-17
# AlmaLinux: sudo dnf install postgresql17-server

# 5. Redis (for caching)
# macOS: brew install redis
# Ubuntu: sudo apt install redis-server
# AlmaLinux: sudo dnf install redis
```

#### Environment Variables
```bash
# Create .env file in project root
DATABASE_URL="postgresql://username:password@localhost:5432/starscalendars"
REDIS_URL="redis://localhost:6379"
TELEGRAM_BOT_TOKEN="your_bot_token_here"
JWT_SECRET="your_jwt_secret_here"
```

#### First-Time Setup
```bash
# 1. Clone and enter project
git clone <repository-url>
cd starscalendars

# 2. Install all dependencies (workspace)
pnpm -w install

# 3. Build WASM astronomical core first
pnpm run build:wasm

# 4. Run quality checks (should pass)
make quality-check

# 5. Start development environment (frontend only)
pnpm -w run dev:frontend-only
```

### Project Setup
- Use pnpm workspaces for monorepo management
- Each module (frontend, backend, wasm-astro, telegram-bot, i18n) is a separate workspace
- WASM modules compile to bundler target for Vite integration
- Telegram bot runs as independent service with webhook/polling support
- **🚨 CRITICAL**: astro-rust/ folder contains local copy of astronomical library - NEVER modify this folder!

### Key Design Decisions (per tz.md)
- **Clean Architecture**: Domain → UseCases → Adapters → Delivery layers
- **WASM Interface**: Exactly `compute_state(jd: f64) -> *const f64` (11 f64: Sun xyz, Moon xyz, Earth xyz, Zenith [lon_east_rad, lat_rad]); thread-local buffers
- **Sun Position**: Static at (0,0,0) (heliocentric scene)  
- **JWT**: RS256 with custom claims `is_telegram_subscribed: boolean`
- **Database**: PostgreSQL with specific schema: `users`, `refresh_tokens`, `telegram_linking`
- **Authentication**: Pure Telegram-only, no traditional passwords
- **GUI Strategy**: HTML/CSS overlay for performance, Babylon.js GUI only for 3D-integrated elements
- **Data Transfer**: Float64Array view в WebAssembly.Memory без копирования
- **Multilingual System**: Fluent (ICU MessageFormat) with 10-language support
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

### Quality Assurance Commands (Fully Working)
- `make quality-check` - Run all quality checks (anti-patterns, clippy, security, architecture)
- `make anti-patterns` - Scan for forbidden patterns (unwrap, expect, panic, etc.)
- `make clippy` - Run strict Clippy checks with denial rules
- `make security` - Security validation (JWT, SQL injection prevention)
- `make arch` - Architecture compliance validation (Clean Architecture)
- `make wasm-perf` - WASM performance pattern validation
- `make quality-report` - Generate comprehensive quality report
- `make pre-commit` - Full pre-commit validation
- `make fmt` - Format all code

### Build Commands (Actual package.json scripts)
- `pnpm run build` - Build all workspaces (WASM → Frontend → Dioxus → Backend)
- `pnpm run build:frontend` - Vite build for frontend  
- `pnpm run build:wasm` - Execute ./scripts/build-wasm.sh (✅ working) → outputs to `frontend/src/wasm-astro/`
- `pnpm run build:wasm:debug` - WASM debug build for development (⚠️ inconsistent: outputs to `pkg/`)
- `pnpm run build:dioxus` - Dioxus build for auth app
- `pnpm run build:i18n` - Build internationalization files
- `cargo build --release` - Axum server production build (⚠️ needs DATABASE_URL for SQLX)
- `time cargo check --workspace --exclude starscalendars-infra` - Quick Rust compilation check (✅ working)

### Development Commands (Actual package.json scripts)
- `pnpm run dev:full` - **🚀 ПОЛНАЯ НАСТРОЙКА**: собирает WASM + запускает все серверы
- `pnpm run dev` - Start all development servers concurrently (без WASM сборки)
- `pnpm run dev:frontend` - Vite dev server with hot reload
- `pnpm run dev:backend` - Axum server with cargo run -p backend
- `pnpm run dev:dioxus` - Dioxus development mode
- `pnpm run dev:telegram` - Telegram bot development server
- `pnpm run type-check` - TypeScript checking across all workspaces
- `pnpm run lint` - Run linting across all workspaces
- `pnpm run format` - Format code across all workspaces
- `pnpm run test` - Run tests across all workspaces
- `pnpm run test:wasm` - Test WASM module loading (node scripts/test-wasm.js)

### Database Setup

#### PostgreSQL Schema Setup
```bash
# 1. Start PostgreSQL service
# macOS: brew services start postgresql@17
# Ubuntu: sudo systemctl start postgresql
# AlmaLinux: sudo systemctl start postgresql

# 2. Create database and user
createdb starscalendars
psql starscalendars

# 3. Run migrations
psql -d starscalendars -f ops/migrations/001_initial_schema.sql

# 4. For SQLX compile-time checks (choose one):
# Option A: Set DATABASE_URL
export DATABASE_URL="postgresql://username:password@localhost:5432/starscalendars"

# Option B: Use offline mode for development
cargo sqlx prepare --workspace
```

#### Redis Setup (for caching)
```bash
# Start Redis server
# macOS: brew services start redis
# Ubuntu/AlmaLinux: sudo systemctl start redis

# Test connection
redis-cli ping  # Should return "PONG"
```

### Current Issues & Solutions

#### 1. TypeScript Configuration
**Issue**: ES2025 target not supported  
**Solution**: Change `"target": "ES2025"` to `"target": "esnext"` in `frontend/tsconfig.json`

#### 2. SQLX Database Connection  
**Issue**: Missing DATABASE_URL for compile-time checks  
**Solution**: Use database setup above or `cargo sqlx prepare` for offline mode

#### 3. Library Import Issues
**Issue**: Some import errors in infra layer  
**Solution**: Check import paths in `libs/infra/src/*.rs` files - should reference relative paths

#### 4. Quality Check Test Code
**Status**: ✅ Resolved - `.expect()` usage in `#[cfg(test)]` modules is acceptable per CLAUDE.md rules

### Scripts and Tools Usage

#### Quality System Scripts
```bash
# Core quality checking (comprehensive)
./scripts/anti-patterns.sh           # Enhanced anti-pattern scanning with test exclusion
./scripts/production-patterns.sh     # Production-ready pattern validation  
./scripts/quality-monitor.sh         # Quality monitoring and reporting
./scripts/validate-quality-system.sh # Validate quality system integrity

# Quality shortcuts via Makefile
make quality-check                   # Run all quality checks
make anti-patterns                   # Scan for forbidden patterns only
make quality-report                  # Generate comprehensive quality report
make quality-summary                 # Quick quality status overview
```

#### Build and Development Scripts
```bash
# WASM build with verification
./scripts/build-wasm.sh              # Complete WASM build with size analysis
./scripts/test-wasm.js               # Test WASM module loading in Node.js

# Development workflow
pnpm run clean                       # Clean all build artifacts
pnpm run clean:wasm                  # Clean only WASM build files

# Frontend only (WASM build + Vite dev server)
pnpm -w run dev:frontend-only
```

### Quick Development Commands (What Works Now)
```bash
# Quality checks (always run first!)
make quality-check

# WASM compilation (works perfectly)
pnpm run build:wasm                  # Uses ./scripts/build-wasm.sh

# Rust workspace check (excludes problematic infra for now)
time cargo check --workspace --exclude starscalendars-infra

# Format code
make fmt

# Monitor code quality
make quality-summary

# Test WASM integration
pnpm run test:wasm                   # Uses node scripts/test-wasm.js
```

### Common Development Workflows

#### Starting a new feature
```bash
# 1. Ensure clean state
make quality-check
pnpm run test

# 2. Create feature branch
git checkout -b feature/astronomical-calculations

# 3. Make changes following architecture
# Domain → App → Infra → Delivery layers

# 4. Validate before commit
make pre-commit
pnpm run test

# 5. Commit with proper format
git commit -m "feat: implement high-precision ephemeris calculations

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

#### Debugging WASM issues
```bash
# 1. Check WASM build
pnpm run build:wasm:debug

# 2. Test loading
pnpm run test:wasm

# 3. Check for WASM-JS integration issues
# Look at frontend/src/wasm/init.ts
# Verify Float64Array usage patterns

# 4. Performance debugging
make wasm-perf
```

#### Quality check failures
```bash
# 1. Run specific quality checks
make anti-patterns          # Check for forbidden patterns
make clippy                 # Strict Rust linting
make security              # Security validation

# 2. View detailed violations
make find-patterns         # Show detailed anti-pattern locations

# 3. Fix test vs production code issues
# Ensure .expect() only in #[cfg(test)] modules
./scripts/anti-patterns.sh # Shows test code exclusions
```

## Deployment Strategy (NO DOCKER!)

### **🚨 CRITICAL DEPLOYMENT POLICY:**
**МЫ НЕ ИСПОЛЬЗУЕМ DOCKER И РУКАМИ РАЗВОРАЧИВАЕМ НА СЕРВЕР AlmaLinux 9.4**

### Production Architecture (nginx + Axum)
```
/opt/starscalendars/backend          ← Axum сервер (localhost:8080)
/var/www/starscalendars/             ← Статические файлы (nginx)
├── index.html                       ← React 3D сцена
├── assets/main-abc.js               ← Скомпилированный фронтенд
├── textures/                        ← Текстуры для Babylon.js
│   ├── earth.jpg, moon.jpg, sun.jpg
│   ├── stars/milky-way.jpg
│   └── planets/*.jpg
├── models/                          ← 3D модели (.babylon, .glb)
├── wasm-astro/                      ← WASM астрономические расчеты
│   ├── starscalendars_wasm_astro.js
│   └── starscalendars_wasm_astro_bg.wasm
└── cabinet/                         ← Dioxus полноценное приложение  
    ├── index.html                   ← Личный кабинет пользователя
    ├── auth/                        ← Авторизация через Telegram
    ├── profile/                     ← Профиль и настройки
    ├── learning/                    ← Обучающие материалы и курсы
    ├── subscription/                ← Управление подпиской
    ├── admin/                       ← Админка (для админов)
    └── assets/
```

### Production Deployment Flow
1. **Frontend**: Компилируется заранее в `frontend/dist/` с помощью `pnpm run build`
2. **Dioxus**: Компилируется заранее в `dioxus-app/dist/` с помощью `pnpm run build:dioxus`
3. **WASM**: Компилируется заранее с `pnpm run build:wasm` → `frontend/src/wasm-astro/`
4. **Backend**: Компилируется ТОЛЬКО на продакшн сервере AlmaLinux 9.4 с `cargo build --release`
5. **nginx**: Отдаёт статику напрямую, проксирует API/WebSocket на Axum

### AlmaLinux 9.4 Server Setup (с HTTPS)
```bash
# Установка системных зависимостей  
sudo dnf install -y gcc openssl-devel postgresql-devel nginx rust cargo certbot python3-certbot-nginx

# Создание директорий
sudo mkdir -p /opt/starscalendars
sudo mkdir -p /var/www/starscalendars

# Компиляция сервера на продакшн машине
cargo build --release --target-cpu=native
sudo cp target/release/backend /opt/starscalendars/

# Копирование статических файлов
rsync -av frontend/dist/ /var/www/starscalendars/
rsync -av dioxus-app/dist/ /var/www/starscalendars/cabinet/

# Настройка nginx с базовой конфигурацией
sudo cp nginx.conf /etc/nginx/sites-available/starscalendars
sudo ln -s /etc/nginx/sites-available/starscalendars /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Получение SSL сертификатов Let's Encrypt
sudo certbot --nginx -d starscalendars.com -d www.starscalendars.com

# Настройка автообновления сертификатов
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -

# Запуск сервисов
sudo systemctl enable --now starscalendars
sudo systemctl enable --now nginx

# Проверка HTTPS
curl -I https://starscalendars.com
```

### Deployment Agents
- **project-coordinator**: Отвечает за координацию сборки всех компонентов
- **quality-guardian**: Отвечает за тестирование и качество перед развертыванием

### Testing Strategy & Commands

#### Unit Testing
```bash
# Run all tests across workspaces
pnpm run test

# Rust tests only
cargo test --workspace

# Rust tests with release optimizations
cargo test --workspace --release

# Individual workspace tests
cargo test -p backend
cargo test -p wasm-astro
cargo test -p starscalendars-domain
cargo test -p starscalendars-app
cargo test -p starscalendars-infra
```

#### WASM Testing
```bash
# Test WASM module compilation and loading
pnpm run test:wasm

# Manual WASM build testing
cd wasm-astro && wasm-pack build --dev --target web
node ../scripts/test-wasm.js
```

#### Performance Testing
```bash
# Rust benchmarks
cargo bench

# Quality-assured benchmarks (with quality checks first)
make perf

# Performance profiling
cargo test --release -- --ignored bench_
```

#### Testing Focus Areas
- **Astronomical Calculations**: High-precision ephemeris accuracy testing
- **Performance**: 60 FPS target validation and WASM-JS interop timing
- **Telegram Integration**: Bot API responses, subscription verification, webhook processing
- **Authentication**: JWT validation, token refresh, session management
- **Localization**: 10-language completeness and cultural adaptation validation
- **Load Testing**: 10,000+ concurrent bot users simulation
- **WASM Performance**: Zero-copy data transfer validation
- **GUI Performance**: HTML overlay vs Babylon.js GUI comparison
- **Cross-platform**: Language rendering and browser compatibility

## Important Notes

- This project serves a spiritual community focused on astronomical/astrological practices
- Emphasis on "cinematic quality" and "high precision" astronomical calculations
- Community integration through Telegram is a core feature
- The main astronomical scene is accessible to all users without authentication
- Premium features require active Telegram channel subscription
- All user interactions route through Telegram for community building
- 10-language support with cultural sensitivity for global spiritual community
- GUI performance: HTML/CSS overlay significantly faster than Babylon.js GUI
- WASM performance: exactly one `compute_state(t)` call per frame
- Multilingual system: Fluent with ICU MessageFormat for 10-language support

## Code Quality Requirements (tz.md Standards)

### **Clean Architecture Compliance:**
- **Domain**: No dependencies on infrastructure, pure business logic
- **UseCases**: Depend only on domain and abstract ports
- **Infrastructure**: Implement ports, depend on external services
- **Delivery**: HTTP/WS handlers, depend on use-cases through DI

### **Performance Requirements (O(1) горячий путь):**
- Горячий путь кадра: ровно один вызов WASM `compute_state(t)`
- Доступ к результатам через view на WebAssembly.Memory
- Ни одной аллокации в Babylon.js в кадре
- SQL: индексные планы, подготовленные запросы

### **WASM Requirements:**
- Thread-local буфер как в примере tz.md
- Нолевое копирование через Float64Array view
- Feature flags для browser/Node.js
- Exactly one `compute_state(t)` call per frame
- No string passing between WASM-JS

### **Database Requirements:**
- PostgreSQL schema exactly per tz.md
- SQLX compile-time проверки
- Индексы по username, telegram_user_id, exp
- UUID tokens for Telegram account linking
- Subscription status caching

## Anti-patterns FORBIDDEN (tz.md Strict) + WASM CRITICAL

### **🚨 КРИТИЧЕСКИЕ WASM АНТИПАТТЕРНЫ (ПРИВОДЯТ К ПРОВАЛУ ПРОЕКТА):**

**СТРОГО ЗАПРЕЩЕННЫЕ ПАТТЕРНЫ В WASM ОБЕРТКЕ:**
- **Mock-данные любого вида** - даже временные или для тестов
- **Кастомные астрономические формулы** не из astro-rust библиотеки
- **Hardcoded константы** планетарных позиций или орбитальных элементов
- **Прямые математические расчеты** вместо вызовов astro-rust функций
- **eval()** - критическая уязвимость безопасности
- **Изменение кода в ./astro-rust/** - папка read-only
- **Частичное покрытие API** - должны быть ВСЕ функции библиотеки
- **Отсебятина в расчетах** - только чистые astro-rust вызовы

**ПРИМЕР ПРАВИЛЬНОЙ РЕАЛИЗАЦИИ НОВОЙ ФУНКЦИИ:**
```rust
// ✅ ПРАВИЛЬНО - только astro-rust функции
// Zenith is included in compute_state buffer; a separate export is no longer required
// (legacy example below is intentionally removed)
    // Используем ТОЛЬКО astro::sun::geocent_ecl_pos()
    let (sun_ecl, _) = astro::sun::geocent_ecl_pos(julian_day);
    // Применяем ТОЛЬКО astro::nutation::nutation()
    let (nut_long, nut_oblq) = astro::nutation::nutation(julian_day);
    // И так далее - ТОЛЬКО библиотечные функции
}

// ❌ ЗАПРЕЩЕНО - любая отсебятина
#[wasm_bindgen] 
pub fn bad_solar_position(julian_day: f64) -> *const f64 {
    let fake_x = 1.0; // ❌ Mock данные!
    let custom_calc = julian_day * 0.123; // ❌ Кастомная формула!
}
```

### **Clean Architecture Violations:**
- Domain layer depending on infrastructure
- Use-cases directly calling external services
- Infrastructure in domain logic
- Circular dependencies between layers

### **Performance Critical (O(1) requirement):**
- Multiple WASM calls per frame (only ONE `compute_state(t)` allowed)
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
- Missing cultural adaptations for 10 languages

### **General Rust:**
- `unwrap()`, `expect()`, `panic!()`
- `as` conversions (use `TryFrom`)
- `Vec::new()` (use `Vec::with_capacity()`)
- `.await` in loops
- `eval()` - **КРИТИЧЕСКАЯ УЯЗВИМОСТЬ** безопасности

### **🚨 WASM Specific Anti-patterns:**
- Mock-данные в любой форме (даже в тестах используй реальные astro-rust функции)
- Кастомные астрономические расчеты (только astro-rust API)
- Hardcoded координаты или орбитальные элементы
- Частичное покрытие astro-rust API (должны быть ВСЕ функции)
- Изменения в папке ./astro-rust/ (строго read-only)
- Любая отсебятина вместо библиотечных вызовов

## 🌟 ASTRO-RUST API USAGE RULES (MANDATORY)

### **КРИТИЧЕСКИЕ ПРАВИЛА ИСПОЛЬЗОВАНИЯ ASTRO-RUST:**

#### **1. 🚨 ПОЛНОЕ ПОКРЫТИЕ ВСЕХ ФУНКЦИЙ ASTRO-RUST В WASM ОБЕРТКЕ:**
```toml
# ✅ ПРАВИЛЬНО - локальная копия с багфиксами (🚨 НЕ ИЗМЕНЯТЬ astro-rust/ папку!)
astro = { path = "./astro-rust" }

# ❌ ЗАПРЕЩЕНО - оригинал с багами
astro = "2.0.0"  # Broken decimal_day & lunar equations!
```

**🔒 КРИТИЧЕСКИ ВАЖНО ДЛЯ ВСЕХ РАЗРАБОТЧИКОВ:**
- **✅ МОЖНО**: Читать, изучать, анализировать код для создания WASM оберток
- **✅ НУЖНО**: Полностью изучить API библиотеки перед написанием кода
- **❌ ЗАПРЕЩЕНО**: Изменять, модифицировать любые файлы в папке `./astro-rust/`
- **🚨 ОБЯЗАТЕЛЬНО**: Добавляя новую функцию, используй ТОЛЬКО astro-rust API
- **⚡ СОСТОЯНИЕ**: обертка полностью покрывает astro-rust (ориентир в ~24 функций), включая солнечный зенит; горячий путь — `compute_state(jd)`
- **🛡️ ГАРАНТИЯ**: Никакие mock-данные или отсебятина не допускаются

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
- Ровно один вызов WASM `compute_state(t)` на кадр
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

- **Babylon.js 8 - Main**: https://doc.babylonjs.com/
- **Babylon.js 8 - API**: https://doc.babylonjs.com/typedoc/
- **Babylon.js 8 - NPM**: https://www.npmjs.com/package/babylonjs
- **Babylon.js 8 - GIT**: https://github.com/BabylonJS/Babylon.js
- **Babylon.js 8 - WebXR**: https://learn.microsoft.com/ru-ru/windows/mixed-reality/develop/javascript/tutorials/babylonjs-webxr-helloworld
- **Babylon.js 8 - WebXR Pianino**: https://learn.microsoft.com/ru-ru/windows/mixed-reality/develop/javascript/tutorials/babylonjs-webxr-piano
- **Babylon.js 8 - WebXR**: https://learn.microsoft.com/ru-ru/windows/mixed-reality/develop/javascript/tutorials/babylonjs-webxr-helloworld/
- **Babylon.js 8 - WebXR Pianino**: https://learn.microsoft.com/ru-ru/windows/mixed-reality/develop/javascript/tutorials/babylonjs-webxr-piano/
- **Babylon.js 8 - Хук для обновления текста элемента интерфейса например для ФПС**
```
engine.runRenderLoop(function () {
        scene.render();
        stats.innerHTML = "FPS: <b>" +  BABYLON.Tools.GetFps().toFixed() + "</b>
});
```
- **Babylon.js 8 - старые но ценные сравнения**: https://habr.com/ru/articles/246259/
- **Babylon.js 8 - старый но ценный туториал создания космической кинематографичной сцены по которой делался референс ч.1**: https://forasoft.github.io/webgl-babylonjs-p1/
- **Babylon.js 8 - старый но ценный туториал создания космической кинематографичной сцены по которой делался референс ч.2**: https://forasoft.github.io/webgl-babylonjs-p2/
- **Babylon.js 8 - система координат**: ось X направлена вправо, ось Y направлена вверх, ось Z направлен вперед в глубь экрана а не на меня

- **Vite 7 - Main**: https://vite.dev/
- **React 19 - Main**: https://react.dev/
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

- **Dioxus - Main**: https://dioxuslabs.com/learn/0.7/
- **Dioxus - Main guide**: https://dioxuslabs.com/learn/0.7/guide
- **Dioxus - Main fullstack**: https://dioxuslabs.com/learn/0.7/guides/fullstack/
- **Dioxus - GIT**: https://github.com/DioxusLabs/dioxus
- **Dioxus - GIT Examples**: https://github.com/DioxusLabs/dioxus/tree/main/examples
- **Dioxus - GIT Examples Projects**: https://github.com/DioxusLabs/dioxus/tree/main/example-projects
- **Dioxus - Additional**: https://docs.rs/dioxus/0.7.0-alpha.3/dioxus/index.html

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
- Multiple WASM calls per frame - только один `compute_state(t)` (make wasm-perf)
- `.await` в циклах - блокирующие операции в real-time контексте (clippy await_holding_lock = deny)
- `mem_forget` - denial rule (clippy mem_forget = deny)
- `todo!()`, `unimplemented!()` - блокируется компиляцией (clippy deny)
- **Изменение файлов в `./astro-rust/`** - строго read-only!
- **JavaScript-style comments in JSON** - use pure JSON syntax only

## Troubleshooting Guide

### Common Build Issues

#### 1. JSON Parsing Errors in package.json
**Error**: `Expected double-quoted property name in JSON`
**Solution**: Remove JavaScript-style comments (`//`) from package.json files - use pure JSON syntax only

#### 2. Quality Check Failures
**Error**: `❌ Found .expect() usage`
**Cause**: `.expect()` usage in test files vs production code
**Solution**: 
- **Production code**: Always use proper error handling (`Result<T, E>`, `?` operator)
- **Test code**: `.expect()` is acceptable for test assertions and setup
- **Pattern**: Test files should use `.expect("descriptive test failure message")`

#### 3. TypeScript ES2025 Target Issue
**Error**: TypeScript compilation failures
**Solution**: Change `"target": "ES2025"` to `"target": "esnext"` in `frontend/tsconfig.json`

#### 4. WASM Build Failures
**Error**: wasm-pack build failures
**Solution**: 
```bash
# Ensure wasm-pack is installed
cargo install wasm-pack

# Build with correct target
cd wasm-astro && wasm-pack build --release --target web
```

#### 5. Database Connection Issues
**Error**: SQLX compile-time check failures
**Solution**: Set DATABASE_URL or use offline mode:
```bash
export DATABASE_URL="postgresql://user:pass@localhost/starscalendars"
# OR for offline development:
cargo sqlx prepare
```

#### 6. 🚨 CRITICAL: WASM Module Loading Path Mismatch
**Error**: `WASM module loading failed: Cannot resolve module '../../../wasm-astro/pkg/starscalendars_wasm_astro.js'`
**Cause**: Path mismatch between build script output and TypeScript import
**Problem**: 
- Build script (`scripts/build-wasm.sh`) outputs to: `frontend/src/wasm-astro/`
- But `frontend/src/wasm/init.ts` tries to load from: `../../../wasm-astro/pkg/`
**Solution**: Fix the import path in `frontend/src/wasm/init.ts`:
```typescript
// ❌ WRONG - current path (line 103)
const wasmModule = await import('../../../wasm-astro/pkg/starscalendars_wasm_astro.js');

// ✅ CORRECT - should be
const wasmModule = await import('../wasm-astro/starscalendars_wasm_astro.js');
```
**Additional Notes**:
- This is a fundamental integration issue that prevents WASM from loading
- `package.json` also has inconsistent paths (`build:wasm:debug` uses different output)
- Production deployment needs to copy from correct source path: `frontend/src/wasm-astro/`

## Essential Development Commands

### Single Test Execution
```bash
# Run specific test file
cargo test -p backend test_auth
cargo test -p wasm-astro test_calculations

# Run test with output for debugging
cargo test test_function_name -- --nocapture

# Run specific frontend test
cd frontend && pnpm test -- --testNamePattern="UIOverlay"

# Run WASM integration test
pnpm run test:wasm
```

### Development Architecture Understanding

#### Clean Architecture Layer Dependencies
- **Domain** (`libs/domain/`) → No dependencies, pure business logic
- **App** (`libs/app/`) → Depends only on domain, defines port interfaces
- **Infra** (`libs/infra/`) → Implements ports, depends on external services
- **Delivery** (`backend/`, `frontend/`) → Depends on app layer through dependency injection

### Test Code Patterns (Exception to Anti-Pattern Rules)

```rust
// ✅ ACCEPTABLE in test files only
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_user_creation() {
        let user_id = TelegramUserId::new(123456789)
            .expect("test user ID should be valid");
        // Test assertions can use .expect() with descriptive messages
    }
}

// ❌ FORBIDDEN in production code
fn create_user(id: i64) -> User {
    let user_id = TelegramUserId::new(id).expect("user ID failed"); // NEVER!
}

// ✅ CORRECT in production code  
fn create_user(id: i64) -> Result<User, UserError> {
    let user_id = TelegramUserId::new(id)?;
    Ok(User::new(user_id))
}
```

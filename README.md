# 🌟 StarsCalendars

> Spiritual astronomy platform combining high-precision astronomical calculations with 3D visualization, WebAssembly performance, and Telegram community integration.

## 🎯 Project Overview

StarsCalendars is a high-performance spiritual astronomy platform that provides:

- **🌌 Real-time 3D Visualization**: Cinematic quality astronomical scenes using Babylon.js 8
- **⚡ WebAssembly Calculations**: High-precision ephemeris calculations compiled to WASM
- **📱 Telegram Integration**: Community-driven authentication and premium features
- **🌍 Global Localization**: 12-language support with cultural adaptations
- **🏧 Clean Architecture**: Domain-driven design with clear separation of concerns

## 🛠️ Technology Stack

### Backend
- **Rust 1.88+** with Cargo edition 2024
- **Axum** web framework with WebSocket support
- **PostgreSQL** with SQLX for compile-time query validation
- **Teloxide** for Telegram Bot API integration
- **JWT RS256** authentication with custom claims

### Frontend
- **TypeScript 5.8+** with strict type checking
- **Babylon.js 8** for 3D astronomical visualization
- **Vite** build system with WASM integration
- **React 18** with concurrent features
- **Fluent** for internationalization (ICU MessageFormat)

### WASM Core
- **Rust** compiled to WebAssembly
- **Zero-copy** data transfer via Float64Array
- **O(1) горячий путь** for real-time calculations
- **Thread-local buffers** for performance optimization

### Authentication & UI
- **Dioxus** fullstack framework for auth/profile/admin
- **Pure Telegram** authentication (no passwords)
- **Subscription verification** via getChatMember API

## 📁 Project Structure

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

## 🚀 Quick Start

### Prerequisites

- **Rust 1.88+** (automatically managed via `rust-toolchain.toml`)
- **Node.js 20+** and **pnpm 9+**
- **PostgreSQL 15+**
- **Redis** (for caching)
- **wasm-pack** for WebAssembly builds

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd starscalendars

# Install dependencies
pnpm install

# Build WASM astronomical core
pnpm run build:wasm

# Run quality checks
make quality-check

# Start development environment
pnpm run dev
```

### Build Commands

```bash
# Build all workspaces
pnpm run build

# Build specific components
pnpm run build:frontend    # Vite build for frontend
pnpm run build:wasm        # wasm-pack build for astronomical core
pnpm run build:dioxus      # Dioxus build for auth app
cargo build --release      # Axum server production build

# Development servers
pnpm run dev               # Start all development servers
pnpm run dev:frontend      # Vite dev server only
cargo run -p starscalendars-backend  # Axum server with hot reload
```

## 🔒 Quality Assurance

This project enforces **zero-tolerance** for anti-patterns and maintains strict quality standards:

### Quality Checks

```bash
# Run all quality checks
make quality-check

# Individual checks
make anti-patterns         # Scan for forbidden patterns
make clippy               # Strict Clippy lints
make security             # Security validation
make arch                 # Architecture compliance
make wasm-perf            # WASM performance validation

# Pre-commit validation
make pre-commit
```

### Forbidden Anti-Patterns

- ❌ **`unwrap()`**, **`expect()`**, **`panic!()`** - Use `Result<T, E>` everywhere
- ❌ **`HashMap::new()`**, **`Vec::new()`** - Use `with_capacity()` for performance
- ❌ **`as` conversions** - Use `TryFrom` for safe type conversion
- ❌ **Multiple WASM calls per frame** - Only one `compute_all(t)` allowed
- ❌ **`.await` in loops** - Violates real-time performance requirements

### Performance Requirements

- **O(1) горячий путь**: Exactly one WASM call per frame
- **60 FPS**: Cinematic quality 3D rendering
- **<3s**: Page load time target
- **10,000+**: Concurrent Telegram bot users
- **<500ms**: Telegram bot response time

## 🌐 Architecture Principles

### Clean Architecture Compliance

1. **Domain Layer**: Pure business logic, no infrastructure dependencies
2. **Application Layer**: Use cases and port interfaces
3. **Infrastructure Layer**: External service implementations
4. **Delivery Layer**: HTTP/WS handlers, UI components

### Performance Optimization

- **Pre-allocated Collections**: All `HashMap` and `Vec` use `with_capacity()`
- **Zero-Copy WASM**: Float64Array view for astronomical data
- **Thread-Local Buffers**: Eliminate allocations in hot paths
- **Compile-Time Validation**: SQLX macros for database queries

### Security Standards

- **Telegram-Only Auth**: No traditional passwords
- **JWT RS256**: Cryptographically secure tokens
- **Subscription Verification**: Real-time channel membership checks
- **Rate Limiting**: Anti-abuse protection

## 🌍 Internationalization

**12 Language Support** with cultural adaptations:

**Tier 1-2**: English, Chinese, Spanish, Hindi, Arabic  
**Tier 3-4**: Portuguese, German, French, Japanese, Russian  
**Tier 5**: Georgian, Armenian

- **Fluent L10n**: ICU MessageFormat standard
- **RTL Support**: Arabic language optimization
- **Cultural Sensitivity**: Spiritual community considerations

## 📋 Development Status

✅ **Phase 0.1 - Infrastructure Setup** (Current)
- [x] Monorepo structure with pnpm workspaces
- [x] Cargo workspace with Clean Architecture layers
- [x] Quality enforcement system
- [x] Basic build system configuration
- [ ] Database schema and migrations
- [ ] CI/CD pipeline setup

🔄 **Phase 0.2 - Core Implementation** (Next)
- [ ] WASM astronomical calculations
- [ ] Babylon.js 3D scene setup
- [ ] Telegram Bot API integration
- [ ] JWT authentication flow
- [ ] Basic UI components

## 🤝 Contributing

### Code Quality Standards

1. **Run quality checks**: `make quality-check` before any commit
2. **Follow Clean Architecture**: Respect layer boundaries
3. **Zero anti-patterns**: Strict enforcement of performance patterns
4. **Comprehensive testing**: Unit tests for all business logic
5. **Documentation**: Clear, technical documentation

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/astronomical-calculations

# Make changes following quality standards
# ...

# Validate before commit
make pre-commit

# Commit with descriptive message
git commit -m "feat: implement high-precision ephemeris calculations

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## 📜 Documentation

- **[Technical Specification](tz.md)**: Detailed system architecture
- **[Product Requirements](prd.md)**: Feature specifications
- **[Quality Rules](quality-rules.toml)**: Enforced coding standards
- **[Build System](Makefile)**: Quality assurance automation

## 📧 License

UNLICENSED - Proprietary spiritual astronomy platform

---

> **Built with reverence for cosmic wisdom and technical excellence** 🌟
> 
> *Connecting spiritual seekers to astronomical knowledge through high-performance technology*
Axis/Seasons model (future VR notes)
- Per-frame orientation via solar zenith: φ = δ⊙; longitude from apparent sidereal time. Seasons/lighting are correct (solstices φ≈±ε, equinoxes φ≈0).
- We don’t persist an inertial axis vector to Polaris; this is sufficient for visuals. If needed later, add `earthAxisNode` in inertial space with precession/nutation and diurnal angle θ⊕.
# 🌟 StarsCalendars

> Spiritual astronomy platform combining high-precision astronomical calculations with 3D visualization, WebAssembly performance, and Telegram community integration.

## 🎯 Project Overview

StarsCalendars is a high-performance spiritual astronomy platform that provides:

- **🌌 Real-time 3D Visualization**: Cinematic quality astronomical scenes using Babylon.js 8
- **⚡ WebAssembly Calculations**: High-precision ephemeris calculations compiled to WASM
- **📱 Telegram Integration**: Community-driven authentication and premium features
- **🌍 Global Localization**: 10-language support with cultural adaptations
- **🏧 Clean Architecture**: Domain-driven design with clear separation of concerns

## 🛠️ Technology Stack

### Backend
- **Rust 1.89+** with Cargo edition 2024
- **Axum** web framework with WebSocket support
- **PostgreSQL** with SQLX for compile-time query validation
- **Teloxide** for Telegram Bot API integration
- **JWT RS256** authentication with custom claims

### Frontend
- **TypeScript 5.9** with strict type checking
- **Babylon.js 8 (major pin; latest 8.x at build time)** for 3D astronomical visualization
- **Vite 7** build system with WASM integration
- **React 19** with latest features
- **Fluent** for internationalization (ICU MessageFormat)

### WASM Core
- **Rust** compiled to WebAssembly
- **Zero-copy** data transfer via Float64Array
- **O(1) горячий путь** for real-time calculations
- **Thread-local buffers** for performance optimization
- Output (bundler target) is written to `frontend/src/wasm-astro/` as `starscalendars_wasm_astro.js` + `*_bg.wasm`
- Use left-handed Babylon system (default). Scientific coordinates remain RH (WASM). Apply single RH→LH Z flip in the scene when assigning positions; no flips in WASM bridge
- Single-call per frame: `compute_state(jd)` returns 11 f64 values: Sun zeros, Moon xyz (geocentric), Earth xyz (heliocentric), and Solar zenith [lon_east_rad, lat_rad].
  - Sun slots [0..2] are zeros by design (Sun fixed at origin).
  - Event timing helper: `next_winter_solstice_from(jd_utc_start)` — off-frame only, returns JD UTC of next minimum δ⊙.
- Zenith marker placement is canonical and must not be altered:
  - Use WASM radians directly; no degree conversions or constants
  - Local Earth-space spherical: `phi=(π/2)-lat`, `theta=(-lon_east_rad)+π`
  - Pivot orientation: `pivot.y = -((-lon_east_rad)+π)`, `pivot.z = lat`, `pivot.x = lat`; Earth mesh rotations remain zero
  - Moon orbit must follow pivot tilt/azimuth

### Textures & Assets (Frontend)
- All scene textures are served from `frontend/public/textures` and available at runtime under `/textures/...`
- Skybox: `/textures/universe/universe_[px,py,pz,nx,ny,nz].jpg`
- Earth: `/textures/earth-diffuse.jpg`, `/textures/earth-height.png`
- Moon: `/textures/moon.jpg`, `/textures/moon_bump.jpg`, `/textures/moon_spec.jpg`
- Stars: `/textures/star.png`

### Authentication & UI
- **Dioxus 0.7 ALPHA** fullstack framework for auth/profile/admin
- **Pure Telegram** authentication (no passwords)
- **Subscription verification** via getChatMember API
- **GUI**: Babylon GUI for date/quantum date; a single `#stats` div overlay for FPS; no other HTML overlays

## 📁 Project Structure

```
starscalendars/
├── astro-rust/        # 🔒 ASTRONOMICAL LIBRARY (READ-ONLY!) - DO NOT MODIFY
├── frontend/          # TypeScript + Vite + Babylon.js
├── wasm-astro/        # Rust WASM: эфемеридное ядро  
├── backend/           # Axum HTTP/WS, PostgreSQL, Telegram, JWT
├── dioxus-app/        # Dioxus 0.7 ALPHA fullstack для auth/profile/admin
├── libs/
│   ├── domain/        # Чистые типы и бизнес-правила
│   ├── app/           # Use-cases, портовые интерфейсы
│   └── infra/         # Клиенты PostgreSQL/Telegram/Cache
└── ops/               # Миграции, Helm/compose, CI/CD - МЫ НЕ ИСПОЛЬЗУЕМ ДОКЕР И РУКАМИ РАЗВОРАЧИВАЕМ НА СЕРВЕР Almalinux 9.4 уже скомпилированны фронт и только сарвер компилируем на своем сервере линукс для продакшна к которому копируем скомпилированный фронт!!!
```

## 🚨 CRITICAL: Astronomical Library

### astro-rust/ Folder - READ-ONLY
The `astro-rust/` folder contains the local copy of the astronomical calculation library with critical bug fixes:

- **🔒 DO NOT MODIFY** any files in this folder
- **📚 Contains**: VSOP87, ELP-2000/82 implementations with decimal_day and lunar equation fixes
- **🎯 Usage**: Referenced via `astro = { path = "./astro-rust" }` in Cargo.toml
- **⚠️ WARNING**: Any modifications will break astronomical precision and corrupt calculations

### Reference Scene
Референсная сцена больше не используется как источник истины и удалена из процесса. Все правила и формулы закреплены в текущей документации и в коде сцены.

## 🚀 Quick Start

### Prerequisites

- **Rust 1.89+** (automatically managed via `rust-toolchain.toml`)
- **Node.js 20+** and **pnpm 9+**
- **PostgreSQL 17+**
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

# Start frontend only (build WASM first and run Vite)
pnpm -w run dev:frontend-only
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

### 🚨 CRITICAL WASM RULES

**🔥 СТРОГО ЗАПРЕЩЕННЫЕ ПАТТЕРНЫ В WASM ОБЕРТКЕ:**
- ❌ **Mock-данные любого вида** - даже временные или для тестов
- ❌ **Кастомные астрономические формулы** не из astro-rust библиотеки
- ❌ **Hardcoded константы** планетарных позиций или орбитальных элементов
- ❌ **Прямые математические расчеты** вместо вызовов astro-rust функций
- ❌ **eval()** - 🚨 КРИТИЧЕСКАЯ уязвимость безопасности
- ❌ **Изменение кода в ./astro-rust/** - папка read-only
- ❌ **Частичное покрытие API** - должны быть ВСЕ функции библиотеки
- ❌ **Отсебятина в расчетах** - только чистые astro-rust вызовы

**✅ ОБЯЗАТЕЛЬНО ИСПОЛЬЗОВАТЬ:**
- ТОЛЬКО функции из astro-rust для астрономических расчетов
- Единый вызов `compute_state(jd)` на кадр (зенит уже в буфере)
- Исключение производительности: координаты Солнца в буфере заполняются нулями (сцена держит Солнце в (0,0,0)); вычисление солнечной позиции в горячем пути опущено намеренно
- Реальные эфемеридные данные, коррекции нутации/прецессии при необходимости

### General Anti-Patterns

- ❌ **`unwrap()`**, **`expect()`**, **`panic!()`** - Use `Result<T, E>` everywhere
- ❌ **`HashMap::new()`**, **`Vec::new()`** - Use `with_capacity()` for performance
- ❌ **`as` conversions** - Use `TryFrom` for safe type conversion
- ❌ **Multiple WASM calls per frame** - Only one `compute_state(t)` allowed
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

**10 Language Support** with cultural adaptations:

**Tier 1**: Russian, English, Chinese, Spanish, Hindi  
**Tier 2**: Portuguese, German, French, Japanese  
**Tier 3**: Armenian

- **Fluent L10n**: ICU MessageFormat standard
- **Cultural Sensitivity**: Spiritual community considerations

## 📋 Development Status - ОБНОВЛЕНО 2025-08-08

### 🌟 **ТЕКУЩИЙ СТАТУС: Phase 1.1 → 1.2 (95% готовности к переходу)**

✅ **Phase 0.1-0.2: Инфраструктура и архитектура** (ЗАВЕРШЕНО)
- [x] Монорепозиторий с pnpm workspaces
- [x] Clean Architecture (domain/app/infra слои) 
- [x] Quality Guardian система (77% готовности)
- [x] Rust 1.89+ compliance с zero anti-patterns
- [x] CI/CD pipeline, VS Code интеграция

✅ **Phase 1.1: Астрономическое ядро** (ЗАВЕРШЕНО)
- [x] **WASM модуль**: thread-local буферы, O(1) `compute_state()` (zenith included)
- [x] **Backend**: Axum 0.8, JWT RS256, WebSocket auth
- [x] **Frontend**: TypeScript 5.9, React 19, WASM интеграция  
- [x] **Infrastructure**: wasm-pack, pnpm workspace, сборка успешна

### 📊 **Build Metrics - ОТЛИЧНЫЕ РЕЗУЛЬТАТЫ:**
```
✅ Frontend Build: 17.48s with Vite 7.1.1 (Target: <20s)
✅ Bundle Size: 7.4MB total (5.3MB Babylon.js, 1.6MB WASM)
✅ WASM Module: 1.6MB compiled with astro-rust
✅ Zero Anti-Patterns: Rust 1.89+ compliant
✅ TypeScript: 100% strict typing (5.9.2)
✅ React: 19.1.1 latest features
```

🚀 **Phase 1.2: 3D Визуализация** (В ПРОЦЕССЕ)
- [x] Babylon.js 8 deps установлены
- [x] Vite 7 + React 19 + TypeScript 5.9 стек готов
- [x] WASM-Frontend интеграция complete (z‑flip в мосте)
- [x] GUI: Babylon GUI для дат, `#stats` overlay для FPS
- [ ] Пивоты Земли/Луны, true anomaly в поворотах, зенит‑маркер по формуле референса

### 🎯 **ВСЕ БЛОКЕРЫ УСТРАНЕНЫ - ГОТОВ К ПРОДОЛЖЕНИЮ**
- ✅ wasm-pack установлен и работает
- ✅ Frontend компилируется успешно (5.06s)
- ✅ WASM-JS интеграция функционирует
- ✅ Zero anti-patterns соблюдены
- ✅ Performance targets достигнуты

### ✅ Достигнуто сегодня (астрономия/сцена)
- Сублинарная точка (зенит Луны) вычисляется из RA/Dec Луны + видимого сидерического времени (AST); совпадает с внешними источниками
- Позиция Луны синхронизирована с маркером: используется тот же вектор (RA/Dec+AST → локальный земной вектор → мир), устранён постоянный сдвиг долготы
- Солнце статично в (0,0,0); слоты [0..2] STATE = 0

### ⏭️ Завтра (оптимизация вычислений и визуальный tidal lock)
- Расширить `compute_state(jd)` и вернуть в STATE предрасчёт, чтобы сцена не делала тригонометрию:
  - `lunar_ra_rad`, `lunar_dec_rad`, `apparent_sidereal_time_rad`
  - `sublunar_lon_east_rad`, `sublunar_lat_rad`
  - Единичный Earth-local вектор направления на Луну (или эквивалент в согласованной СК)
  - Ровно 1× `compute_state` на кадр; без дополнительных wasm-вызовов
- Реализовать визуальный tidal lock Луны: поворачивать её меш так, чтобы «одна сторона к Земле» (без либраций на этом этапе)

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

- **[Technical Specification](tz.md)**: Detailed system architecture (canonicalized)
- **[Product Requirements](prd.md)**: Feature specifications
- **[Quality Rules](quality-rules.toml)**: Enforced coding standards
- **[Build System](Makefile)**: Quality assurance automation
- **[Canonical Context Bootstrap](docs/context-bootstrap.md)**: Single source of truth for agents

## 📧 License

UNLICENSED - Proprietary spiritual astronomy platform

---

> **Built with reverence for cosmic wisdom and technical excellence** 🌟
> 
> *Connecting spiritual seekers to astronomical knowledge through high-performance technology*

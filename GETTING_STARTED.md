# 🚀 StarsCalendars - Getting Started

**High-performance spiritual astronomy platform with TypeScript 5.9 + Babylon.js 8 + WASM astronomical calculations**

## 🎯 Quick Start (First Launch)

### Prerequisites

```bash
# 1. Install Rust (required for WASM compilation)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# 2. Install wasm-pack (WASM build tool)
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# 3. Verify installations
rustc --version  # Should be 1.88+
wasm-pack --version
node --version   # Should be 20+
pnpm --version   # Should be 9+
```

### 🚨 КРИТИЧЕСКИ ВАЖНО - Build & Run (3 Steps)

```bash
# 1. Install dependencies
pnpm install

# 2. Build WASM module (КРИТИЧЕСКИ ВАЖНО - должно быть первым!)
# ⚠️  ЗАПОМНИ: WASM обертка использует ТОЛЬКО astro-rust функции
# ⚠️  НИКАКИХ mock-данных, отсебятины или кастомных формул!
pnpm run build:wasm

# 3. Start development server
cd frontend && pnpm run dev
```

**🔒 СТРОГО ЗАПРЕЩЕНО при работе с WASM:**
- Изменение файлов в папке `./astro-rust/` (read-only библиотека)
- Mock-данные в тестах или разработке
- Кастомные астрономические расчеты вместо astro-rust API
- eval() в любом контексте
- Hardcoded константы планетарных позиций

**Expected Result**: Browser opens to `http://localhost:3000` with 3D astronomical scene.

## 🔧 Development Architecture

### Current Implementation Status

✅ **Ready for Development:**
- **Frontend**: React 19 + TypeScript 5.9 + Vite 7 + Babylon.js 8
- **WASM Module**: ✅ Реализовано ядро: единый `compute_all(jd)` и `calculate_solar_zenith_position_rad(jd)`
- **3D Scene**: Interactive celestial body visualization with 60fps performance
- **Build System**: pnpm workspaces with optimized Rust/WASM/TypeScript compilation
- **Quality Gates**: Comprehensive linting, anti-pattern detection, performance monitoring

## 🛡️ КРИТИЧЕСКИЕ ПРАВИЛА РАЗРАБОТКИ WASM ОБЕРТКИ

### 🚨 СТРОГИЕ ОГРАНИЧЕНИЯ (НАРУШЕНИЕ = ПРОВАЛ ПРОЕКТА)

**❌ АБСОЛЮТНО ЗАПРЕЩЕНО:**
- **Mock-данные любого вида** - даже временные или для тестов
- **Любая отсебятина** или кастомные астрономические расчеты
- **Hardcoded значения** планетарных позиций или констант
- **Математические формулы не из astro-rust библиотеки**
- **eval()** в любом контексте - критическая уязвимость безопасности
- **Изменение кода в папке `./astro-rust/`** - она read-only!
- **Частичное покрытие API** - должны быть ВСЕ функции библиотеки
- **Отсебятина в расчетах** - только чистые astro-rust вызовы

**✅ ОБЯЗАТЕЛЬНО ИСПОЛЬЗОВАТЬ:**
- ТОЛЬКО функции из astro-rust для астрономических расчетов
- Ровно один вызов `compute_all(jd)` на кадр + `calculate_solar_zenith_position_rad(jd)` для зенита
- Zero-copy Float64Array и thread-local буферы
- Максимальная точность с коррекциями нутации/прецессии при необходимости

### 🎯 ПРИМЕР ПРАВИЛЬНОЙ РЕАЛИЗАЦИИ НОВОЙ ФУНКЦИИ:
```rust
// ✅ ПРАВИЛЬНО - только astro-rust функции
#[wasm_bindgen]
pub fn calculate_solar_zenith_position(julian_day: f64) -> *const f64 {
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

### 📊 ТЕКУЩЕЕ СОСТОЯНИЕ WASM ОБЕРТКИ:
- ✅ **24 функции** полностью покрывают astro-rust API
- ✅ **Солнечный зенит** реализован для точного поворота Земли
- ✅ **Нутация и прецессия** включены для максимальной точности
- ✅ **Нулевое копирование** данных через thread-local буферы
- ✅ **Производительность O(1)** для горячего пути рендеринга
- 🛡️ **Гарантия**: никаких mock-данных или отсебятины
- 🔒 **Папка ./astro-rust/** неприкосновенна (read-only)

❌ **Not Yet Implemented (Optional for first launch):**
- Backend API server (Axum/PostgreSQL)
- Telegram bot authentication
- Dioxus profile management
- Database integration

### What Works Without Backend

The **main astronomical 3D scene** is fully functional:
- Real-time celestial body calculations via WASM
- Interactive 3D visualization with Babylon.js 8
- High-precision astronomical algorithms (VSOP87, ELP-2000/82)
- 60fps performance with zero-copy WASM-JS data transfer
- TypeScript 5.9.2 strict type safety

### File Structure

```
starscalendars/
├── frontend/              # React + Babylon.js main app
│   ├── src/
│   │   ├── App.tsx        # Main application
│   │   ├── scene/         # 3D Babylon.js components  
│   │   └── wasm/          # WASM integration layer
│   └── vite.config.ts     # Vite 7.0.6 configuration
├── wasm-astro/            # Rust WASM astronomical core
│   ├── src/lib.rs         # High-performance calculations
│   └── pkg/               # Generated WASM artifacts
├── scripts/
│   └── build-wasm.sh      # WASM build automation
└── astro-rust/            # 🔒 READ-ONLY astronomical library
```

## 🛠️ Development Commands

### Build Commands

```bash
# Full project build (all components)
pnpm run build

# Individual component builds
pnpm run build:wasm      # Compile Rust → WASM (required first)
pnpm run build:frontend  # Vite production build
pnpm run build:dioxus    # Dioxus auth app

# Development builds
pnpm run build:wasm:debug  # Faster debug WASM build
```

### Development Servers

```bash
# Frontend only (recommended for astronomy scene development)
cd frontend && pnpm run dev

# Full stack development (if backend is configured)
pnpm run dev  # Runs frontend + backend + dioxus + telegram bot
```

### Quality Assurance

```bash
# Run all quality checks
make quality-check

# Individual checks
make anti-patterns  # Scan for forbidden patterns
make clippy        # Strict Rust linting
make security      # Security validation
make arch          # Architecture compliance
```

## 🚨 Common Issues & Solutions

### Issue 1: WASM Module Not Found

**Symptom**: `Cannot resolve '../wasm-astro/pkg'`

**Solution**:
```bash
# Build WASM module first
pnpm run build:wasm

# Verify files exist
ls -la wasm-astro/pkg/
# Should show: starscalendars_wasm_astro.js, *.wasm, *.d.ts, package.json
```

### Issue 2: TypeScript Compilation Errors

**Symptom**: `ES2025 target not supported`

**Solution**: Update `frontend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "esnext",  // Changed from ES2025
    "lib": ["esnext", "DOM", "DOM.Iterable"]
  }
}
```

### Issue 3: Babylon.js Import Errors

**Symptom**: `Module not found: @babylonjs/core`

**Solution**:
```bash
cd frontend
pnpm add @babylonjs/core@^8 @babylonjs/materials@^8 @babylonjs/loaders@^8
```

### Issue 4: Permission Denied on Scripts

**Symptom**: `Permission denied: ./scripts/build-wasm.sh`

**Solution**:
```bash
chmod +x scripts/build-wasm.sh
```

## ⚡ Performance Targets

### Production Requirements
- **Frame Rate**: Stable 60fps on reference desktop
- **Bundle Size**: <2MB compressed for entire frontend
- **Initial Load**: <3 seconds to interactive on 3G connection
- **Memory Usage**: <100MB additional heap after full scene load
- **WASM Performance**: Exactly one `compute_all(t)` call per frame

### Current Performance Status

✅ **Optimized**:
- Zero-copy WASM-JS data transfer via Float64Array views
- Pre-allocated Vector3/Quaternion objects in Babylon.js
- Thread-local buffers in WASM for O(1) горячий путь
- Material.freeze() and mesh optimization flags
- Terser + tree-shaking for minimal bundle size

## 🌟 Astronomical Features

### Implemented Calculations
- **Sun**: Geocentric ecliptic position with nutation corrections
- **Moon**: ELP-2000/82 lunar theory (high precision)
- **Planets**: VSOP87 planetary theory (Mercury through Neptune)
- **Pluto**: Specialized high-precision algorithms
- **Corrections**: Nutation, precession, atmospheric refraction

### Coordinate Systems
- **Input**: Julian Day (astronomical standard)
- **Processing**: Ecliptic spherical coordinates (radians)
- **Output**: Cartesian coordinates for 3D scene (AU units)
- **Performance**: All calculations in single WASM call per frame

## 🎨 3D Visualization

### Babylon.js 8 Features
- **WebGPU Support**: Automatic fallback to WebGL 2.0
- **Material Optimization**: Frozen materials, pre-allocated meshes
- **Camera System**: ArcRotateCamera with smooth controls
- **Lighting**: Hemispheric + point light setup for realism
- **Performance**: 60fps guaranteed on modern hardware

### Scene Layout
- **Heliocentric View**: Sun at origin (0,0,0)
- **Earth**: Heliocentric VSOP87 position
- **Moon**: Geocentric offset parented to Earth pivot
- **Planets**: Scaled artistic proportions for visibility
- **Scale**: Optimized for cinematic quality vs. astronomical accuracy

## 🚀 Next Steps

### Immediate Development
1. **WASM Module**: Build and test astronomical calculations
2. **3D Scene**: Customize celestial body appearance and animations
3. **UI Overlay**: Add HTML/CSS controls and information displays
4. **Performance**: Monitor and optimize 60fps consistency

### Future Integration
1. **Backend API**: Axum server for user data persistence
2. **Telegram Bot**: Community authentication and subscriptions
3. **Dioxus App**: User profile and admin interface
4. **Database**: PostgreSQL for user accounts and preferences

### Production Deployment
1. **Frontend Build**: Static assets compilation
2. **WASM Optimization**: Size and performance tuning
3. **Server Setup**: AlmaLinux 9.4 deployment (NO DOCKER)
4. **Performance Testing**: Load testing for 10,000+ concurrent users

## 📚 Documentation Links

- **TypeScript 5.9**: https://www.typescriptlang.org/
- **Babylon.js 8**: https://doc.babylonjs.com/
- **Vite 7**: https://vite.dev/
- **wasm-pack**: https://rustwasm.github.io/wasm-pack/
- **astro-rust**: Local copy in `./astro-rust/` (🔒 READ-ONLY)

---

**Ready to explore the cosmos! 🌟**

Run `pnpm run build:wasm && cd frontend && pnpm run dev` to see your first astronomical 3D scene.

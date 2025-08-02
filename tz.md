Ниже — детализированное ТЗ уровня профессионального продакшна для высоконагруженной, низколатентной системы реального времени. Основано на чистой архитектуре, современном Rust 1.88 (26.06.2025), идиоматических практиках, без антипаттернов. Включает ключевые библиотеки на момент подготовки и примеры кода. VR пока не реализуем, но вся архитектура VR-ready.

## Цель
Создать кроссплатформенное веб-приложение астрономической визуализации с 3D‑сценой (Babylon.js 8) и покадровыми расчетами эфемерид в Rust/WASM. Бэкенд на Axum обеспечивает аутентификацию (JWT), интеграцию с Telegram (проверка подписки), хранение в PostgreSQL и двунаправленный обмен по WebSocket. Личный кабинет/админка/авторизация вынесены в отдельное Dioxus WASM-приложение. **Система поддерживает 12 языков с культурными адаптациями для глобального духовного сообщества.** Стек и код соответствуют принципам чистой архитектуры, SOLID, явному управлению зависимостями, тестируемости и высокой производительности.

Высокоуровневая архитектура (чистая)
Слои и зависимости (внешние слои зависят от внутренних только через интерфейсы/абстракции):

Domain (ядро): чистые типы и бизнес‑правила (эфемеридная модель, валидаторы, политики авторизации).
UseCases/Application (сервисные интеракторы): оркестровка сценариев (логин, привязка Telegram, ревалидация статуса подписки, выдача JWT). Зависит от портов (traits) репозиториев/шлюзов.
Adapters/Interfaces: реализации портов (репозитории SQLX, Telegram Bot API, кэш), мапперы DTO, валидаторы ввода/вывода.
Delivery (входные/выходные интерфейсы): Axum HTTP/WS, Dioxus server functions, Vite/TS фронтенд, WASM интерфейс.
Cross-cutting: observability (tracing), конфигурация (env+typed), безопасность (JWT, CSP), миграции.
Монорепозиторий (pnpm + Cargo workspaces)
root/

frontend/ (TypeScript + Vite + Babylon.js)
wasm-astro/ (Rust → WASM: эфемеридное ядро)
backend/ (Axum HTTP/WS, PostgreSQL, Telegram, JWT)
dioxus-app/ (Dioxus fullstack для auth/profile/admin)
libs/
domain/ (общие доменные типы и контракты)
app/ (use-cases, портовые интерфейсы)
infra/ (клиенты PostgreSQL/Telegram/Cache, реализация портов)
ops/ (миграции, Helm/compose, CI/CD)
Версии инструментов и библиотек (пример на дату)
Rust: 1.88.0 stable (2025-06-26)
Cargo edition: 2024.
Axum: latest stable
Tokio: latest stable
SQLX: latest stable (runtime-tokio-rustls, postgres, macros, offline feature для compile-time проверок)
Serde: latest stable
jsonwebtoken: latest stable (или josekit latest stable для JWK/JWKS при RS256)
tower-http: latest stable
tracing/tracing-subscriber: latest stable
teloxide: latest stable
time: latest stable
uuid: latest stable
anyhow/thiserror: latest stable
config/figment: latest stable
bb8/Deadpool (если нужен пул) — но SQLX уже с пулом
dioxus: latest stable (fullstack)
wasm-bindgen: latest stable
wasm-pack: latest stable
js-sys/web-sys: latest stable
babylon.js: 8.x
vite: latest stable
vite-plugin-wasm/top-level-await: latest
typescript: latest stable

Принципы производительности и O(1)

Горячий путь кадра: ровно один вызов WASM compute_all(t) на кадр; доступ к результатам через view на WebAssembly.Memory (Float64Array) без копирования; O(1) доступ к значениям.
В Babylon.js: ни одной аллокации в кадре — переиспользование Vector3/Quaternion; обновления через методы ToRef/copyFromFloats.
В бэкенде: пути аутентификации и WS-авторизации — O(1) по времени обработки запроса с учётом кэширования Telegram статуса; асимптотика зависит от конкретных внешних I/O, но внутренние операции не вводят лишних аллокаций/копий.
SQL: индексные планы, целевые SELECT по первичным/уникальным ключам, подготовленные запросы; использовать SQLX compile-time проверки; строгое ограничение N+1; транзакции минимальной длительности.
WS протокол: компактные сообщения, без избыточных полей; JSON для человекочитаемости, бинарные форматы (CBOR) при росте нагрузки.
Константные структуры данных на горячем пути, отказ от динамической рефлексии, ранние проверки.
Domain (пример)

Value объекты: JulianDay, EclipticCoords, CartesianCoords, TelegramUserId, UserId, JwtClaims.
Инварианты: валидатор диапазона долгот/широт, проверка систем отсчёта (ecliptic J2000), политика доступа (is_subscribed ∧ role ≥ …).
Без зависимостей на инфраструктуру.
Rust пример (domain/types.rs):
pub struct JulianDay(pub f64);

pub struct EclipticSpherical {
pub lon_rad: f64,
pub lat_rad: f64,
pub r_au: f64,
}

pub struct Cartesian {
pub x: f64,
pub y: f64,
pub z: f64,
}

impl Cartesian {
#[inline]
pub fn from_ecliptic_spherical(s: &EclipticSpherical) -> Self {
// Прямое преобразование без аллокаций
let clat = s.lat_rad.cos();
let x = s.r_au * clat * s.lon_rad.cos();
let y = s.r_au * clat * s.lon_rad.sin();
let z = s.r_au * s.lat_rad.sin();
Self { x, y, z }
}
}

UseCases (пример портов)

AuthUseCase: login(username, password) -> JwtPair; refresh(token) -> JwtPair
TelegramLinkUseCase: issue_link_token(user_id) -> Token; confirm_link(token, telegram_id)
SubscriptionCheckUseCase: is_subscribed(telegram_user_id) -> bool (caching)
ProfileUseCase: get_profile(user_id), update_profile(…)
В портах Repository/ClientTraits: UsersRepo, TelegramApi, Cache (Redis/Memory), TokenService.
Пример trait:
#[async_trait::async_trait]
pub trait TelegramApi {
async fn is_member_of_channel(&self, user_id: i64) -> anyhow::Result<bool>;
}

WASM модуль (wasm-astro/)
Требования:

Rust 1.88, no_std не требуется (web-target), но без лишних аллокаций в горячем пути.
Только числовые данные через общий буфер; никакой сериализации/JSON в кадре.
Один предвыделенный буфер с фиксированной раскладкой.
Экспорт указателя и длины; JS создаёт Float64Array(memory.buffer, ptr, len).
Вариант: сразу возвращать декартовы координаты для обеих точек (Солнце геоцентрически — условно центр сцены; Луна — позиционируется; Земля — при необходимости относительно Солнца, но для геоцентрической сцены Земля в (0,0,0)).
Пример (упрощённый, без ошибок и с заглушками astro-rust):
// Cargo.toml
// [lib]
// crate-type = ["cdylib"]
// [dependencies]
// wasm-bindgen = latest stable
// once_cell = latest stable
// # astro = "2.0.0" // saurvs/astro-rust

use wasm_bindgen::prelude::*;
use std::cell::RefCell;

const OUT_LEN: usize = 6; // [sun_x,sun_y,sun_z, moon_x,moon_y,moon_z]

thread_local! {
static OUT_BUF: RefCell<[f64; OUT_LEN]> = RefCell::new([0.0; OUT_LEN]);
}

#[wasm_bindgen]
pub fn out_len() -> usize { OUT_LEN }

#[wasm_bindgen]
pub fn compute_all(jd: f64) -> *const f64 {
OUT_BUF.with(|b| {
let mut buf = b.borrow_mut();
// TODO: использовать исключительно astro-rust библиотеку из ./astro-rust/ (локальная копия с багфиксами) : VSOP87 + ELP-2000/82; учесть ΔT/TT
// 🚨 ВАЖНО: НЕ ИЗМЕНЯТЬ код в папке astro-rust/ - это неприкосновенный код библиотеки!
// Здесь демонстрация: пишем заранее рассчитанные XYZ
// sun_xyz := (0,0,0) для геоцентрической сцены (либо реальный расчет)
buf[0] = 0.0; buf[1] = 0.0; buf[2] = 0.0;
// moon_xyz := флаговый расчет
let (mx, my, mz) = fake_moon_xyz(jd);
buf[3] = mx; buf[4] = my; buf[5] = mz;
buf.as_ptr()
})
}

fn fake_moon_xyz(jd: f64) -> (f64,f64,f64) {
// Заглушка для примера
let t = jd * 0.001;
(t.cos()*0.1, t.sin()*0.1, 0.02)
}

Важно: реальная интеграция с saurvs/astro-rust, корректные преобразования времени (UTC→TT/TDB), и минимизация тригонометрии в JS.

Frontend (frontend/, Vite + TS + Babylon.js)

TS строгий (noImplicitAny, strictNullChecks).
Импорт WASM как ESM. Использовать vite-plugin-wasm/top-level-await.
Рендер‑цикл: один вызов compute_all(jd), чтение Float64Array(memory.buffer, ptr, len), без аллокаций.
Babylon.js: переиспользование объектов; freeze для статичных.
Пример TS:
import { Engine, Scene, ArcRotateCamera, HemisphericLight, MeshBuilder, Vector3 } from "@babylonjs/core";
import init, { compute_all, out_len, memory } from "../wasm-astro/pkg/wasm_astro.js";

async function main() {
await init();
const canvas = document.createElement("canvas");
Object.assign(canvas.style, { width: "100%", height: "100%", position: "fixed", inset: "0" });
document.body.appendChild(canvas);

const engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false });
const scene = new Scene(engine);
const camera = new ArcRotateCamera("cam", Math.PI/2, Math.PI/3, 3, Vector3.Zero(), scene);
camera.attachControl(canvas, true);
new HemisphericLight("h", new Vector3(0,1,0), scene);

const earth = MeshBuilder.CreateSphere("earth", { diameter: 0.1 }, scene);
const moon = MeshBuilder.CreateSphere("moon", { diameter: 0.027 }, scene);

const outLen = out_len();
let outView: Float64Array;

const posMoon = new Vector3(0,0,0);

scene.onBeforeRenderObservable.add(() => {
const now = performance.now();
const jd = toJulianDay(now); // реализовать корректно
const ptr = compute_all(jd);
if (!outView) outView = new Float64Array((memory as WebAssembly.Memory).buffer, ptr, outLen);


// [sun_x,sun_y,sun_z, moon_x,moon_y,moon_z]
posMoon.copyFromFloats(outView[3], outView[4], outView[5]); // масштаб применить один раз по дизайну
moon.position.copyFrom(posMoon);
});

engine.runRenderLoop(() => scene.render());
}

function toJulianDay(ms: number): number {
// Упростим для примера. В проде — UTC→JD→TT/TDB с ΔT
const jd1970 = 2440587.5; // JD эпоха Unix
return jd1970 + ms / 86400000.0;
}

main().catch(console.error);

GUI

Основной UI (кнопки “Войти/Профиль”, статусы) — HTML/CSS overlay поверх canvas. Это быстрее, гибче, проще для доступности.
3D‑привязанный UI (метки) — Babylon GUI точечно.
VR-ready: в будущем world-space панели для VR, а HTML скрывать в XR.
Бэкенд (backend/, Axum)

Axum маршруты: REST API, WS, статика. Чистая архитектура: хэндлеры зависят от use-cases через DI (Arc<AppContainer>).
JWT: RS256 предпочтительно (ротация ключей через JWKS, при необходимости). Минимальные клеймы: sub, exp, iat; кастомный is_telegram_subscribed.
WebSocket: клиент отправляет JWT первым сообщением; сервер валидирует и привязывает пользовательский контекст.
Пример структуры:
use axum::{Router, routing::{get, post}, extract::State, response::IntoResponse};
use std::sync::Arc;

#[derive(Clone)]
struct AppContainer {
auth_uc: Arc<dyn AuthUseCase>,
// ...
}

async fn login(State(app): State<Arc<AppContainer>>, payload: LoginDto) -> impl IntoResponse {
// валидируем DTO, вызываем use-case, возвращаем токены
}

fn router(app: Arc<AppContainer>) -> Router {
Router::new()
.route("/api/auth/login", post(login))
.merge(static_routes())
.with_state(app)
}

JWT (пример сервисного кода):
pub struct JwtService {
enc: jsonwebtoken::EncodingKey,
dec: jsonwebtoken::DecodingKey,
alg: jsonwebtoken::Algorithm,
}

impl JwtService {
pub fn encode(&self, claims: &Claims) -> anyhow::Result<String> {
use jsonwebtoken::{Header, encode};
let mut h = Header::new(self.alg);
// kid, typ при необходимости
Ok(encode(&h, claims, &self.enc)?)
}
pub fn decode(&self, token: &str) -> anyhow::Result<Claims> {
use jsonwebtoken::{Validation, decode};
let data = decode::<Claims>(token, &self.dec, &Validation::new(self.alg))?;
Ok(data.claims)
}
}

SQLX и PostgreSQL

Подключение через sqlx::Pool<Postgres>, tls = rustls.
Миграции (sqlx migrate). Включить sqlx offline feature и макросы для compile-time проверки запросов.
Схема:
users(id uuid pk, username citext unique, password_hash text, telegram_user_id bigint null, created_at timestamptz, updated_at timestamptz)
refresh_tokens(id uuid pk, user_id, token_hash, exp)
telegram_linking(token uuid pk, user_id, expires_at timestamptz)
Индексы по username, telegram_user_id, exp.
Пароли — Argon2id (memory-hard), pepper + per-user salt.
Telegram интеграция

teloxide для бота. Флоу:
dioxus-app вызывает backend: issue_link_token -> записываем в telegram_linking.
пользователь отправляет токен боту.
бот вызывает backend endpoint confirm_link(token, telegram_user_id).
backend проверяет getChatMember и сохраняет user.telegram_user_id, кэширует is_subscribed.
Кэш: Redis или in-memory с TTL. Пример интерфейса Cache: get/set с serde_json для значений.
WebSockets

/ws/user: upgrade → ожидать первое сообщение {type:"auth", token:"..."} → валидация → присвоить UserContext → обмен сообщений.
Формат сообщений: компактный JSON (или CBOR).
Реконнект с бэкофф на фронте.
Dioxus (dioxus-app/)

Маршруты: /auth/login, /auth/register, /auth/profile, /auth/admin.
Server functions: типобезопасные вызовы к backend.
После логина — редирект на “/” (frontend сцена).
Хранение токенов: access — в памяти (внутри вкладки), refresh — HttpOnly cookie (опционально).
Безопасность

HTTPS везде; HSTS; TLS 1.2+ rustls.
CSP: default-src 'self'; connect-src 'self' wss: https:; img-src; font-src; style-src с nonce/hash.
CSRF: не применимо для pure API с JWT и SameSite=strict; если формы — CSRF токен.
Пароли: Argon2id, ограничение попыток (rate limiting/IP throttling).
JWT время жизни access короткое (например, 15 мин), refresh — дольше (ротация, revocation list).
Логи: tracing + разноуровневые spans; PII не логировать.
Наблюдаемость и стабильность

tracing/tracing-subscriber с JSON форматтером; корелляция запросов (request-id).
метрики Prometheus (opentelemetry-плагины при необходимости).
Health endpoints /healthz, /readyz.
Анти‑backpressure: ограничение числа одновременных WS, таймауты, keep-alive, ping/pong.
Сборка и деплой

Vite build для frontend; wasm-pack build --release для wasm-astro; dioxus build.
Axum как единая точка статики и API.
Docker multi-stage, минимальные слои (FROM rust:slim для build → FROM gcr.io/distroless/cc для run, если подходит).
CI: форматирование (rustfmt), clippy (deny(warnings) для критичного кода), cargo-audit, sqlx prepare.
VR-ready пометки

UI разделён: HTML для 2D, возможность world-space UI на Babylon GUI для XR без ломки архитектуры.
В будущем: WebXR session injection на клиенте, рендер тех же мешей; логин — вне XR или world-space минимальный.
Ссылки на актуальные практики

Axum/бэкенд производительность и архитектура — см. продвинутые разборы и гайды по оптимизациям в Rust бэкендах (medium.com, medium.com, medium.com). Хотя они рассматривают и другие фреймворки (Actix), подходы к низкой латентности, аллокациям и архитектурной дисциплине применимы и к Axum.
Продакшн шаблоны Axum/WebApp (структура проекта, слои, best practices): github.com.
Критерии приемки

FPS: стабильные 60 кадр/с на эталонном десктопе (указать конфигурацию).
На кадр: 1 вызов WASM; нулевая аллокация в рендер‑цикле (проверено профилировщиком).
Бэкенд: p95 latency < X ms для /auth/login и /ws handshake (указать SLA).
SQL: все запросы проходят compile-time проверку SQLX; миграции повторяемы; индексные планы подтверждены EXPLAIN ANALYZE.
Безопасность: прохождение статических анализов (clippy, cargo-audit), CSP работает, HTTPS, токены корректно выдаются/освежаются.
Кроссбраузерность: Chromium/Firefox/Safari последних релизов; мобильные Chrome/Safari.
VR-ready: экспериментальная ветка с прототипом WebXR запускается (в будущем), без изменений бэкенда.
## Многоязычная система (11 языков)

### Поддерживаемые языки (приоритетные уровни)
- **Tier 1** (1B+ носителей): English, Chinese, Spanish, Hindi, Portuguese
- **Tier 2** (400M+ носителей): German, French, Japanese  
- **Tier 3** (специализированные): Russian, Georgian, Armenian

### Архитектура i18n
- **Fluent** для локализации (ICU MessageFormat)
- **Кроссплатформенная синхронизация**: Dioxus ↔ Babylon.js ↔ HTML overlay
- **Культурные адаптации**: священные календари, региональные форматы
- **Производительность**: <200ms загрузка языка, <100ms переключение

### Реализация
```rust
// libs/domain/i18n.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Language {
    English, Chinese, Spanish, Hindi,
    Portuguese, German, French, Japanese,
    Russian, Georgian, Armenian,
}

impl Language {
    pub fn icu_locale(&self) -> &'static str {
        match self {
            Language::English => "en-US",
            Language::Chinese => "zh-CN", 
            Language::Spanish => "es-ES",
            Language::Hindi => "hi-IN",
            // ... остальные языки
        }
    }
}
```

### GUI стратегия
- **HTML/CSS overlay** для основного UI (меню, кнопки, формы)
- **Babylon.js GUI** только для 3D-интегрированных элементов
- **Производительность**: HTML overlay значительно быстрее Babylon GUI
- **Локализация**: полная поддержка всех 11 языков

### Telegram интеграция
- **Многоязычный бот** с культурными адаптациями
- **Автоматическое определение языка** по Telegram настройкам
- **Локализованные команды** и ответы
- **Культурные символы** в сообщениях

## Дополнительные архитектурные детали

### WASM-JS интероперабельность
- **Float64Array view** на WebAssembly.Memory без копирования
- **Thread-local буферы** для нулевого копирования
- **Единый вызов** `compute_all(t)` на кадр
- **Избегание** передачи строк между WASM-JS

### Процесс привязки Telegram
- **Генерация UUID токенов** для безопасной привязки
- **API endpoints**: `/api/telegram/link-account`, `/api/telegram/confirm-link`
- **Валидация через getChatMember** для проверки подписки
- **Кэширование статуса** подписки для производительности

### WebSocket протокол
- **Компактный JSON** для человекочитаемости
- **CBOR** для бинарных данных при росте нагрузки
- **Первое сообщение**: JWT аутентификация
- **Сериализация через serde** для типобезопасности

### Dioxus Server Functions
- **Типобезопасный RPC** между клиентом и сервером
- **Компиляция в WASM** для производительности
- **Интеграция с Axum** через HTTP endpoints
- **Кэширование** переводов в памяти

### Процесс сборки
- **pnpm workspaces** для монорепозитория
- **Vite плагины**: `vite-plugin-wasm`, `vite-plugin-top-level-await`
- **wasm-pack** с флагом `--release` для оптимизации
- **Docker multi-stage** для минимальных образов

## Примечания

Уточнить точные версии crate-ов в Cargo.toml на docs.rs.
Регулярные обновления через Dependabot/Renovate.
Проработать точные модели времени: ΔT таблица, преобразования UTC→TT/TDB; при необходимости — вынести в отдельный модуль libs/time.
При росте нагрузки на Telegram API — внедрить Redis кэш (TTL) и батч‑проверки.

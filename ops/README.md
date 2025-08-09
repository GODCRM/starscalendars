# Operations & Deployment

## 🚨 КРИТИЧЕСКИЙ POLICY: NO DOCKER

**МЫ НЕ ИСПОЛЬЗУЕМ DOCKER И РУКАМИ РАЗВОРАЧИВАЕМ НА СЕРВЕР AlmaLinux 9.4**

### Deployment Strategy

#### Frontend
- Компилируется заранее локально с помощью `pnpm run build`
- Результат сборки в `frontend/dist/`
- Копируется на сервер через rsync

#### Backend  
- Компилируется ТОЛЬКО на продакшн сервере AlmaLinux 9.4
- Команда: `cargo build --release --target-cpu=native`
- Исполняемый файл: `target/release/backend`

#### WASM
- Компилируется заранее с `pnpm run build:wasm` (bundler target → `frontend/src/wasm-astro/`)
- Интегрируется в frontend build

### Server Requirements

- **OS**: AlmaLinux 9.4
- **Rust**: stable toolchain
- **System deps**: gcc, openssl-devel, postgresql-devel
- **Database**: PostgreSQL 15+
- **Web server**: nginx (для статики) + Axum backend

### Deployment Flow

1. **Local build**: Frontend + WASM
2. **Upload**: rsync статические файлы на сервер
3. **Server build**: Компиляция backend на сервере
4. **Service restart**: systemd unit для backend
5. **Health check**: Проверка доступности

### Manual Deployment Commands

```bash
# Локальная сборка
pnpm run build:prod
cd wasm-astro && wasm-pack build --release --target web

# Копирование на сервер
rsync -av frontend/dist/ user@server:/var/www/starscalendars/

# На сервере
ssh user@server
cd /var/www/starscalendars/backend
cargo build --release --target-cpu=native
sudo systemctl restart starscalendars-backend
```

### Agents Responsible

- **project-coordinator**: Координация всего процесса развертывания
- **quality-guardian**: Тестирование и валидация перед развертыванием

## Directory Structure

- `migrations/` - SQL migrations для PostgreSQL
- `docker/` - ПУСТАЯ (не используется)  
- `k8s/` - ПУСТАЯ (не используется)
- `scripts/` - Скрипты для автоматизации развертывания

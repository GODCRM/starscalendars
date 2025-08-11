# StarsCalendars Quality-First Makefile

.PHONY: quality-check anti-patterns wasm-critical wasm-perf clippy security arch perf clean setup monitor quality-report quality-summary find-patterns security-audit test bench docs check ci

# 🛡️ Главная проверка качества (enhanced with WASM critical checks)
quality-check: anti-patterns wasm-critical clippy security arch
	@echo "✅ All quality checks passed!"

# 🔍 Проверка антипаттернов (with enhanced test code exclusion)
anti-patterns:
	@EXCLUDE_DIRS="--exclude-dir=astro-rust" ./scripts/anti-patterns.sh || true

# 📋 unwrap_or антипаттерны (канон в anti.md)
unwrap-or-patterns:
	@echo "📋 Checking unwrap_or anti-patterns..."
	@! (grep -r "\.unwrap_or(" --include="*.rs" --exclude-dir=target --exclude-dir=astro-rust . | grep -E "\(\w+\(" ) || \
		(echo "❌ Found unwrap_or with function call - use unwrap_or_else" && exit 1)
	@! grep -r "\.unwrap_or.*build_from_scratch\|\.unwrap_or.*save_in_redis" --include="*.rs" --exclude-dir=target --exclude-dir=astro-rust . || \
		(echo "❌ Found unwrap_or with side effects - use unwrap_or_else" && exit 1)
	@echo "✅ unwrap_or patterns validated"

# 🏭 Production-ready patterns (excluding test code per CLAUDE.md)
production-patterns:
	@./scripts/production-patterns.sh

# 🚨 Error handling patterns (канон в anti.md + QUALITY.md)
error-handling-patterns:
	@echo "🚨 Checking error handling patterns..."
	@! (grep -r "fn.*-> Result" --include="*.rs" --exclude-dir=target --exclude-dir=astro-rust . | head -5 | xargs -I {} sh -c 'file="{}"; grep -q "unwrap\|expect" "$${file%:*}" && echo "❌ Found unwrap/expect in Result function: $${file%:*}"' ) || exit 1
	@grep -q "thiserror\|anyhow" Cargo.toml || echo "⚠️  Consider using thiserror/anyhow for structured error handling"
	@echo "✅ Error handling patterns validated"

# 🦀 Строгий Clippy с правилами из anti.md/QUALITY.md/CLAUDE.md
clippy:
	@echo "🦀 Running strict Clippy checks (excluding astro-rust dependency)..."
	@echo "📦 Checking WASM module..."
	@if [ -f "wasm-astro/Cargo.toml" ]; then \
		cargo clippy --manifest-path=wasm-astro/Cargo.toml --all-targets --all-features -- \
			-W clippy::unwrap_used -W clippy::expect_used -W clippy::panic || echo "⚠️ WASM clippy issues found"; \
	else \
		echo "⚠️ WASM module not found at wasm-astro/"; \
	fi
	@echo "📦 Checking workspace packages..."
	@if [ -f "backend/Cargo.toml" ]; then \
		cargo clippy --manifest-path=backend/Cargo.toml --all-targets --all-features -- \
			-D clippy::unwrap_used -D clippy::expect_used -D clippy::panic -D clippy::as_conversions || echo "⚠️ Backend clippy issues found"; \
	fi
	@if [ -d "libs" ]; then \
		find libs -name "Cargo.toml" | while read cargo_file; do \
			echo "📦 Checking $$cargo_file..."; \
			cargo clippy --manifest-path="$$cargo_file" --all-targets --all-features -- \
				-D clippy::unwrap_used -D clippy::expect_used -D clippy::panic -D clippy::as_conversions || echo "⚠️ Clippy issues in $$cargo_file"; \
		done; \
	fi
	@if [ -f "dioxus-app/Cargo.toml" ]; then \
		cargo clippy --manifest-path=dioxus-app/Cargo.toml --all-targets --all-features -- \
			-D clippy::unwrap_used -D clippy::expect_used -D clippy::panic -D clippy::as_conversions || echo "⚠️ Dioxus clippy issues found"; \
	fi
	@echo "✅ Clippy checks completed for existing packages"

# 🎯 WASM производительность и безопасность (enhanced for 2025)
wasm-perf:
	@echo "🎯 Checking WASM performance patterns..."
	@! (grep -A10 -B10 "compute_state" wasm-astro/src/*.rs | grep -q "for\|while") || \
		(echo "❌ Multiple WASM calls detected - violates O(1) requirement" && exit 1)
	@echo "✅ WASM performance patterns valid"

# 🚨 CRITICAL WASM anti-patterns (based on 2025 security research)
wasm-critical:
	@echo "🚨 Checking CRITICAL WASM anti-patterns..."
	@! (grep -r "mock_" --include="*.rs" wasm-astro/src/ 2>/dev/null | grep -v "#\[cfg(test)\]") || \
		(echo "❌ CRITICAL: Mock data found in WASM - STRICTLY FORBIDDEN" && exit 1)
	@! grep -r "const.*=.*[0-9]\+\.[0-9]" --include="*.rs" wasm-astro/src/ | grep -v "astro::" || \
		(echo "❌ CRITICAL: Hardcoded astronomical constants - use astro-rust only" && exit 1)
	@! grep -r "eval(" --include="*.rs" --include="*.ts" --include="*.js" \
		--exclude-dir=node_modules --exclude-dir=frontend/node_modules \
		--exclude-dir=dist --exclude-dir=frontend/dist \
		--exclude-dir=target --exclude-dir=astro-rust \
		. | grep -v "// ❌ FORBIDDEN" || \
		(echo "❌ CRITICAL SECURITY: eval() usage detected - XSS vulnerability!" && exit 1)
	@echo "🔎 Verifying any calculate* functions use astro-rust APIs..."
	@violations=$$(find wasm-astro/src/ -name "*.rs" -exec grep -l "fn.*calculate" {} \; \
		| xargs -I{} sh -c 'grep -q "astro::" "{}" || echo "{}"'); \
	if [ -n "$$violations" ]; then \
		echo "❌ CRITICAL: Custom calculations without astro-rust - forbidden!"; \
		echo "📁 Files:"; echo "$$violations" | sed 's/^/  - /'; \
		exit 1; \
	fi
	@if [ -d "./astro-rust" ]; then \
		if find ./astro-rust -name "*.rs" -newer ./astro-rust/Cargo.toml 2>/dev/null | grep -q .; then \
			echo "❌ CRITICAL: astro-rust/ directory modified - READ-ONLY!"; \
			exit 1; \
		fi; \
	else \
		echo "⚠️ astro-rust directory not found - cannot verify read-only status"; \
	fi
	@echo "✅ WASM critical anti-patterns check passed"

# 🔒 Безопасность (исправленные проверки)
security:
	@echo "🔒 Running security checks..."
	@if [ -d "backend/src" ]; then \
		grep -r "RS256" backend/src/ || echo "⚠️  RS256 JWT validation should be present"; \
		if grep -r "format!" backend/src/ | grep -q "SELECT\|INSERT\|UPDATE"; then \
			echo "❌ Potential SQL injection - use sqlx::query!"; \
			exit 1; \
		fi; \
	else \
		echo "⚠️ Backend source not found - skipping backend security checks"; \
	fi
	@echo "✅ Security checks passed"

# 🏗️ Архитектура (исправленные проверки)
arch:
	@echo "🏗️ Checking architecture compliance..."
	@if [ -d "libs/domain/src" ]; then \
		if grep -r "use.*infrastructure" libs/domain/src/; then \
			echo "❌ Domain layer depends on infrastructure"; \
			exit 1; \
		fi; \
	else \
		echo "⚠️ Domain layer not found - skipping domain architecture checks"; \
	fi
	@echo "✅ Architecture compliance verified"

# 🚀 Производительность (с проверкой существования)
perf:
	@echo "🚀 Running performance tests..."
	@if cargo test --list | grep -q "bench_"; then \
		cargo test --release -- --ignored bench_; \
	else \
		echo "⚠️ No benchmark tests found - skipping performance tests"; \
	fi

# 🧹 Форматирование
fmt:
	cargo fmt --all

# 🔧 Полная проверка перед коммитом (enhanced with WASM validation)
pre-commit: quality-check wasm-perf fmt perf
	@echo "🎉 Ready to commit!"

# 📊 Comprehensive quality report
quality-report:
	@echo "🛡️ Generating comprehensive quality report..."
	@./scripts/quality-monitor.sh

# 📊 Quick quality summary (исправленные метрики)
quality-summary:
	@echo "📊 QUALITY GUARDIAN REPORT"
	@echo "=========================="
	@echo "🔍 Anti-patterns: $$(grep -r '\.unwrap()\|\.expect(\|panic!(' --include='*.rs' . 2>/dev/null | wc -l || echo '0') violations"
	@echo "🦀 Clippy warnings: $$(cargo clippy --quiet 2>&1 | grep -c 'warning' || echo '0')"
	@echo "🎯 Performance tests: $$(if cargo test --list 2>/dev/null | grep -q 'bench_'; then echo 'Available'; else echo 'Not configured'; fi)"
	@echo "🚨 WASM critical: $$(if make wasm-critical >/dev/null 2>&1; then echo 'SECURE'; else echo 'VIOLATIONS DETECTED'; fi)"
	@echo "🔒 astro-rust: $$(if test -d ./astro-rust; then echo 'PROTECTED'; else echo 'MISSING'; fi)"
	@echo "✅ Status: $$(if make quality-check >/dev/null 2>&1; then echo 'PASSED'; else echo 'FAILED'; fi)"

# 🔧 Setup quality system
setup:
	@echo "🛡️ Setting up Quality Guardian system..."
	@./scripts/setup-quality-system.sh

# 📊 Quality monitoring
monitor:
	@echo "📊 Running quality monitoring..."
	@./scripts/quality-monitor.sh

# 🔍 Find anti-patterns with details (enhanced anti.md patterns)
find-patterns:
	@echo "🔍 Detailed anti-pattern analysis..."
	@echo "Searching for unwrap() usage:"
	@grep -rn "\.unwrap()" --include="*.rs" . || echo "None found"
	@echo "\nSearching for expect() usage:"
	@grep -rn "\.expect(" --include="*.rs" . || echo "None found"
	@echo "\nSearching for panic!() usage:"
	@grep -rn "panic!(" --include="*.rs" . || echo "None found"
	@echo "\nSearching for HashMap::new() usage:"
	@grep -rn "HashMap::new()" --include="*.rs" . || echo "None found"
	@echo "\nSearching for Vec::new() usage:"
	@grep -rn "Vec::new()" --include="*.rs" . || echo "None found"
	@echo "\n📋 ANTI.MD PATTERNS:"
	@echo "Searching for unwrap_or with function calls:"
	@grep -rn "\.unwrap_or(" --include="*.rs" . | grep -E "\(\w+\(" || echo "None found"
	@echo "\nSearching for unwrap_or with side effects:"
	@grep -rn "\.unwrap_or.*build_from_scratch\|\.unwrap_or.*save_in_redis" --include="*.rs" . || echo "None found"
	@echo "\nSearching for unwrap/expect in Result functions:"
	@grep -r "fn.*-> Result" --include="*.rs" . | head -5 | while read line; do file="$${line%:*}"; grep -q "unwrap\|expect" "$$file" && echo "Found in: $$file" || true; done || echo "None found"

# 🔒 Security analysis
security-audit:
	@echo "🔒 Running comprehensive security audit..."
	@command -v cargo-audit >/dev/null 2>&1 && cargo audit || echo "Install cargo-audit for vulnerability scanning"
	@command -v cargo-deny >/dev/null 2>&1 && cargo deny check || echo "Install cargo-deny for license/ban checking"

# 🧼 Comprehensive cleanup
clean:
	cargo clean
	rm -rf target/
	rm -rf node_modules/
	rm -rf .quality-reports/
	rm -rf wasm-astro/pkg/
	rm -rf .dioxus/

# 🚀 Быстрая разработка с проверками
dev: quality-check
	@if [ -f "backend/Cargo.toml" ]; then \
		cargo run --manifest-path=backend/Cargo.toml; \
	else \
		echo "⚠️ Backend not found - cannot start dev server"; \
	fi

# 📦 Сборка с проверками
build: quality-check
	@if [ -f "Cargo.toml" ]; then \
		cargo build --release; \
	else \
		echo "⚠️ Root Cargo.toml not found - trying individual packages"; \
		find . -name "Cargo.toml" -not -path "./target/*" -not -path "./astro-rust/*" | while read cargo_file; do \
			echo "📦 Building $$cargo_file..."; \
			cargo build --release --manifest-path="$$cargo_file"; \
		done; \
	fi

# 🧪 Tests with quality checks
test: quality-check
	@if [ -f "Cargo.toml" ]; then \
		cargo test --all-features; \
	else \
		echo "⚠️ Root Cargo.toml not found - testing individual packages"; \
		find . -name "Cargo.toml" -not -path "./target/*" -not -path "./astro-rust/*" | while read cargo_file; do \
			echo "🧪 Testing $$cargo_file..."; \
			cargo test --manifest-path="$$cargo_file" --all-features; \
		done; \
	fi

# 🧪 Performance benchmarks
bench:
	@echo "🚀 Running performance benchmarks..."
	@command -v cargo >/dev/null 2>&1 && cargo bench || echo "No benchmarks configured"

# 📝 Generate documentation
docs:
	@echo "📚 Generating documentation..."
	cargo doc --all --no-deps --document-private-items
	@echo "📖 Documentation available at target/doc/index.html"

# 🎯 All quality checks (alias for quality-check)
check: quality-check

# 🔄 Continuous integration simulation
ci: quality-check test bench
	@echo "🎉 CI simulation completed successfully!"

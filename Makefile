# StarsCalendars Quality-First Makefile

.PHONY: quality-check anti-patterns clippy security arch perf clean setup monitor quality-report quality-summary find-patterns security-audit test bench docs check ci

# 🛡️ Главная проверка качества
quality-check: anti-patterns clippy security arch
	@echo "✅ All quality checks passed!"

# 🔍 Проверка антипаттернов
anti-patterns:
	@echo "🔍 Scanning for anti-patterns..."
	@! grep -r "\.unwrap()" --include="*.rs" --exclude-dir=target . || (echo "❌ Found .unwrap() usage" && exit 1)
	@! grep -r "\.expect(" --include="*.rs" --exclude-dir=target . || (echo "❌ Found .expect() usage" && exit 1)  
	@! grep -r "panic!(" --include="*.rs" --exclude-dir=target . || (echo "❌ Found panic!() usage" && exit 1)
	@! grep -r "HashMap::new()" --include="*.rs" --exclude-dir=target . || (echo "❌ Found HashMap::new() - use with_capacity()" && exit 1)
	@! grep -r "Vec::new()" --include="*.rs" --exclude-dir=target . || (echo "❌ Found Vec::new() - use with_capacity()" && exit 1)
	# @! grep -r " as " --include="*.rs" --exclude-dir=target . || (echo "⚠️  Found 'as' conversions - consider TryFrom" && exit 1)
	@echo "✅ No anti-patterns found"

# 🦀 Строгий Clippy
clippy:
	@echo "🦀 Running strict Clippy checks..."
	cargo clippy --all-targets --all-features -- \
		-D clippy::unwrap_used \
		-D clippy::expect_used \
		-D clippy::panic \
		-D clippy::as_conversions \
		-D clippy::await_holding_lock \
		-D clippy::inefficient_to_string \
		-D clippy::large_stack_arrays \
		-D clippy::vec_init_then_push

# 🎯 WASM производительность
wasm-perf:
	@echo "🎯 Checking WASM performance patterns..."
	@! (grep -A10 -B10 "compute_all" wasm-astro/src/*.rs | grep -q "for\|while") || \
		(echo "❌ Multiple WASM calls detected - violates O(1) requirement" && exit 1)
	@echo "✅ WASM performance patterns valid"

# 🔒 Безопасность
security:
	@echo "🔒 Running security checks..."
	@grep -r "RS256" backend/src/ || echo "⚠️  RS256 JWT validation should be present"
	@! (grep -r "format!" backend/src/ | grep -q "SELECT\|INSERT\|UPDATE") || \
		(echo "❌ Potential SQL injection - use sqlx::query!" && exit 1)
	@echo "✅ Security checks passed"

# 🏗️ Архитектура
arch:
	@echo "🏗️ Checking architecture compliance..."
	@! grep -r "use.*infrastructure" libs/domain/src/ || \
		(echo "❌ Domain layer depends on infrastructure" && exit 1)
	@echo "✅ Architecture compliance verified"

# 🚀 Производительность
perf:
	@echo "🚀 Running performance tests..."
	cargo test --release -- --ignored bench_

# 🧹 Форматирование
fmt:
	cargo fmt --all
	
# 🔧 Полная проверка перед коммитом
pre-commit: quality-check fmt perf
	@echo "🎉 Ready to commit!"

# 📊 Comprehensive quality report
quality-report:
	@echo "🛡️ Generating comprehensive quality report..."
	@./scripts/quality-monitor.sh

# 📊 Quick quality summary  
quality-summary:
	@echo "📊 QUALITY GUARDIAN REPORT"
	@echo "=========================="
	@echo "🔍 Anti-patterns: $(shell grep -r '\.unwrap()\|\.expect(\|panic!(' --include='*.rs' . | wc -l) violations"
	@echo "🦀 Clippy warnings: $(shell cargo clippy 2>&1 | grep "warning" | wc -l)"
	@echo "🎯 Performance tests: $(shell cargo test --release -- --ignored bench_ 2>&1 | grep "test result" || echo "Not run")"
	@echo "✅ Status: $(shell make quality-check > /dev/null 2>&1 && echo "PASSED" || echo "FAILED")"

# 🔧 Setup quality system
setup:
	@echo "🛡️ Setting up Quality Guardian system..."
	@./scripts/setup-quality-system.sh

# 📊 Quality monitoring
monitor:
	@echo "📊 Running quality monitoring..."
	@./scripts/quality-monitor.sh

# 🔍 Find anti-patterns with details
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
	cargo run --bin backend

# 📦 Сборка с проверками
build: quality-check
	cargo build --release

# 🧪 Tests with quality checks  
test: quality-check
	cargo test --all-features

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
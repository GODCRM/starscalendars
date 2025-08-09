#!/bin/bash
# Quality monitoring script for continuous quality assessment
# Part of StarsCalendars Quality Guardian System

set -euo pipefail

# Performance timer
start_time=$(date +%s.%N)

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Quality Guardian banner
echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                  🛡️ Quality Guardian Monitor                  ║${NC}"
echo -e "${PURPLE}║              StarsCalendars Spiritual Platform              ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo

# Configuration
REPORT_DIR=".quality-reports"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
REPORT_FILE="$REPORT_DIR/quality_report_$TIMESTAMP.md"

# Create report directory
mkdir -p "$REPORT_DIR"

# Function to log with timestamp
log_info() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] INFO: $1${NC}"
}

log_success() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] SUCCESS: $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING: $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR: $1${NC}"
}

# Initialize report
cat > "$REPORT_FILE" << EOF
# 🛡️ Quality Guardian Report
**StarsCalendars Spiritual Platform**

- **Date**: $(date '+%Y-%m-%d %H:%M:%S UTC')
- **Rust Version**: $(rustc --version 2>/dev/null || echo "Not available")
- **Platform**: $(uname -s)
- **Architecture**: $(uname -m)

## Executive Summary

EOF

# Track metrics
TOTAL_ERRORS=0
TOTAL_WARNINGS=0
TOTAL_FILES_CHECKED=0

log_info "Starting comprehensive quality assessment..."

# 1. CODE QUALITY METRICS
echo "## 📊 Code Quality Metrics" >> "$REPORT_FILE"
echo >> "$REPORT_FILE"

log_info "Analyzing codebase structure..."

# Count Rust files
RUST_FILES=$(find . -name "*.rs" -not -path "./target/*" -not -path "./astro-rust/*" -not -path "./frontend/ref/*" | wc -l | tr -d ' ')
TOTAL_FILES_CHECKED=$RUST_FILES

echo "- **Rust Files**: $RUST_FILES" >> "$REPORT_FILE"

# Count lines of code
if command -v tokei >/dev/null 2>&1; then
    log_info "Generating code statistics with tokei..."
    tokei --output json > "$REPORT_DIR/tokei_$TIMESTAMP.json" 2>/dev/null || true

    if [ -f "$REPORT_DIR/tokei_$TIMESTAMP.json" ]; then
        TOTAL_LINES=$(jq -r '.Total.code' "$REPORT_DIR/tokei_$TIMESTAMP.json" 2>/dev/null || echo "N/A")
        echo "- **Lines of Code**: $TOTAL_LINES" >> "$REPORT_FILE"
    fi
else
    log_warning "tokei not installed - install with 'cargo install tokei' for detailed code metrics"
    TOTAL_LINES=$(find . -name "*.rs" -not -path "./target/*" -not -path "./astro-rust/*" -not -path "./frontend/ref/*" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}' || echo "N/A")
    echo "- **Lines of Code (estimated)**: $TOTAL_LINES" >> "$REPORT_FILE"
fi

# 2. ANTI-PATTERN DETECTION
echo >> "$REPORT_FILE"
echo "## 🚨 Anti-Pattern Detection" >> "$REPORT_FILE"
echo >> "$REPORT_FILE"

log_info "Scanning for anti-patterns..."

# Critical anti-patterns
declare -A ANTI_PATTERNS=(
    ["unwrap()"]="Critical: Use Result<T, E> with proper error handling"
    ["expect("]="Critical: Use Result<T, E> with custom error types"
    ["panic!("]="Critical: Use Result<T, E> - never panic in production"
    ["HashMap::new()"]="Performance: Use HashMap::with_capacity(n)"
    ["Vec::new()"]="Performance: Use Vec::with_capacity(n)"
    ["todo!()"]="Development: Complete implementation"
    ["unimplemented!()"]="Development: Complete implementation"
)

PATTERN_VIOLATIONS=0

for pattern in "${!ANTI_PATTERNS[@]}"; do
    violations=$(find . -name "*.rs" -not -path "./target/*" -not -path "./astro-rust/*" -not -path "./frontend/ref/*" -exec grep -l "$pattern" {} \; 2>/dev/null | wc -l | tr -d ' ')

    if [ "$violations" -gt 0 ]; then
        echo "- ❌ **$pattern**: $violations files (${ANTI_PATTERNS[$pattern]})" >> "$REPORT_FILE"
        PATTERN_VIOLATIONS=$((PATTERN_VIOLATIONS + violations))

        if [[ "$pattern" == *"unwrap()"* ]] || [[ "$pattern" == *"expect("* ]] || [[ "$pattern" == *"panic!("* ]]; then
            TOTAL_ERRORS=$((TOTAL_ERRORS + violations))
        else
            TOTAL_WARNINGS=$((TOTAL_WARNINGS + violations))
        fi
    else
        echo "- ✅ **$pattern**: Clean" >> "$REPORT_FILE"
    fi
done

if [ $PATTERN_VIOLATIONS -eq 0 ]; then
    log_success "No anti-patterns detected!"
    echo >> "$REPORT_FILE"
    echo "🎉 **All anti-pattern checks passed!**" >> "$REPORT_FILE"
else
    log_warning "Found $PATTERN_VIOLATIONS anti-pattern violations"
fi

# 3. CLIPPY ANALYSIS
echo >> "$REPORT_FILE"
echo "## 🦀 Clippy Analysis" >> "$REPORT_FILE"
echo >> "$REPORT_FILE"

log_info "Running Clippy analysis..."

if cargo clippy --workspace --exclude astro-rust --all-targets --all-features -- -D warnings 2>/dev/null; then
    log_success "Clippy analysis passed"
    echo "✅ **Clippy Analysis**: All checks passed" >> "$REPORT_FILE"
else
    log_warning "Clippy warnings or errors detected"
    echo "⚠️ **Clippy Analysis**: Issues detected - run 'cargo clippy' for details" >> "$REPORT_FILE"
    TOTAL_WARNINGS=$((TOTAL_WARNINGS + 1))
fi

# 4. SECURITY AUDIT
echo >> "$REPORT_FILE"
echo "## 🔒 Security Audit" >> "$REPORT_FILE"
echo >> "$REPORT_FILE"

log_info "Running security audit..."

# Cargo audit (if available)
if command -v cargo-audit >/dev/null 2>&1; then
    if cargo audit --json > "$REPORT_DIR/audit_$TIMESTAMP.json" 2>/dev/null; then
        log_success "Security audit passed"
        echo "✅ **Cargo Audit**: No known vulnerabilities" >> "$REPORT_FILE"
    else
        log_error "Security vulnerabilities detected"
        echo "❌ **Cargo Audit**: Vulnerabilities detected - see audit report" >> "$REPORT_FILE"
        TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
    fi
else
    log_warning "cargo-audit not installed - install with 'cargo install cargo-audit'"
    echo "⚠️ **Cargo Audit**: Not available (install cargo-audit)" >> "$REPORT_FILE"
fi

# Cargo deny (if available)
if command -v cargo-deny >/dev/null 2>&1; then
    if cargo deny check > "$REPORT_DIR/deny_$TIMESTAMP.log" 2>&1; then
        log_success "Cargo deny checks passed"
        echo "✅ **Cargo Deny**: All checks passed" >> "$REPORT_FILE"
    else
        log_warning "Cargo deny issues detected"
        echo "⚠️ **Cargo Deny**: Issues detected - see deny report" >> "$REPORT_FILE"
        TOTAL_WARNINGS=$((TOTAL_WARNINGS + 1))
    fi
else
    log_warning "cargo-deny not installed - install with 'cargo install cargo-deny'"
    echo "⚠️ **Cargo Deny**: Not available (install cargo-deny)" >> "$REPORT_FILE"
fi

# 5. PERFORMANCE ANALYSIS
echo >> "$REPORT_FILE"
echo "## 🚀 Performance Analysis" >> "$REPORT_FILE"
echo >> "$REPORT_FILE"

log_info "Analyzing performance patterns..."

# WASM performance check
if [ -d "wasm-astro" ]; then
    log_info "Checking WASM performance patterns..."

    # Check for O(1) hot path compliance
    wasm_violations=$(grep -r -A10 -B10 "compute_state" wasm-astro/src/ 2>/dev/null | grep -c "for\|while\|loop" || echo "0")

    if [ "$wasm_violations" -eq 0 ]; then
        echo "✅ **WASM Performance**: O(1) hot path compliance verified" >> "$REPORT_FILE"
        log_success "WASM performance patterns validated"
    else
        echo "❌ **WASM Performance**: $wasm_violations potential O(1) violations" >> "$REPORT_FILE"
        log_error "WASM performance violations detected"
        TOTAL_ERRORS=$((TOTAL_ERRORS + wasm_violations))
    fi
else
    echo "⚠️ **WASM Performance**: WASM module not found" >> "$REPORT_FILE"
fi

# Check for async performance issues
async_violations=$(grep -r -B3 -A3 "for\|while\|loop" . --include="*.rs" --exclude-dir=target --exclude-dir=astro-rust --exclude-dir=frontend/ref | grep -c "\.await" || echo "0")
if [ "$async_violations" -gt 0 ]; then
    echo "⚠️ **Async Performance**: $async_violations potential blocking operations in loops" >> "$REPORT_FILE"
    log_warning "Async performance issues detected"
    TOTAL_WARNINGS=$((TOTAL_WARNINGS + async_violations))
else
    echo "✅ **Async Performance**: No blocking operations in loops detected" >> "$REPORT_FILE"
fi

# 6. ARCHITECTURE COMPLIANCE
echo >> "$REPORT_FILE"
echo "## 🏗️ Architecture Compliance" >> "$REPORT_FILE"
echo >> "$REPORT_FILE"

log_info "Validating Clean Architecture compliance..."

ARCH_VIOLATIONS=0

# Check domain layer dependencies
if [ -d "libs/domain" ]; then
    domain_violations=$(find libs/domain -name "*.rs" -exec grep -l "use.*infrastructure\|use.*app" {} \; 2>/dev/null | wc -l | tr -d ' ')

    if [ "$domain_violations" -eq 0 ]; then
        echo "✅ **Domain Layer**: Clean dependency structure" >> "$REPORT_FILE"
    else
        echo "❌ **Domain Layer**: $domain_violations dependency violations" >> "$REPORT_FILE"
        ARCH_VIOLATIONS=$((ARCH_VIOLATIONS + domain_violations))
    fi
else
    echo "⚠️ **Domain Layer**: Not found (expected Clean Architecture structure)" >> "$REPORT_FILE"
fi

# Check application layer dependencies
if [ -d "libs/app" ]; then
    app_violations=$(find libs/app -name "*.rs" -exec grep -l "use.*postgres\|use.*sqlx::Pool\|use.*reqwest" {} \; 2>/dev/null | wc -l | tr -d ' ')

    if [ "$app_violations" -eq 0 ]; then
        echo "✅ **Application Layer**: Proper abstraction usage" >> "$REPORT_FILE"
    else
        echo "❌ **Application Layer**: $app_violations direct external service usage" >> "$REPORT_FILE"
        ARCH_VIOLATIONS=$((ARCH_VIOLATIONS + app_violations))
    fi
else
    echo "⚠️ **Application Layer**: Not found (expected Clean Architecture structure)" >> "$REPORT_FILE"
fi

if [ $ARCH_VIOLATIONS -gt 0 ]; then
    TOTAL_ERRORS=$((TOTAL_ERRORS + ARCH_VIOLATIONS))
    log_error "Architecture violations detected"
else
    log_success "Architecture compliance validated"
fi

# 7. DOCUMENTATION QUALITY
echo >> "$REPORT_FILE"
echo "## 📚 Documentation Quality" >> "$REPORT_FILE"
echo >> "$REPORT_FILE"

log_info "Assessing documentation quality..."

# Check critical documentation files
DOC_SCORE=0
TOTAL_DOC_FILES=4

critical_docs=("README.md" "CLAUDE.md" "QUALITY.md" "Cargo.toml")

for doc in "${critical_docs[@]}"; do
    if [ -f "$doc" ]; then
        echo "✅ **$doc**: Present" >> "$REPORT_FILE"
        DOC_SCORE=$((DOC_SCORE + 1))
    else
        echo "❌ **$doc**: Missing" >> "$REPORT_FILE"
        TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
    fi
done

# Documentation coverage score
DOC_COVERAGE=$((DOC_SCORE * 100 / TOTAL_DOC_FILES))
echo >> "$REPORT_FILE"
echo "**Documentation Coverage**: $DOC_COVERAGE% ($DOC_SCORE/$TOTAL_DOC_FILES files)" >> "$REPORT_FILE"

# 8. FINAL SUMMARY
echo >> "$REPORT_FILE"
echo "## 📈 Quality Summary" >> "$REPORT_FILE"
echo >> "$REPORT_FILE"

# Calculate end time
end_time=$(date +%s.%N)
duration=$(echo "$end_time - $start_time" | bc -l)

# Overall quality score calculation
TOTAL_ISSUES=$((TOTAL_ERRORS + TOTAL_WARNINGS))
if [ $TOTAL_ERRORS -eq 0 ] && [ $TOTAL_WARNINGS -eq 0 ]; then
    QUALITY_STATUS="🎉 EXCELLENT"
    QUALITY_GRADE="A+"
elif [ $TOTAL_ERRORS -eq 0 ] && [ $TOTAL_WARNINGS -lt 5 ]; then
    QUALITY_STATUS="✅ GOOD"
    QUALITY_GRADE="A"
elif [ $TOTAL_ERRORS -eq 0 ]; then
    QUALITY_STATUS="⚠️ ACCEPTABLE"
    QUALITY_GRADE="B"
elif [ $TOTAL_ERRORS -lt 5 ]; then
    QUALITY_STATUS="⚡ NEEDS IMPROVEMENT"
    QUALITY_GRADE="C"
else
    QUALITY_STATUS="❌ CRITICAL ISSUES"
    QUALITY_GRADE="F"
fi

cat >> "$REPORT_FILE" << EOF
| Metric | Value |
|--------|-------|
| **Overall Grade** | $QUALITY_GRADE |
| **Status** | $QUALITY_STATUS |
| **Total Errors** | $TOTAL_ERRORS |
| **Total Warnings** | $TOTAL_WARNINGS |
| **Files Checked** | $TOTAL_FILES_CHECKED |
| **Scan Duration** | $(printf "%.2f" $duration)s |
| **Documentation Coverage** | $DOC_COVERAGE% |

### Quality Gates
- **Anti-Pattern Free**: $([ $PATTERN_VIOLATIONS -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Security Compliant**: $([ $TOTAL_ERRORS -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Architecture Clean**: $([ $ARCH_VIOLATIONS -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Performance Optimized**: $([ $async_violations -eq 0 ] && echo "✅ PASSED" || echo "⚠️ REVIEW")

### Recommendations
EOF

# Add recommendations based on findings
if [ $TOTAL_ERRORS -gt 0 ]; then
    echo "- 🔴 **Critical**: Fix all error-level issues before production deployment" >> "$REPORT_FILE"
fi

if [ $PATTERN_VIOLATIONS -gt 0 ]; then
    echo "- 🔧 **Code Quality**: Replace all anti-patterns with production-grade alternatives" >> "$REPORT_FILE"
fi

if [ $TOTAL_WARNINGS -gt 0 ]; then
    echo "- ⚠️ **Improvement**: Address warnings to achieve production excellence" >> "$REPORT_FILE"
fi

if [ $DOC_COVERAGE -lt 100 ]; then
    echo "- 📚 **Documentation**: Complete missing documentation files" >> "$REPORT_FILE"
fi

echo "- 🚀 **Continuous**: Run quality checks before every commit with 'make pre-commit'" >> "$REPORT_FILE"

echo >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "*Generated by Quality Guardian - StarsCalendars Spiritual Platform*" >> "$REPORT_FILE"
echo "*Quality is our spiritual practice in code*" >> "$REPORT_FILE"

# Console summary
echo
echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                    📊 QUALITY SUMMARY                        ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo
echo -e "🎯 **Overall Grade**: $QUALITY_GRADE ($QUALITY_STATUS)"
echo -e "📁 **Files Checked**: $TOTAL_FILES_CHECKED"
echo -e "❌ **Errors**: $TOTAL_ERRORS"
echo -e "⚠️  **Warnings**: $TOTAL_WARNINGS"
echo -e "⏱️  **Duration**: $(printf "%.2f" $duration)s"
echo -e "📋 **Report**: $REPORT_FILE"
echo

if [ $TOTAL_ERRORS -eq 0 ]; then
    log_success "Quality Guardian assessment completed - no critical issues!"
    echo -e "${GREEN}🙏 Code quality reflects our spiritual commitment to excellence${NC}"
    exit 0
else
    log_error "Quality Guardian detected $TOTAL_ERRORS critical issues"
    echo -e "${RED}🔧 Address all critical issues before proceeding${NC}"
    exit 1
fi

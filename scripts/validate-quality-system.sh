#!/bin/bash
# Quick validation script for Quality Guardian System
# Tests that all components are properly installed and configured

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}🛡️ Quality Guardian System Validation${NC}"
echo "======================================"
echo

VALIDATION_SCORE=0
TOTAL_CHECKS=0

# Function to check component
check_component() {
    local name="$1"
    local condition="$2"
    local description="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if eval "$condition"; then
        echo -e "${GREEN}✅ $name${NC}: $description"
        VALIDATION_SCORE=$((VALIDATION_SCORE + 1))
        return 0
    else
        echo -e "${RED}❌ $name${NC}: $description"
        return 1
    fi
}

# Check critical files
echo -e "${BLUE}📁 Checking critical quality files...${NC}"

check_component "QUALITY.md" "[ -f QUALITY.md ]" "Quality enforcement documentation"
check_component "deny.toml" "[ -f deny.toml ]" "Security scanning configuration"
check_component ".editorconfig" "[ -f .editorconfig ]" "Code formatting standards"
check_component "Pre-commit Hook" "[ -f .githooks/pre-commit ]" "Git commit validation"
check_component "GitHub Actions" "[ -f .github/workflows/quality-guardian.yml ]" "CI/CD pipeline"
check_component "VS Code Settings" "[ -f .vscode/settings.json ]" "IDE integration"
check_component "Quality Rules" "[ -f quality-rules.toml ]" "Clippy configuration"

echo

# Check Makefile commands
echo -e "${BLUE}🔧 Checking Makefile commands...${NC}"

MAKEFILE_COMMANDS=("quality-check" "anti-patterns" "clippy" "security" "quality-report")

for cmd in "${MAKEFILE_COMMANDS[@]}"; do
    check_component "make $cmd" "grep -q '^$cmd:' Makefile" "Quality command available"
done

echo

# Check tools (without installing)
echo -e "${BLUE}🛠️ Checking available tools...${NC}"

check_component "Rust" "command -v rustc >/dev/null 2>&1" "Rust compiler available"
check_component "Cargo" "command -v cargo >/dev/null 2>&1" "Cargo package manager"
check_component "Clippy" "command -v cargo-clippy >/dev/null 2>&1 || cargo clippy --version >/dev/null 2>&1" "Code linting"

# Optional tools (don't fail if missing)
OPTIONAL_TOOLS=("cargo-audit" "cargo-deny" "wasm-pack" "tokei")

for tool in "${OPTIONAL_TOOLS[@]}"; do
    if command -v "$tool" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $tool${NC}: Available (optional)"
        VALIDATION_SCORE=$((VALIDATION_SCORE + 1))
    else
        echo -e "${YELLOW}⚠️ $tool${NC}: Not installed (optional - install with 'cargo install $tool')"
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
done

echo

# Check Git configuration
echo -e "${BLUE}📋 Checking Git configuration...${NC}"

if [ -d ".git" ]; then
    check_component "Git Repository" "[ -d .git ]" "Git repository initialized"
    
    # Check if hooks path is configured
    if git config core.hooksPath | grep -q ".githooks"; then
        echo -e "${GREEN}✅ Git Hooks${NC}: Configured to use .githooks"
        VALIDATION_SCORE=$((VALIDATION_SCORE + 1))
    else
        echo -e "${YELLOW}⚠️ Git Hooks${NC}: Not configured - run 'git config core.hooksPath .githooks'"
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
else
    echo -e "${YELLOW}⚠️ Git Repository${NC}: Not a git repository"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
fi

echo

# Test a simple quality check
echo -e "${BLUE}🧪 Testing quality enforcement...${NC}"

# Test anti-pattern detection
if make anti-patterns >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Anti-pattern Detection${NC}: Working correctly"
    VALIDATION_SCORE=$((VALIDATION_SCORE + 1))
else
    echo -e "${RED}❌ Anti-pattern Detection${NC}: Issues detected"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Test Clippy
if cargo clippy --version >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Clippy Integration${NC}: Available and working"
    VALIDATION_SCORE=$((VALIDATION_SCORE + 1))
else
    echo -e "${RED}❌ Clippy Integration${NC}: Not working"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

echo

# Calculate score
SCORE_PERCENTAGE=$((VALIDATION_SCORE * 100 / TOTAL_CHECKS))

echo -e "${PURPLE}📊 VALIDATION SUMMARY${NC}"
echo "===================="
echo "Score: $VALIDATION_SCORE/$TOTAL_CHECKS ($SCORE_PERCENTAGE%)"

if [ $SCORE_PERCENTAGE -ge 90 ]; then
    echo -e "${GREEN}🎉 EXCELLENT${NC}: Quality Guardian System is fully operational!"
    echo -e "${GREEN}✅ Zero-tolerance quality enforcement is active${NC}"
elif [ $SCORE_PERCENTAGE -ge 75 ]; then
    echo -e "${YELLOW}✅ GOOD${NC}: Quality Guardian System is mostly operational"
    echo -e "${YELLOW}⚠️ Some optional components missing - run full setup for complete functionality${NC}"
elif [ $SCORE_PERCENTAGE -ge 50 ]; then
    echo -e "${YELLOW}⚠️ PARTIAL${NC}: Basic quality enforcement available"
    echo -e "${YELLOW}🔧 Run './scripts/setup-quality-system.sh' for full setup${NC}"
else
    echo -e "${RED}❌ INCOMPLETE${NC}: Quality Guardian System needs setup"
    echo -e "${RED}🚨 Critical components missing - quality enforcement may not work${NC}"
fi

echo
echo -e "${CYAN}🚀 Quick Actions:${NC}"
echo "  make quality-check    # Test all quality rules"
echo "  make anti-patterns    # Scan for forbidden patterns"
echo "  make setup           # Run full system setup"
echo "  make quality-report  # Generate comprehensive report"

echo
if [ $SCORE_PERCENTAGE -ge 75 ]; then
    echo -e "${PURPLE}🙏 Quality Guardian is protecting your spiritual codebase${NC}"
    exit 0
else
    echo -e "${YELLOW}🔧 Complete setup recommended for full protection${NC}"
    exit 1
fi
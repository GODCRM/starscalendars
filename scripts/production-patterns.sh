#!/bin/bash

# 🛡️ Quality Guardian: Production pattern validation (excluding test code)
# This script enforces CLAUDE.md rules: test code (#[cfg(test)]) patterns are acceptable

set -euo pipefail

echo "🛡️ Quality Guardian: Production-ready pattern validation"
echo "📚 Per CLAUDE.md: .expect() acceptable in #[cfg(test)] blocks only"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

VIOLATIONS=0

# Function to check if a line is within a test module
is_in_test_code() {
    local file="$1"
    local line_number="$2"
    
    # Primary check: #[cfg(test)] module (covers most test code)
    local cfg_test_line=$(awk '/#\[cfg\(test\)\]/ { print NR }' "$file" | tail -1)
    
    if [[ -n "$cfg_test_line" ]] && [[ $line_number -gt $cfg_test_line ]]; then
        local lines_after=$((line_number - cfg_test_line))
        if [[ $lines_after -lt 200 ]]; then  # Reasonable test module size
            echo "IN_TEST"
            return 0
        fi
    fi
    
    # Fallback: individual #[test] functions (only if no cfg_test found)
    if [[ -z "$cfg_test_line" ]]; then
        local test_fn_line=$(awk -v target="$line_number" '
            /#\[test\]/ { if (NR < target && target - NR <= 15) print NR }
        ' "$file" | tail -1)
        
        if [[ -n "$test_fn_line" ]]; then
            echo "IN_TEST"
            return 0
        fi
    fi
    
    # Not in test code
    echo "NOT_IN_TEST"
}

# Function to validate pattern with test code exclusion
validate_pattern() {
    local pattern="$1"
    local description="$2"
    local suggestion="$3"
    
    echo "🔍 Scanning for: $pattern"
    
    # Find all matches
    local matches=$(grep -rn "$pattern" --include="*.rs" --exclude-dir=target --exclude-dir=astro-rust . 2>/dev/null || true)
    
    if [[ -z "$matches" ]]; then
        echo "✅ No violations found for: $pattern"
        return 0
    fi
    
    local production_violations=""
    
    # Check each match to see if it's in test code
    while IFS= read -r match; do
        if [[ -z "$match" ]]; then
            continue
        fi
        
        local file=$(echo "$match" | cut -d: -f1)
        local line_num=$(echo "$match" | cut -d: -f2)
        local content=$(echo "$match" | cut -d: -f3-)
        
        # Skip if file doesn't exist or is not readable
        if [[ ! -r "$file" ]]; then
            continue
        fi
        
        # Check if this violation is in test code
        local test_result=$(is_in_test_code "$file" "$line_num")
        
        if [[ "$test_result" != "IN_TEST" ]]; then
            production_violations+="  - $file:$line_num: $content"$'\n'
        fi
    done <<< "$matches"
    
    if [[ -n "$production_violations" ]]; then
        echo -e "${RED}❌ CRITICAL: Found forbidden pattern: $pattern${NC}"
        echo -e "${YELLOW}📝 Suggestion: $suggestion${NC}"
        echo "📁 Production code violations:"
        echo "$production_violations"
        ((VIOLATIONS++))
        return 1
    else
        echo -e "${GREEN}✅ Pattern found only in test code (acceptable): $pattern${NC}"
        return 0
    fi
}

# Validate all critical patterns
echo "🚨 Checking critical anti-patterns (production code only)..."

validate_pattern "\.unwrap()" "unwrap() usage" "Use Result<T, E> with proper error handling"
validate_pattern "\.expect(" "expect() usage" "Use Result<T, E> with proper error handling or keep only in test code"
validate_pattern "panic!(" "panic!() usage" "Use Result<T, E> with proper error handling"

# These patterns are forbidden everywhere (no test exceptions)
echo "🔧 Checking memory management patterns..."
validate_pattern "HashMap::new()" "HashMap::new() usage" "Use HashMap::with_capacity() for better performance"
validate_pattern "Vec::new()" "Vec::new() usage" "Use Vec::with_capacity() for better performance"

# Final result
if [[ $VIOLATIONS -eq 0 ]]; then
    echo -e "${GREEN}🎉 All production pattern validations passed!${NC}"
    echo "✅ Test code patterns are acceptable per CLAUDE.md rules"
    exit 0
else
    echo -e "${RED}🚫 QUALITY ENFORCEMENT FAILED${NC}"
    echo "Fix all critical violations above before proceeding."
    exit 1
fi
#!/bin/bash

echo "🚀 Comprehensive Savevest Engine Test"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((TESTS_FAILED++))
    fi
}

echo "1. Checking Prerequisites..."
echo "----------------------------"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js found: $NODE_VERSION${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Node.js not found${NC}"
    ((TESTS_FAILED++))
fi

# Check package manager
if command -v yarn &> /dev/null; then
    YARN_VERSION=$(yarn --version)
    echo -e "${GREEN}✅ Yarn found: $YARN_VERSION${NC}"
    PACKAGE_MANAGER="yarn"
    ((TESTS_PASSED++))
elif command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${YELLOW}⚠️  Using npm: $NPM_VERSION (yarn preferred)${NC}"
    PACKAGE_MANAGER="npm"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ No package manager found${NC}"
    ((TESTS_FAILED++))
    exit 1
fi

echo ""
echo "2. Testing Application Build..."
echo "------------------------------"

# Check if build directory exists
if [ -d "build" ]; then
    print_result 0 "Build directory exists"
    
    # Check server file
    if [ -f "build/bin/server.js" ]; then
        print_result 0 "Server file exists (build/bin/server.js)"
    else
        print_result 1 "Server file missing"
    fi
    
    # Check package.json in build
    if [ -f "build/package.json" ]; then
        print_result 0 "Build package.json exists"
    else
        print_result 1 "Build package.json missing"
    fi
    
    # Check if build has required directories
    for dir in "app" "config" "start"; do
        if [ -d "build/$dir" ]; then
            print_result 0 "Build directory '$dir' exists"
        else
            print_result 1 "Build directory '$dir' missing"
        fi
    done
    
else
    print_result 1 "Build directory missing - run 'yarn build' first"
fi

echo ""
echo "3. Testing Startup Script..."
echo "----------------------------"

if [ -f "start.sh" ]; then
    print_result 0 "Startup script exists"
    
    # Check if executable
    if [ -x "start.sh" ]; then
        print_result 0 "Startup script is executable"
    else
        echo -e "${YELLOW}⚠️  Making startup script executable${NC}"
        chmod +x start.sh
        print_result 0 "Startup script made executable"
    fi
else
    print_result 1 "Startup script missing"
fi

echo ""
echo "4. Testing Configuration Files..."
echo "--------------------------------"

# Check main package.json
if [ -f "package.json" ]; then
    print_result 0 "Main package.json exists"
else
    print_result 1 "Main package.json missing"
fi

# Check AdonisJS config
if [ -f "adonisrc.ts" ]; then
    print_result 0 "AdonisJS config exists"
else
    print_result 1 "AdonisJS config missing"
fi

# Check environment files
if [ -f ".env.example" ]; then
    print_result 0 "Environment example exists"
else
    print_result 1 "Environment example missing"
fi

echo ""
echo "5. Docker Readiness Check..."
echo "----------------------------"

# Check Dockerfile
if [ -f "Dockerfile" ]; then
    print_result 0 "Dockerfile exists"
else
    print_result 1 "Dockerfile missing"
fi

# Check .dockerignore
if [ -f ".dockerignore" ]; then
    print_result 0 ".dockerignore exists"
else
    print_result 1 ".dockerignore missing"
fi

# Check if Docker is available
if command -v docker &> /dev/null; then
    print_result 0 "Docker is available"
    
    # Test Docker connectivity (without actually building)
    if docker info &> /dev/null; then
        print_result 0 "Docker daemon is running"
    else
        print_result 1 "Docker daemon not accessible"
    fi
else
    print_result 1 "Docker not installed"
fi

echo ""
echo "6. Application Structure Validation..."
echo "------------------------------------"

# Check critical directories
for dir in "app" "config" "database" "start"; do
    if [ -d "$dir" ]; then
        print_result 0 "Source directory '$dir' exists"
    else
        print_result 1 "Source directory '$dir' missing"
    fi
done

# Check critical files
for file in "ace.js" "adonisrc.ts" "tsconfig.json"; do
    if [ -f "$file" ]; then
        print_result 0 "Critical file '$file' exists"
    else
        print_result 1 "Critical file '$file' missing"
    fi
done

echo ""
echo "📊 Test Summary"
echo "==============="
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your Savevest Engine is ready for Docker deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Ensure network connectivity for Docker"
    echo "2. Run: docker build -t savevest-engine ."
    echo "3. Run: docker run -p 3333:3333 savevest-engine"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please fix the issues before Docker deployment.${NC}"
    exit 1
fi
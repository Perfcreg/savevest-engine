#!/bin/bash

echo "Testing Savevest Engine locally..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed"
    exit 1
fi

echo "Node.js version: $(node --version)"

# Check if yarn is available
if ! command -v yarn &> /dev/null; then
    echo "Yarn is not installed, trying with npm..."
    
    # Try with npm
    if ! command -v npm &> /dev/null; then
        echo "Neither yarn nor npm is available"
        exit 1
    fi
    
    echo "Installing dependencies with npm..."
    npm install --legacy-peer-deps
    
    echo "Building application..."
    npm run build
    
    echo "Testing if build was successful..."
    if [ -d "build" ]; then
        echo "✅ Build successful! Build directory created."
        echo "Files in build directory:"
        ls -la build/
        
        if [ -f "build/bin/server.js" ]; then
            echo "✅ Server file exists at build/bin/server.js"
            echo "🎉 Application is ready to run!"
        else
            echo "❌ Server file not found in build/bin/"
            exit 1
        fi
    else
        echo "❌ Build failed - no build directory found"
        exit 1
    fi
else
    echo "Yarn version: $(yarn --version)"
    
    echo "Installing dependencies with yarn..."
    yarn install
    
    echo "Building application..."
    yarn build
    
    echo "Testing if build was successful..."
    if [ -d "build" ]; then
        echo "✅ Build successful! Build directory created."
        echo "Files in build directory:"
        ls -la build/
        
        if [ -f "build/bin/server.js" ]; then
            echo "✅ Server file exists at build/bin/server.js"
            echo "🎉 Application is ready to run!"
        else
            echo "❌ Server file not found in build/bin/"
            exit 1
        fi
    else
        echo "❌ Build failed - no build directory found"
        exit 1
    fi
fi

echo "Local test completed successfully!"
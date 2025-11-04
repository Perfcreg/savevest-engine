#!/bin/sh
set -e

echo "Starting Savevest Backend..."
echo "Node version: $(node --version)"
echo "Working directory: $(pwd)"
echo "Files in build/bin: $(ls -la build/bin/ || echo 'build/bin not found')"

# Check if build directory exists
if [ ! -d "build" ]; then
    echo "Build directory not found, running build..."
    npm run build
fi

# Start the application
echo "Starting server..."
exec node build/bin/server.js
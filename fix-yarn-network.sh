#!/bin/bash

echo "🔧 Fixing Yarn Network Issues"

# 1. Change DNS to Google DNS temporarily
echo "Setting DNS to Google DNS..."
sudo networksetup -setdnsservers Wi-Fi 8.8.8.8 8.8.4.4

# 2. Flush DNS cache
echo "Flushing DNS cache..."
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# 3. Configure yarn to use different registry
echo "Configuring yarn registry..."
yarn config set registry https://registry.npmjs.org/
yarn config set network-timeout 300000

# 4. Test connectivity
echo "Testing yarn connectivity..."
yarn info react

echo "✅ Network fix applied!"
echo "To restore original DNS later, run:"
echo "sudo networksetup -setdnsservers Wi-Fi Empty"
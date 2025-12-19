#!/bin/bash

# TCP Chat Application - Stop All Services

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Stopping TCP Chat services...${NC}"

# Stop ngrok
if pgrep -x "ngrok" > /dev/null; then
    echo "Stopping ngrok..."
    pkill -x ngrok 2>/dev/null || true
fi

# Stop WebSocket proxy (Node.js on port 3000)
echo "Stopping WebSocket proxy..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Stop C server (port 8888)
echo "Stopping C server..."
lsof -ti:8888 | xargs kill -9 2>/dev/null || true

# Also kill by process name
pkill -f "node.*websocket-proxy" 2>/dev/null || true
pkill -f "./server" 2>/dev/null || true
pkill -f "./bin/server" 2>/dev/null || true

echo -e "${GREEN}All services stopped.${NC}"

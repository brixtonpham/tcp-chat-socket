#!/bin/bash

# TCP Chat Application - Full Stack Startup Script
# Starts: C Server, WebSocket Proxy, and optionally ngrok

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
C_SERVER_DIR="$PROJECT_DIR"
WS_PROXY_DIR="$PROJECT_DIR/websocket-proxy"
WEB_CLIENT_DIR="$PROJECT_DIR/web-client"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# PIDs for cleanup
C_SERVER_PID=""
WS_PROXY_PID=""
NGROK_PID=""

cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"

    if [ -n "$NGROK_PID" ] && kill -0 "$NGROK_PID" 2>/dev/null; then
        echo "Stopping ngrok..."
        kill "$NGROK_PID" 2>/dev/null || true
    fi

    if [ -n "$WS_PROXY_PID" ] && kill -0 "$WS_PROXY_PID" 2>/dev/null; then
        echo "Stopping WebSocket proxy..."
        kill "$WS_PROXY_PID" 2>/dev/null || true
    fi

    if [ -n "$C_SERVER_PID" ] && kill -0 "$C_SERVER_PID" 2>/dev/null; then
        echo "Stopping C server..."
        kill "$C_SERVER_PID" 2>/dev/null || true
    fi

    # Kill any remaining processes on the ports
    lsof -ti:8888 | xargs kill -9 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true

    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

print_banner() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║         TCP Chat Application - Full Stack                 ║"
    echo "║         Network Programming Demo                          ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_dependencies() {
    echo -e "${YELLOW}Checking dependencies...${NC}"

    # Check for C compiler
    if ! command -v gcc &> /dev/null; then
        echo -e "${RED}Error: gcc not found. Please install GCC.${NC}"
        exit 1
    fi

    # Check for Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: node not found. Please install Node.js.${NC}"
        exit 1
    fi

    # Check for npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}Error: npm not found. Please install npm.${NC}"
        exit 1
    fi

    echo -e "${GREEN}All dependencies found.${NC}"
}

build_c_server() {
    echo -e "\n${YELLOW}Building C server...${NC}"
    cd "$C_SERVER_DIR"

    if [ -f "Makefile" ]; then
        make clean 2>/dev/null || true
        make
    else
        # Compile manually if no Makefile
        gcc -o server src/*.c -lpthread 2>/dev/null || \
        gcc -o bin/server src/*.c -lpthread
    fi

    echo -e "${GREEN}C server built successfully.${NC}"
}

build_web_client() {
    echo -e "\n${YELLOW}Building web client...${NC}"
    cd "$WEB_CLIENT_DIR"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing web client dependencies..."
        npm install
    fi

    # Build for production
    npm run build

    echo -e "${GREEN}Web client built successfully.${NC}"
}

setup_ws_proxy() {
    echo -e "\n${YELLOW}Setting up WebSocket proxy...${NC}"
    cd "$WS_PROXY_DIR"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing WebSocket proxy dependencies..."
        npm install
    fi

    # Build TypeScript
    npm run build

    echo -e "${GREEN}WebSocket proxy ready.${NC}"
}

start_c_server() {
    echo -e "\n${YELLOW}Starting C server on port 8888...${NC}"
    cd "$C_SERVER_DIR"

    # Find the server binary
    if [ -f "./server" ]; then
        ./server &
    elif [ -f "./bin/server" ]; then
        ./bin/server &
    else
        echo -e "${RED}Error: C server binary not found.${NC}"
        exit 1
    fi

    C_SERVER_PID=$!
    sleep 2

    if kill -0 "$C_SERVER_PID" 2>/dev/null; then
        echo -e "${GREEN}C server started (PID: $C_SERVER_PID)${NC}"
    else
        echo -e "${RED}Error: C server failed to start.${NC}"
        exit 1
    fi
}

start_ws_proxy() {
    echo -e "\n${YELLOW}Starting WebSocket proxy on port 3000...${NC}"
    cd "$WS_PROXY_DIR"

    npm start &
    WS_PROXY_PID=$!
    sleep 3

    if kill -0 "$WS_PROXY_PID" 2>/dev/null; then
        echo -e "${GREEN}WebSocket proxy started (PID: $WS_PROXY_PID)${NC}"
    else
        echo -e "${RED}Error: WebSocket proxy failed to start.${NC}"
        exit 1
    fi
}

start_ngrok() {
    if command -v ngrok &> /dev/null; then
        echo -e "\n${YELLOW}Starting ngrok tunnel...${NC}"

        # Check if ngrok is already running
        if pgrep -x "ngrok" > /dev/null; then
            echo -e "${YELLOW}ngrok is already running. Getting URL...${NC}"
            sleep 2
        else
            ngrok http 3000 --log=stdout > /tmp/ngrok.log 2>&1 &
            NGROK_PID=$!
            sleep 5
        fi

        # Get the public URL
        NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)

        if [ -n "$NGROK_URL" ]; then
            echo -e "${GREEN}ngrok tunnel active${NC}"
            echo -e "${BLUE}Public URL: $NGROK_URL${NC}"
        else
            echo -e "${YELLOW}ngrok URL not available. Check http://127.0.0.1:4040${NC}"
        fi
    else
        echo -e "${YELLOW}ngrok not installed. Skipping public URL.${NC}"
    fi
}

print_status() {
    echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}   All services are running!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "   ${BLUE}C Server:${NC}        http://localhost:8888 (TCP)"
    echo -e "   ${BLUE}WebSocket Proxy:${NC} http://localhost:3000"
    echo -e "   ${BLUE}Web Client:${NC}      http://localhost:3000"

    if [ -n "$NGROK_URL" ]; then
        echo -e "   ${BLUE}Public URL:${NC}      $NGROK_URL"
    fi

    echo ""
    echo -e "${YELLOW}   Press Ctrl+C to stop all services${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
}

# Main execution
main() {
    print_banner
    check_dependencies

    # Parse arguments
    SKIP_BUILD=false
    ENABLE_NGROK=true  # Enabled by default for public access

    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-build|-s)
                SKIP_BUILD=true
                shift
                ;;
            --ngrok|-n)
                ENABLE_NGROK=true
                shift
                ;;
            --no-ngrok)
                ENABLE_NGROK=false
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  -s, --skip-build  Skip building (use existing builds)"
                echo "  -n, --ngrok       Enable ngrok for public access (default)"
                echo "  --no-ngrok        Disable ngrok (local only)"
                echo "  -h, --help        Show this help message"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Build if needed
    if [ "$SKIP_BUILD" = false ]; then
        build_c_server
        build_web_client
        setup_ws_proxy
    fi

    # Start services
    start_c_server
    start_ws_proxy

    # Start ngrok if requested
    if [ "$ENABLE_NGROK" = true ]; then
        start_ngrok
    fi

    print_status

    # Keep script running
    while true; do
        sleep 1
    done
}

main "$@"

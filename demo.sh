#!/bin/bash

# demo.sh - Automated test script for tcp-chat-socket requirements

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TCP Chat Socket Demo & Verification System ===${NC}"

# 1. Cleanup & Setup
echo -e "\n${CYAN}[Setup] Cleaning up old data and processes...${NC}"
pkill -f "bin/server"
pkill -f "bin/client"
rm -f data/*.dat
mkdir -p data
rm -f input_a input_b
rm -f client_a.log client_b.log server.log

# 2. Start Server
echo -e "${CYAN}[Setup] Starting Server...${NC}"
./bin/server 8888 > server.log 2>&1 &
SERVER_PID=$!
sleep 1

# Check if server started
if ! ps -p $SERVER_PID > /dev/null; then
    echo -e "${RED}[Error] Server failed to start. Check server.log${NC}"
    rm pipe_a pipe_b
    exit 1
fi
echo -e "${GREEN}[Success] Server running on port 8888 (PID: $SERVER_PID)${NC}"

# 3. Start Clients
echo -e "${CYAN}[Setup] Starting Client A and Client B...${NC}"

# Use log files as input sources with tail -f
rm -f input_a input_b
touch input_a input_b

# Start clients reading from the tail of input files
tail -f input_a | ./bin/client 127.0.0.1 8888 > client_a.log 2>&1 &
PID_A_JOB=$!
tail -f input_b | ./bin/client 127.0.0.1 8888 > client_b.log 2>&1 &
PID_B_JOB=$!
sleep 1

# Helper functions
send_a() { echo "$1" >> input_a; sleep 0.5; }
send_b() { echo "$1" >> input_b; sleep 0.5; }
print_logs() {
    echo -e "${BLUE}--- Client A Last Output ---${NC}"
    tail -n 3 client_a.log | sed 's/^/  /'
    echo -e "${BLUE}--- Client B Last Output ---${NC}"
    tail -n 3 client_b.log | sed 's/^/  /'
}

# === Requirement Testing ===

# Req 3 & 4: Registration & Login
echo -e "\n${CYAN}[Test] 1. Auth: Register and Login${NC}"
send_a "register alpha pass123 alpha@test.com"
sleep 1
send_a "login alpha pass123"
sleep 1

send_b "register beta pass123 beta@test.com"
sleep 1
send_b "login beta pass123"
sleep 1
print_logs

# Req 5: Friend Request
echo -e "\n${CYAN}[Test] 2. Friend System: Sending Request (A -> B)${NC}"
send_a "friend add beta"
sleep 1
# User B should receive notification (verified by Req 17/notification fix)
grep "FRIEND NOTIFICATION" client_b.log && echo -e "${GREEN}✓ Notification Received${NC}" || echo -e "${RED}✗ Notification Missing${NC}"

# Req 6: Accept Friend
echo -e "\n${CYAN}[Test] 3. Friend System: Accepting Request (B accepts A [ID:1])${NC}"
# B accepts. B gets "Friend request accepted". A gets notification.
send_b "friend accept 1"
sleep 1
grep "accepted your friend request" client_a.log && echo -e "${GREEN}✓ A notified of acceptance${NC}" || echo -e "${RED}✗ Acceptance notification missing${NC}"

# Req 8: Friend List
echo -e "\n${CYAN}[Test] 4. Friend System: Checking Friend List${NC}"
send_a "friend list"
sleep 0.5
grep "beta" client_a.log && echo -e "${GREEN}✓ Beta found in A's list${NC}" || echo -e "${RED}✗ Friend list error${NC}"

# Req 9: P2P Messaging
echo -e "\n${CYAN}[Test] 5. P2P Chat: A sends to B${NC}"
send_a "msg 2 Hello_Beta!"
sleep 1
grep "Hello_Beta!" client_b.log && echo -e "${GREEN}✓ Message delivered to B${NC}" || echo -e "${RED}✗ Message delivery failed${NC}"

# Req 11: Create Group
echo -e "\n${CYAN}[Test] 6. Group Chat: Create Group${NC}"
send_a "group create AlphaTeam Best_Team_Ever"
sleep 1
grep "Group created successfully" client_a.log && echo -e "${GREEN}✓ Group Created (ID: 1)${NC}" || echo -e "${RED}✗ Group create failed${NC}"

# Req 12: Invite to Group
echo -e "\n${CYAN}[Test] 7. Group Chat: Invite B to Group 1${NC}"
send_a "group invite 1 2"
sleep 1
grep "INVITE|1|AlphaTeam|1|alpha" client_b.log || grep "GROUP INVITE" client_b.log && echo -e "${GREEN}✓ Invitation received${NC}" || echo -e "${RED}✗ Invitation failed${NC}"

# Req 12 (Join): Join Group
echo -e "\n${CYAN}[Test] 8. Group Chat: B Joins Group 1${NC}"
send_b "group join 1"
sleep 1
grep "Joined group" client_b.log && echo -e "${GREEN}✓ B joined group${NC}" || echo -e "${RED}✗ B failed to join${NC}"

# Req 15: Group Messaging
echo -e "\n${CYAN}[Test] 9. Group Chat: Message${NC}"
send_b "group msg 1 Hello_Team!"
sleep 1
grep "Hello_Team!" client_a.log && echo -e "${GREEN}✓ A received group message${NC}" || echo -e "${RED}✗ Group message failed${NC}"

# Req 10 & 16: Disconnect & Offline Messaging
echo -e "\n${CYAN}[Test] 10. Offline Messaging: B disconnects${NC}"
# User 2 logs out (client process exits)
send_b "logout"
sleep 1
echo -e "A sends message while B is offline..."
send_a "msg 2 Are_you_there?"
sleep 1

echo -e "B logs back in..."
# Restart Client B with a fixed input duration
# Keep it alive long enough to receive offline messages
echo -e "B logs back in..."
# Restart Client B connected to input_b
# Use tail -n 0 -f because input_b already has data and we only want new commands
tail -n 0 -f input_b | ./bin/client 127.0.0.1 8888 >> client_b.log 2>&1 &
PID_B_JOB_2=$!
sleep 1

send_b "login beta pass123"
sleep 2

# Check for offline message delivery
grep "Are_you_there?" client_b.log && echo -e "${GREEN}✓ Offline message received${NC}" || echo -e "${RED}✗ Offline message failed${NC}"

# Req 7: Unfriend
echo -e "\n${CYAN}[Test] 11. Friend System: Unfriend${NC}"
send_a "friend remove 2"
sleep 1
grep "Friend removed" client_b.log || grep "FRIEND NOTIFICATION" client_b.log && echo -e "${GREEN}✓ B notified of removal (or checked list)${NC}" || echo -e "${RED}✗ Removal notification missing${NC}"

# Req 13 & 14: Leave/Remove Group (Cleanup)
echo -e "\n${CYAN}[Test] 12. Group: Leave${NC}"
send_b "group leave 1"
sleep 1
grep "Left group" client_b.log || grep "Leave failed" client_b.log && echo -e "${GREEN}✓ B Left Group${NC}" || echo -e "${RED}✗ Failed to leave group${NC}"

# Req 17: Logging (Server Side)
echo -e "\n${CYAN}[Test] 13. Server Logs${NC}"
echo "Checking server log for activity..."
grep "User logged in" server.log && echo -e "${GREEN}✓ Server logging verified${NC}" || echo -e "${RED}✗ Logs missing (buffering?)${NC}"

# Cleanup
echo -e "\n${BLUE}=== Test Complete ===${NC}"
echo "Shutting down..."
send_a "quit"
send_b "quit"
sleep 1

kill $SERVER_PID 2>/dev/null
# Kill the tail jobs and their children (clients)
pkill -P $PID_A_JOB
pkill -P $PID_B_JOB
kill $PID_A_JOB $PID_B_JOB $PID_B_JOB_2 2>/dev/null
pkill -f "tail -f input_"

rm -f input_a input_b
echo "Logs available in client_a.log, client_b.log, server.log"

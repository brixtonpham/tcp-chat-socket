# Web Client User & Developer Guide

A comprehensive guide to the TCP Chat Application web client - a modern React-based UI with real-time protocol visualization through the Server Logs Panel.

## Table of Contents

1. [Quick Start](#quick-start)
2. [User Guide](#user-guide)
3. [UI Layout & Components](#ui-layout--components)
4. [Features](#features)
5. [Server Logs Panel (Educational Tool)](#server-logs-panel-educational-tool)
6. [Developer Guide](#developer-guide)
7. [Architecture](#architecture)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Running TCP chat server (`./bin/server`)
- WebSocket proxy server running (`npm start` in websocket-proxy directory)

### Starting the Web Client

```bash
cd web-client
npm install          # First time only
npm run dev          # Start development server
```

Then open your browser to `http://localhost:5173/`

**Note**: Ensure all three components are running:
1. **Terminal 1**: C TCP server (`./bin/server`)
2. **Terminal 2**: WebSocket proxy (`cd websocket-proxy && npm start`)
3. **Terminal 3**: React web client (`cd web-client && npm run dev`)

---

## User Guide

### Getting Started

#### 1. Registration

1. Open `http://localhost:5173/`
2. Click "Create Account"
3. Enter:
   - **Username**: 4-20 characters (alphanumeric)
   - **Email**: Valid email address
   - **Password**: 8+ characters, mix of upper/lowercase
4. Click "Create Account"

#### 2. Login

1. Enter your username and password
2. Click "Login"
3. Check "Remember me" to auto-login next time (stored in localStorage)

### Main Interface Overview

The web client uses a 4-panel layout optimized for chat applications:

```
┌────────────────────────────────────────────────────────────────┐
│ HEADER: Logo | Status | Theme | User Menu                      │
├─────────┬────────────────────────────────┬──────────┬──────────┤
│  NAV    │         CHAT AREA              │ CONTEXT  │ SERVER   │
│ SIDEBAR │                                │  PANEL   │  LOGS    │
│         │                                │          │ PANEL    │
│ Friends │  Chat Header + Message List    │          │          │
│ Groups  │  Message Input                 │          │          │
│ Online  │                                │          │          │
└─────────┴────────────────────────────────┴──────────┴──────────┘
```

### Friend Management

#### Add a Friend

1. In left sidebar, click **Friends** tab
2. Click the **+ Add Friend** button (envelope icon)
3. Enter friend's username
4. Click "Send Request"

#### Accept/Reject Friend Requests

1. Look for incoming requests in the **context panel** (right side)
2. Click **Accept** to confirm or **Reject** to decline
3. Accepted friends appear in your Friends list

#### View Online Status

- **Green dot (●)** = Friend is online
- **Gray dot (○)** = Friend is offline
- Click any friend to open chat

### Sending Messages

#### Direct Message (One-on-One)

1. Click on a friend's name in the Friends list
2. Type your message in the input box at the bottom
3. Press **Enter** or click the **Send** button
4. Message appears with:
   - ○ = Sending
   - ✓ = Delivered
   - ✓✓ = Read by recipient

#### Multi-line Messages

- Press **Shift+Enter** to create a new line
- Press **Enter** alone to send

### Group Chat

#### Create a Group

1. Click **Groups** tab in left sidebar
2. Click **+ Create Group** button
3. Enter group name
4. Click "Create"

#### Invite Members to Group

1. Click on group name
2. Click **+ Add Members** in context panel
3. Select friends to invite
4. Click "Invite"

#### Send Group Message

1. Click on group name
2. Type message in input
3. Press Enter
4. Message is delivered to all group members

#### Leave a Group

1. Click on group name
2. In context panel, click **Leave Group**
3. Confirm to leave

### Broadcast Messages

Send a message to all online users:

1. Click **Online Users** tab
2. Type message in the broadcast input
3. Click "Broadcast"
4. All online users receive your message

### Theme & Settings

#### Toggle Light/Dark Mode

1. Click the **sun/moon icon** in the header (top-right)
2. Theme preference is automatically saved to localStorage

#### User Menu

1. Click on your **username** in header
2. Options:
   - **Profile**: View your information
   - **Settings**: Change preferences
   - **Logout**: Exit the application

---

## UI Layout & Components

### Header (64px)

| Component | Purpose |
|-----------|---------|
| **Logo** | TCP Chat branding, clickable to refresh |
| **Status Indicator** | Shows connection status (●Connected/●Connecting/●Disconnected) |
| **Online Count** | Displays number of users currently online |
| **Theme Toggle** | Switch between light and dark modes |
| **User Menu** | Username dropdown with settings/logout |
| **Logs Toggle** | Document icon to show/hide Server Logs Panel |

### Navigation Sidebar (280px)

#### Tabs

1. **Friends Tab**
   - List of accepted friends with online status
   - Search box to filter friends
   - Friend request badge with count
   - Pending requests expandable section
   - Last message preview with timestamp

2. **Groups Tab**
   - List of groups you're a member of
   - Search box to filter groups
   - Group member count
   - Last message preview
   - "Discover Groups" section to find public groups

3. **Online Users Tab**
   - Complete list of currently online users
   - User count (e.g., "24 online")
   - Search to find specific users
   - Quick add friend button on each user

### Chat Area (Flexible Width)

#### Chat Header

- **Recipient/Group Name** with status indicator
- **Back button** (on mobile/tablet)
- **Settings menu** (⋮) with options to:
  - View profile
  - Mute notifications
  - Clear chat history
  - Block/Unblock user
  - Report

#### Message List

- Scrollable history of all messages
- **Sent messages** (right-aligned, blue bubble)
- **Received messages** (left-aligned, gray bubble)
- **Timestamps** on each message
- **Delivery status** icons (✓, ✓✓)
- **Typing indicators** ("Alice is typing...")
- Auto-scroll to latest messages

#### Message Input

- Multi-line text area
- **File attachment** button (📎)
- **Emoji picker** button (😊)
- **Send** button or press Enter
- Character count (if needed)
- Placeholder text: "Type your message..."

### Context Panel (320px)

**Dynamic content based on current view:**

#### Friend Chat Context

- **Friend Requests** section
  - Incoming requests with action buttons
  - Show count of pending requests

- **Friend Profile**
  - Avatar and username
  - Online status
  - Member since date
  - Shared groups
  - Mute/Block options

#### Group Chat Context

- **Group Info**
  - Group name and description
  - Created by and date
  - Member count

- **Members List**
  - All group members
  - Admin badge if applicable
  - Add more members button

- **Group Actions**
  - Mute notifications
  - Leave group
  - Report group

### Server Logs Panel (400px, Collapsible)

The most important educational feature. See [Server Logs Panel](#server-logs-panel-educational-tool) section below for detailed documentation.

---

## Features

### Real-time Messaging

- **Instant delivery** via WebSocket
- **Offline queuing** - messages delivered when recipient comes online
- **Delivery status** - see when messages are sent, delivered, read
- **Typing indicators** - know when someone is composing a message

### Status Management

- **Online/offline status** - automatically updated
- **Last seen** - timestamp of when user was last online
- **Typing status** - "User is typing..." indicators

### Notifications

- **Toast notifications** for:
  - New friend requests
  - Incoming messages
  - Group invitations
  - Connection status changes
- Non-intrusive, auto-dismiss after 3 seconds
- Click to dismiss or scroll to view again

### Search & Filter

- **Friend search** - find friends by username
- **Group search** - find groups by name
- **Message search** - full-text search in chat history
- **Server logs search** - find specific protocol messages

### Responsive Design

**Desktop (1440px+)**:
- Full 4-panel layout
- All features visible simultaneously

**Tablet (768px - 1439px)**:
- Navigation sidebar becomes drawer
- Context panel becomes drawer
- Full-width chat area

**Mobile (320px - 767px)**:
- Single column layout
- Bottom navigation bar with tabs
- Drawers for navigation and context
- Optimized touch interface

---

## Server Logs Panel (Educational Tool)

The Server Logs Panel is the **centerpiece of the educational UI redesign**. It provides transparent, real-time visualization of all protocol messages between client and server.

### Purpose

Learn how network communication works by observing:
- Every message sent and received
- Protocol structure and message types
- Request/response patterns
- Network latency metrics
- Error handling and recovery

### Accessing the Panel

1. Click the **document icon** in the header (top-right)
2. Panel slides in from the right side
3. Click again to hide the panel
4. On mobile, panel appears as a full-screen modal

### Reading the Logs

Each log entry shows:

```
[MessageType] ⏰ Timestamp
← Request / → Response
Direction: From → To
Latency: XXms

{
  "type": "MSG_TYPE",
  "data": { ... }
}
```

#### Understanding Each Entry

- **Message Type** (color-coded badge)
  - Example: "MSG_LOGIN" (green for authentication)

- **Timestamp** (⏰ format HH:mm:ss.SSS)
  - Exact time message was sent/received

- **Direction**
  - ← Request (client to server)
  - → Response (server to client)

- **Latency** (in milliseconds)
  - How long the operation took
  - Color-coded: Green (<100ms), Yellow (100-500ms), Red (>500ms)

- **JSON Payload**
  - Full message content
  - Click arrow to expand/collapse

### Color Coding System

| Color | Category | Message Types |
|-------|----------|---|
| Green | Authentication | MSG_LOGIN, MSG_REGISTER, MSG_LOGOUT |
| Orange | Friend Operations | MSG_FRIEND_REQUEST, MSG_FRIEND_ACCEPT, MSG_FRIEND_REJECT |
| Blue | Messaging | MSG_CHAT, MSG_GROUP_CHAT, MSG_BROADCAST |
| Purple | Group Operations | MSG_GROUP_CREATE, MSG_GROUP_JOIN, MSG_GROUP_LEAVE |
| Cyan | Status Updates | MSG_ONLINE_USERS, MSG_USER_STATUS |
| Red | Errors | MSG_ERROR, error responses |
| Gray | System | Connection, disconnection, heartbeat |

### Features

#### Filtering Logs

1. Click **filter icon** to open filter panel
2. Uncheck categories to hide specific message types
3. Multiple filters can be active simultaneously
4. Clear filters to show all messages again

#### Searching Logs

1. Type in the **search box**
2. Logs matching the search term are highlighted
3. Non-matching logs are dimmed
4. Search is case-insensitive
5. Searches across message type, direction, and payload

#### Pause/Resume

1. Click **pause button** (⏸️) to freeze the log stream
2. New logs stop appearing
3. Useful for inspecting specific messages
4. Click **play button** (▶️) to resume
5. Resumes at latest logs (auto-scroll enabled)

#### Expandable Entries

1. Click the **arrow icon** on any log entry
2. Full JSON payload expands
3. Syntax highlighting shows structure
4. Click again to collapse

#### Copy to Clipboard

1. Click **copy button** (📋) on any log entry
2. Entire log entry copied to clipboard
3. Useful for sharing logs or documentation

#### Export Logs

1. Click **export button** in filter panel
2. Choose format:
   - **JSON**: Structured data for parsing
   - **TXT**: Human-readable format
3. File downloads with timestamp
4. Filename: `chat-logs-YYYY-MM-DD-HH-mm-ss.json`

#### Auto-scroll

- **Enabled by default**: Always shows latest logs
- **Disabled when scrolling up**: Lets you inspect older logs
- **Re-enable**: Scroll to bottom or click auto-scroll toggle

### Example Usage

**Scenario: Debugging a failed login**

1. Open Server Logs Panel
2. Attempt to login with wrong password
3. Find the MSG_LOGIN entry in the logs
4. Click to expand and see the request payload
5. See the MSG_LOGIN_ACK response
6. Check the error field to understand the failure
7. Latency metric shows how long the server took to respond
8. Export logs for documentation

**Scenario: Understanding message routing**

1. Send a direct message to a friend
2. Watch logs as they appear in real-time:
   - MSG_CHAT_SEND (your message going up)
   - MSG_CHAT_DELIVER (message arriving at server)
   - MSG_CHAT_DELIVER (message delivered to recipient)
3. Observe the latency metrics
4. Filter to show only "Messaging" category
5. See the full message payload structure

---

## Developer Guide

### Project Structure

```
web-client/
├── src/
│   ├── api/                    # WebSocket client
│   │   └── websocket.ts        # WebSocket client with logging
│   │
│   ├── components/             # React components
│   │   ├── Auth/              # Login/Register
│   │   ├── Chat/              # Chat interface
│   │   ├── Friends/           # Friend management
│   │   ├── Groups/            # Group management
│   │   ├── Layout/            # Header, Sidebar, Layout
│   │   ├── Logs/              # Server Logs Panel (NEW!)
│   │   │   ├── ServerLogsPanel.tsx
│   │   │   ├── LogEntry.tsx
│   │   │   ├── LogFilters.tsx
│   │   │   └── index.ts
│   │   └── Common/            # Reusable components
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts         # Authentication
│   │   ├── useChat.ts         # Chat functionality
│   │   ├── useFriends.ts      # Friend management
│   │   ├── useGroups.ts       # Group management
│   │   └── useLogs.ts         # Logs panel (NEW!)
│   │
│   ├── store/                  # Zustand state stores
│   │   ├── authStore.ts       # Auth state
│   │   ├── chatStore.ts       # Chat state
│   │   ├── friendsStore.ts    # Friends state
│   │   ├── groupsStore.ts     # Groups state
│   │   └── logsStore.ts       # Logs state (NEW!)
│   │
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts           # All type definitions
│   │
│   ├── utils/                  # Utility functions
│   │   ├── formatters.ts      # Date/time formatting
│   │   ├── validators.ts      # Input validation
│   │   └── colors.ts          # Color utilities
│   │
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
│
├── docs/                       # Documentation
│   ├── UI_REDESIGN_PLAN.md    # Design specification
│   ├── SERVER_LOGS_FEATURE.md # Logs panel docs
│   └── IMPLEMENTATION_SUMMARY.md
│
├── public/                     # Static assets
├── dist/                       # Production build
├── package.json                # Dependencies
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind CSS config
└── tsconfig.json               # TypeScript config
```

### Key Technologies

- **React 19** - UI framework with latest hooks
- **TypeScript** - Full type safety
- **shadcn/ui** - Component library built on Tailwind CSS
- **Zustand** - Lightweight state management
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tool
- **WebSocket** - Real-time communication

### UI Component Library (shadcn/ui)

The web client uses **shadcn/ui**, a curated collection of accessible, customizable React components built on Tailwind CSS.

**Available Components:**
- **Buttons & Controls** - Button, IconButton with variants (default, outline, ghost, destructive)
- **Forms** - Input, Textarea, Label, Select
- **Layout** - Card, Separator, ScrollArea, Tabs
- **Dialogs & Overlays** - Dialog, AlertDialog, Tooltip
- **Feedback** - Badge, Avatar, AvatarFallback
- **Navigation** - DropdownMenu, Tabs

**Usage:**
```typescript
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Use shadcn components in your JSX
<Card>
  <CardHeader>
    <h1>Example</h1>
  </CardHeader>
  <CardContent>
    <Input placeholder="Type something..." />
    <Button>Submit</Button>
  </CardContent>
</Card>
```

**Path Alias:**
All shadcn components are imported using the `@/` path alias for cleaner imports:
```typescript
// Good - uses @ alias
import { Button } from "@/components/ui/button"

// Avoid - relative paths
import { Button } from "../../../components/ui/button"
```

**Component Location:**
- shadcn components: `src/components/ui/`
- Feature components: `src/components/Auth/`, `src/components/Chat/`, etc.
- Custom components (Logs Panel): `src/components/Logs/`

**Styling:**
- All components use Tailwind CSS classes
- CSS variables defined in `src/index.css` for theming
- Dark mode support built-in (toggle in header)

### Development Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Run linter
npm run lint

# Build and preview
npm run build && npm run preview
```

### State Management (Zustand)

Each domain has its own store:

```typescript
// logsStore.ts example
interface LogsState {
  logs: ServerLog[];
  filters: LogFilters;
  isPaused: boolean;
  isVisible: boolean;
  maxLogs: number;

  // Actions
  addLog: (log: ServerLog) => void;
  clearLogs: () => void;
  toggleFilter: (category: LogCategory) => void;
  exportLogs: (format: 'json' | 'txt') => void;
}
```

Access stores in components:

```typescript
import { useLogsStore } from './store/logsStore';

export function ServerLogsPanel() {
  const { logs, filters, addLog, clearLogs } = useLogsStore();
  // Use store state and actions
}
```

### Custom Hooks

Create reusable logic with custom hooks:

```typescript
// hooks/useLogs.ts
export function useLogs() {
  const { logs, filters, isPaused } = useLogsStore();

  // Derived state
  const filteredLogs = useMemo(() => {
    return logs.filter(log => filters[log.category]);
  }, [logs, filters]);

  return { logs: filteredLogs, isPaused };
}
```

### Adding New Features

#### 1. Add TypeScript Type

```typescript
// types/index.ts
export interface MyNewFeature {
  id: string;
  name: string;
  // ...
}
```

#### 2. Create Zustand Store

```typescript
// store/myStore.ts
import { create } from 'zustand';

interface MyState {
  items: MyNewFeature[];
  addItem: (item: MyNewFeature) => void;
}

export const useMyStore = create<MyState>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  }))
}));
```

#### 3. Create Component

```typescript
// components/MyFeature/MyFeature.tsx
import { useMyStore } from '@/store/myStore';

export function MyFeature() {
  const { items, addItem } = useMyStore();

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

#### 4. Use Component

```typescript
// App.tsx
import { MyFeature } from './components/MyFeature/MyFeature';

export default function App() {
  return <MyFeature />;
}
```

---

## Architecture

### Component Hierarchy

```
App
├── AuthLayout (routes to Login/Register if not authenticated)
├── MainLayout
│   ├── Header
│   │   ├── Logo
│   │   ├── ConnectionStatus
│   │   ├── ThemeToggle
│   │   └── UserMenu
│   ├── Body
│   │   ├── Sidebar
│   │   │   ├── FriendsTab
│   │   │   ├── GroupsTab
│   │   │   └── OnlineUsersTab
│   │   ├── ChatArea
│   │   │   ├── ChatHeader
│   │   │   ├── MessageList
│   │   │   └── MessageInput
│   │   ├── ContextPanel
│   │   │   ├── FriendRequests
│   │   │   ├── FriendProfile
│   │   │   ├── GroupInfo
│   │   │   └── MembersList
│   │   └── ServerLogsPanel (NEW!)
│   │       ├── LogHeader
│   │       ├── LogList
│   │       ├── LogFilters
│   │       └── LogExport
```

### Data Flow

```
User Action (button click, message send)
    ↓
React Component Handler
    ↓
WebSocket Client (websocket.ts)
    ↓
Message logged to Logs Store (logsStore.ts)
    ↓
Message sent to server via WebSocket
    ↓
Server processes and responds
    ↓
WebSocket receives response
    ↓
Response logged to Logs Store
    ↓
Response handled by appropriate store (authStore, chatStore, etc.)
    ↓
Components re-render with updated state
    ↓
Server Logs Panel displays new log entries
```

### State Management Flow

```
Server Response
    ↓
logsStore.addLog(logEntry)  // Educational visibility
    ↓
chatStore.addMessage()       // Application logic
friendsStore.updateStatus()  // or other domain stores
    ↓
Components subscribe to changes
    ↓
Re-render with new data
```

---

## Troubleshooting

### Common Issues

#### "Connection Failed" Error

**Problem**: Web client can't connect to WebSocket proxy

**Solutions**:
1. Verify proxy is running: `ps aux | grep node`
2. Check proxy is on correct port: `netstat -tulpn | grep 3000`
3. Verify TCP server is running: `ps aux | grep bin/server`
4. Check firewall isn't blocking connections

**Fix**:
```bash
# Terminal 1
./bin/server

# Terminal 2
cd websocket-proxy && npm start

# Terminal 3
cd web-client && npm run dev
```

#### White/Blank Screen

**Problem**: Page loads but shows nothing

**Solutions**:
1. Check browser console for errors (F12)
2. Clear browser cache and reload
3. Verify dependencies installed: `npm install`

**Fix**:
```bash
cd web-client
rm -rf node_modules
npm install
npm run dev
```

#### Server Logs Panel Not Showing

**Problem**: Logs panel doesn't appear or is empty

**Solutions**:
1. Click document icon in header to toggle panel
2. Verify WebSocket is connected
3. Try performing an action (login, send message)
4. Check if logs are paused (click play button)

**Fix**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Check Network tab for WebSocket connection

#### Build Errors

**Problem**: `npm run build` fails

**Solutions**:
1. Check Node.js version: `node --version` (should be 18+)
2. Clear cache and reinstall: `npm ci`
3. Check for TypeScript errors: `npm run lint`

**Fix**:
```bash
cd web-client
npm ci
npm run build
```

### Performance Issues

**Slow logs panel with many entries**:
- Logs panel retains maximum 500 entries
- Older logs are automatically discarded
- Performance should be smooth even with 500+ logs
- If slow, try exporting logs and clearing them

**Memory usage increasing**:
- Check if many large message payloads
- Close browser DevTools if open (uses memory)
- Consider reducing max logs in logsStore.ts

---

## Resources

- [Web Client README](/web-client/README.md) - Setup and configuration
- [Server Logs Feature Docs](/web-client/docs/SERVER_LOGS_FEATURE.md) - Detailed logs panel guide
- [UI Redesign Plan](/web-client/docs/UI_REDESIGN_PLAN.md) - Complete design specification
- [TCP Chat Docs](/docs/README.md) - Overall project documentation
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**Version**: 1.0.0
**Last Updated**: December 19, 2025
**Status**: Production Ready

For questions or issues, refer to the main project documentation or check the browser console for error messages.

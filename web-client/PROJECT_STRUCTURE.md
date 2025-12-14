# TCP Chat Web Client - Project Structure

## Overview

This is a production-ready React web client for the TCP Chat application, built with modern tools and best practices.

## File Structure

```
web-client/
├── dist/                         # Production build output
├── node_modules/                 # Dependencies
├── public/                       # Public assets
├── src/
│   ├── api/
│   │   └── websocket.ts         # WebSocket client implementation
│   │
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.tsx        # Login form component
│   │   │   └── Register.tsx     # Registration form component
│   │   │
│   │   ├── Chat/
│   │   │   ├── ChatWindow.tsx   # Main chat interface
│   │   │   ├── MessageInput.tsx # Message input field
│   │   │   └── MessageList.tsx  # Message list display
│   │   │
│   │   ├── Common/
│   │   │   └── StatusIndicator.tsx # Online/offline status indicator
│   │   │
│   │   ├── Friends/
│   │   │   ├── AddFriend.tsx    # Add friend dialog
│   │   │   ├── FriendList.tsx   # Friends list display
│   │   │   └── FriendRequest.tsx # Friend request management
│   │   │
│   │   ├── Groups/
│   │   │   ├── CreateGroup.tsx  # Group creation dialog
│   │   │   ├── GroupChat.tsx    # Group chat interface
│   │   │   └── GroupList.tsx    # Groups list display
│   │   │
│   │   └── Layout/
│   │       ├── Header.tsx       # Top navigation header
│   │       └── Sidebar.tsx      # Left sidebar navigation
│   │
│   ├── hooks/
│   │   ├── useAuth.ts           # Authentication hook
│   │   ├── useChat.ts           # Chat functionality hook
│   │   ├── useGroups.ts         # Group management hook
│   │   └── useWebSocket.ts      # WebSocket connection hook
│   │
│   ├── store/
│   │   ├── authStore.ts         # Authentication state
│   │   ├── friendsStore.ts      # Friends state
│   │   ├── groupsStore.ts       # Groups state
│   │   ├── messagesStore.ts     # Messages state
│   │   └── uiStore.ts           # UI preferences (theme, etc.)
│   │
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   │
│   ├── utils/
│   │   └── cn.ts                # Utility for className merging
│   │
│   ├── App.tsx                  # Main application component
│   ├── index.css                # Global styles
│   └── main.tsx                 # Application entry point
│
├── index.html                   # HTML entry point
├── package.json                 # Dependencies and scripts
├── postcss.config.js            # PostCSS configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.app.json            # TypeScript app configuration
├── tsconfig.json                # Base TypeScript configuration
├── tsconfig.node.json           # TypeScript Node configuration
├── vite.config.ts               # Vite build configuration
├── README.md                    # User documentation
└── PROJECT_STRUCTURE.md         # This file
```

## Key Files Explained

### API Layer
- **websocket.ts**: Singleton WebSocket client with auto-reconnect, message handling, and connection management

### Stores (Zustand)
- **authStore.ts**: User authentication state with localStorage persistence
- **friendsStore.ts**: Friends list and pending requests state
- **messagesStore.ts**: Message history organized by conversation
- **groupsStore.ts**: Group chats and messages
- **uiStore.ts**: UI preferences (theme, sidebar state)

### Hooks
- **useWebSocket.ts**: WebSocket connection management
- **useAuth.ts**: Login, register, logout functionality
- **useChat.ts**: Friend messaging and friend requests
- **useGroups.ts**: Group creation and group messaging

### Types
- **index.ts**: Complete TypeScript definitions matching the C server protocol
  - Message types constants
  - User, Friend, Group interfaces
  - Message payload interfaces
  - WebSocket message structure

## Component Hierarchy

```
App
├── Login/Register (unauthenticated)
└── Main Layout (authenticated)
    ├── Header
    │   ├── App title
    │   ├── Connection status
    │   ├── User info
    │   ├── Theme toggle
    │   └── Logout button
    │
    ├── Sidebar
    │   ├── Tab navigation (Friends/Groups)
    │   ├── FriendList
    │   ├── FriendRequest
    │   ├── AddFriend
    │   ├── GroupList
    │   └── CreateGroup
    │
    └── Chat Area
        ├── View toggle (Friend Chat/Group Chat)
        ├── ChatWindow (for friends)
        │   ├── Chat header
        │   ├── MessageList
        │   └── MessageInput
        │
        └── GroupChat (for groups)
            ├── Group header
            ├── Message list
            └── MessageInput
```

## State Flow

```
User Action
    ↓
Component calls hook
    ↓
Hook calls WebSocket send()
    ↓
Server processes and responds
    ↓
WebSocket onMessage handler
    ↓
Hook updates Zustand store
    ↓
Components re-render with new data
```

## Message Flow Example

### Login Flow
1. User enters credentials in Login component
2. `useAuth.login()` sends MSG_LOGIN via WebSocket
3. Server validates and sends MSG_LOGIN_ACK
4. `useAuth` hook receives response
5. On success: Updates authStore with user data
6. App component detects authentication change
7. Renders main application layout

### Send Message Flow
1. User types message in MessageInput
2. Clicks send button
3. `useChat.sendMessage()` called
4. Message added to local store (optimistic update)
5. MSG_CHAT_SEND sent via WebSocket
6. Server delivers to recipient
7. Recipient's client receives MSG_CHAT_DELIVER
8. Message added to recipient's conversation

## Build Process

```bash
# Development
npm run dev          # Starts Vite dev server at localhost:5173

# Production
npm run build        # Compiles TypeScript, then builds with Vite
npm run preview      # Preview production build locally

# Linting
npm run lint         # Run ESLint
```

## Technologies Used

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI framework |
| TypeScript | ~5.9.3 | Type safety |
| Vite | 7.2.4 | Build tool |
| Zustand | 5.0.9 | State management |
| Tailwind CSS | 4.1.18 | Styling |
| React Hot Toast | 2.6.0 | Notifications |

## Features Implemented

### Authentication
- [x] Login with username/password
- [x] Registration with username/email/password
- [x] Session persistence in localStorage
- [x] Auto-reconnect on page reload
- [x] Logout functionality

### Friends
- [x] View friends list with online/offline status
- [x] Send friend requests by username
- [x] Accept/reject friend requests
- [x] Real-time status updates
- [x] Friend notifications

### Messaging
- [x] One-on-one chat with friends
- [x] Message history per conversation
- [x] Timestamps on messages
- [x] Message status indicators
- [x] Real-time message delivery
- [x] Toast notifications for new messages

### Groups
- [x] Create groups with multiple friends
- [x] Group chat functionality
- [x] Member list display
- [x] Multiple group support
- [x] Group message notifications

### UI/UX
- [x] Dark/light theme toggle
- [x] Theme persistence
- [x] Responsive design
- [x] Custom scrollbars
- [x] Loading states
- [x] Error handling
- [x] Connection status indicator
- [x] Smooth animations

## Configuration

### WebSocket URL
Location: `/src/api/websocket.ts`
```typescript
const wsClient = new WebSocketClient('ws://localhost:3000');
```

### Theme
Default: Dark mode
Location: `/src/store/uiStore.ts`

### Auto-reconnect
Interval: 3000ms
Location: `/src/api/websocket.ts`

## Development Notes

- All type imports use `import type` syntax for TypeScript 5.9+ compliance
- Tailwind CSS v4 is used with the new `@import "tailwindcss"` syntax
- WebSocket client implements singleton pattern for global access
- Zustand stores use middleware for persistence where needed
- All components are functional components using hooks
- Error handling is implemented at both hook and component levels

## Production Deployment

1. Build the application: `npm run build`
2. Output will be in `dist/` directory
3. Deploy `dist/` to any static hosting service
4. Ensure WebSocket URL is configured for production environment
5. Serve over HTTPS for security (WSS for WebSocket)

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with WebSocket support

---

Built with React + TypeScript + Vite for the TCP Chat Application project.

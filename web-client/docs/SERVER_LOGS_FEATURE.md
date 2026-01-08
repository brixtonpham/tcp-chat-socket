# Server Logs Panel - Educational Feature

## Overview

The Server Logs Panel is a real-time educational tool that displays all WebSocket protocol messages between the client and server. It helps students and developers understand the TCP chat application's underlying communication patterns.

## Features

### 1. Real-time Log Streaming
- Captures all incoming and outgoing WebSocket messages
- Displays request/response pairs with latency metrics
- Auto-scrolls to latest logs (toggleable)
- Supports pause/resume functionality

### 2. Color-Coded Categories
Messages are color-coded by category for easy visual scanning:

| Category | Color | Message Types |
|----------|-------|---------------|
| **Authentication** | Green | MSG_REGISTER, MSG_LOGIN, MSG_LOGOUT |
| **Friends** | Orange | MSG_FRIEND_REQUEST, MSG_FRIEND_ACCEPT, MSG_FRIEND_REJECT, MSG_FRIEND_LIST |
| **Messaging** | Blue | MSG_CHAT, MSG_GROUP_CHAT, MSG_BROADCAST |
| **Groups** | Purple | MSG_GROUP_CREATE, MSG_GROUP_JOIN, MSG_GROUP_LEAVE, MSG_GROUP_LIST, MSG_GROUP_MEMBERS |
| **Status** | Cyan | MSG_ONLINE_USERS, MSG_USER_STATUS |
| **Errors** | Red | MSG_ERROR and error responses |
| **System** | Gray | Connection events, heartbeats |

### 3. Advanced Filtering
- Filter by message category (checkboxes)
- Full-text search across all log entries
- Search includes message type, direction, and payload content

### 4. Export Capabilities
- Export logs as JSON (structured data)
- Export logs as TXT (human-readable format)
- Includes timestamps, latencies, and full payloads

### 5. Interactive Features
- **Expandable Entries**: Click to show/hide JSON payload
- **Copy to Clipboard**: Copy individual log entries
- **Latency Metrics**: Response time color-coded (green < 100ms, yellow < 500ms, red >= 500ms)
- **Collapsible Panel**: Toggle visibility to maximize chat area

## Usage

### Toggle Logs Panel
- Click the document icon in the header to show/hide the panel
- Panel appears on the right side (400px width on desktop)

### Pause/Resume Logging
- Click the pause button to freeze the log stream
- Useful for inspecting specific messages without new logs scrolling away

### Filter Logs
1. Click the filter icon to show/hide filter panel
2. Uncheck categories to hide specific message types
3. Use search box for full-text search

### Export Logs
1. Open the filter panel
2. Click "Export JSON" for structured data
3. Click "Export TXT" for readable format
4. Files are timestamped automatically

### View Log Details
- Click the arrow icon on any log entry to expand
- Shows full JSON payload with syntax highlighting
- Displays request/response direction and latency

## Implementation Details

### Architecture
```
┌─────────────────────────────────────┐
│         WebSocket Client            │
│  - Intercepts all send/receive      │
│  - Calculates request/response time │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│          Logs Store (Zustand)       │
│  - Manages log entries              │
│  - Handles filtering & search       │
│  - Exports logs                     │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│       ServerLogsPanel Component     │
│  - Renders logs list                │
│  - Auto-scroll management           │
│  - Panel visibility control         │
└─────────────────────────────────────┘
```

### Key Components

**`/src/store/logsStore.ts`**
- Zustand store for logs state management
- Filtering and search logic
- Export functionality
- Max 500 logs retained (configurable)

**`/src/components/Logs/ServerLogsPanel.tsx`**
- Main panel component
- Auto-scroll logic
- Pause/resume controls
- Collapsible interface

**`/src/components/Logs/LogEntry.tsx`**
- Individual log entry renderer
- Color coding by category
- Expandable payload display
- Copy to clipboard

**`/src/components/Logs/LogFilters.tsx`**
- Category filter checkboxes
- Search input
- Export buttons
- Clear logs action

**`/src/api/websocket.ts`**
- Message interception
- Latency calculation
- Logs store integration

## Educational Value

This feature helps students learn:

1. **Protocol Design**: See how messages are structured
2. **Request/Response Patterns**: Understand client-server communication
3. **Performance**: Observe network latency and bottlenecks
4. **Error Handling**: View error messages and troubleshooting
5. **State Management**: Track user state changes in real-time

## Best Practices

### For Students
- Keep logs panel open during development
- Filter by category when debugging specific features
- Export logs when reporting issues
- Pay attention to latency metrics

### For Developers
- Use logs to verify message handling
- Check request/response payloads for correctness
- Monitor error messages during testing
- Export logs for bug reports

## Future Enhancements

Potential improvements:
- [ ] Log persistence across sessions (localStorage)
- [ ] Advanced filters (time range, latency threshold)
- [ ] Log statistics dashboard
- [ ] WebSocket reconnection visualization
- [ ] Message replay functionality
- [ ] Diff view for request/response comparison

## Troubleshooting

**Logs not appearing?**
- Check if logging is paused (play/pause button)
- Verify WebSocket connection is active
- Check filter settings (all categories enabled?)

**Panel not visible?**
- Click document icon in header to toggle
- Check browser console for errors

**Export not working?**
- Ensure popup blockers are disabled
- Check browser's download permissions

## Related Files

- `/docs/UI_REDESIGN_PLAN.md` - Full design specification
- `/src/store/logsStore.ts` - Logs state management
- `/src/api/websocket.ts` - Message interception
- `/src/components/Logs/` - All logs components

---

**Version**: 1.0.0
**Last Updated**: 2025-12-19
**Author**: TCP Chat Development Team

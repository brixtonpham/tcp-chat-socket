# TCP Chat Web Client

A modern, real-time chat application built with React, TypeScript, and WebSocket. This web client connects to a TCP chat server via a WebSocket proxy, providing a beautiful and responsive user interface for messaging.

## Features

- **Real-time Messaging**: Instant message delivery via WebSocket
- **Friend System**: Add friends, accept/reject requests, view online status
- **Group Chat**: Create and participate in group conversations
- **Dark/Light Theme**: Toggle between themes with persistent preference
- **Responsive Design**: Modern UI built with Tailwind CSS
- **Type Safety**: Full TypeScript implementation
- **State Management**: Zustand for efficient state handling
- **Auto-reconnect**: Automatic WebSocket reconnection on disconnect

## Tech Stack

- **React 19** - UI framework with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Zustand** - Lightweight state management
- **Tailwind CSS** - Utility-first styling
- **React Hot Toast** - Beautiful notifications
- **WebSocket** - Real-time communication

## Project Structure

```
web-client/
├── src/
│   ├── api/              # WebSocket client
│   ├── components/       # React components
│   │   ├── Auth/        # Login/Register
│   │   ├── Friends/     # Friend management
│   │   ├── Chat/        # Messaging
│   │   ├── Groups/      # Group chat
│   │   ├── Layout/      # Header/Sidebar
│   │   └── Common/      # Shared components
│   ├── hooks/           # Custom React hooks
│   ├── store/           # Zustand stores
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── tailwind.config.js   # Tailwind configuration
├── vite.config.ts       # Vite configuration
└── package.json         # Dependencies
```

## Prerequisites

- Node.js 18+ and npm
- Running TCP chat server
- WebSocket proxy server (listening on ws://localhost:3000)

## Installation

1. Navigate to the web-client directory:
```bash
cd web-client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Configuration

### WebSocket Connection

The WebSocket URL is configured in `/src/api/websocket.ts`:

```typescript
const wsClient = new WebSocketClient('ws://localhost:3000');
```

Change this URL if your WebSocket proxy is running on a different address.

### Theme

The default theme is set to dark mode. Users can toggle between light and dark themes using the button in the header. Theme preference is saved to localStorage.

## Message Protocol

The client communicates with the server using JSON messages with the following structure:

```typescript
{
  type: MessageType,  // e.g., 'MSG_LOGIN', 'MSG_CHAT_SEND'
  data: any          // Message payload
}
```

Supported message types are defined in `/src/types/index.ts`.

## Features Guide

### Authentication

- **Register**: Create a new account with username, email, and password
- **Login**: Sign in with username and password
- Sessions are persisted in localStorage for auto-login

### Friends

- **Add Friend**: Send friend requests by username
- **Accept/Reject**: Manage incoming friend requests
- **Online Status**: Real-time status indicators (green = online, gray = offline)
- **Friend List**: View all friends with their current status

### Chat

- **Direct Messages**: One-on-one conversations with friends
- **Message History**: All messages are stored locally per conversation
- **Timestamps**: Each message shows send time
- **Read Receipts**: Message delivery status (sent/delivered/read)
- **Real-time Updates**: Instant message delivery and notifications

### Groups

- **Create Group**: Create groups with multiple friends
- **Group Chat**: Send messages to all group members
- **Member List**: View all group members
- **Multiple Groups**: Participate in multiple group conversations

## Development

### Adding New Components

1. Create component in appropriate directory under `/src/components/`
2. Export from component file
3. Import and use in parent components

### Adding New Store

1. Create store file in `/src/store/`
2. Define interface for state
3. Use `create` from Zustand
4. Import and use hooks in components

### Adding New Message Types

1. Add type constant to `MessageTypes` in `/src/types/index.ts`
2. Define payload interface
3. Handle in appropriate hook (useAuth, useChat, useGroups)

## Building for Production

```bash
npm run build
```

The production build will be created in the `dist/` directory. You can preview it with:

```bash
npm run preview
```

## Deployment

The built application is a static site that can be deployed to any static hosting service:

- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Any web server (nginx, Apache, etc.)

Make sure to configure the WebSocket URL for your production environment.

## Troubleshooting

### WebSocket Connection Failed

- Ensure the WebSocket proxy server is running on `ws://localhost:3000`
- Check browser console for connection errors
- Verify network/firewall settings

### Build Errors

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Update dependencies: `npm update`
- Check Node.js version (requires 18+)

### Theme Not Persisting

- Check browser localStorage is enabled
- Clear browser cache and reload

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari, Chrome Android

## License

This project is part of the TCP Chat Application assignment.

## Contributing

This is an academic project. For questions or issues, please contact the development team.

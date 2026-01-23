# Live Monitor - Real-time Live Stream Monitoring System

## 📺 Project Introduction

Live Monitor is a professional **real-time live stream monitoring system**, designed for scenarios that require monitoring multiple live streams at the same time. The system is built with Vue 3 + TypeScript + Vite and uses Tencent Cloud TRTC technology to provide low-latency real-time streaming media monitoring capabilities.

## 🚀 Quick Start

### 📋 Environment Requirements

- Node.js 16.0+ 
- npm 7.0+ (recommended) or npm 8.0+
- Modern browsers (Chrome 88+, Firefox 85+, Safari 14+)

### ⚙️ Project Configuration

#### 1. Frontend Configuration (`src/config/index.ts`)

```typescript
// Modify the following configuration items
const sdkAppId = 0; // Your Tencent Cloud LiveKit sdkAppId
const secretKey = "your_secret_key_here"; // Secret key corresponding to sdkAppId
const defaultCoverUrl = "https://your-domain.com/default-cover.png"; // Default cover image
const concurrentMonitors = 10; // Number of live streams monitored at the same time
```

**How to get TRTC configuration:**
1. Login to [Tencent Cloud Console](https://console.cloud.tencent.com/trtc)
2. Create TRTC application and get `SDKAppId`
3. Get secret key information in application management

#### 2. Server Configuration (`server/config/index.js`)

Modify `server/config/index.js` file:

```javascript
const Config = {
  SdkAppId: 0,                        // Your Tencent Cloud LiveKit sdkAppId
  SecretKey: '',                      // Your SDK secret key
  Identifier: 'administrator',        // User identity must be administrator
  Protocol: 'https://',
  Domain: 'console.tim.qq.com',       // REST API request domain
  Port: 9000,                         // Server port
};

module.exports = { Config };
```

### 🔧 Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install server dependencies  
cd server
npm install
cd ..
```

### ▶️ Start Project

#### Development Environment

```bash
# 1. Start server (Terminal 1)
cd server
npm run dev

# 2. Start frontend (Terminal 2) 
npm run dev
```

## 🎛️ User Guide

### Basic Operations

1. **Start Monitoring**
- Click the green "Start Monitoring" button
   - The system will automatically connect and display live stream video

2. **Group Switching** 
   - Use "Previous Group"/"Next Group" buttons
   - Quickly switch between different live stream combinations

3. **Load More**
   - Click the "Load Live Streams" button
   - Get more live streams available for monitoring

4. **Stop Monitoring**
- Click the red "Stop Monitoring" button
   - Disconnect all monitoring connections

### Status Monitoring

Key monitoring indicators are displayed at the top of the interface:
- **Live Stream Count**: Total number of currently loaded live streams
- **Monitoring**: Number of live streams currently being monitored
- **Concurrent Monitoring**: Maximum concurrent monitoring number configured by the system



### Core Dependencies
- **TRTC Web SDK**: Tencent Cloud Real-time Audio and Video
- **Element Plus**: UI component library
- **Day.js**: Date and time processing

## 🔧 Development Guide

### Project Structure

```
live-monitor-web-vite-vue3/
├── src/                    # Frontend source code
│   ├── components/         # Vue components
│   ├── config/            # Configuration files ⭐
│   ├── manager/           # Player management
│   ├── states/            # State management
│   └── styles/            # Style files
├── server/                # Server source code  
│   ├── config/            # Server configuration ⭐
│   ├── src/               # Server source code   
└── └── scripts/           # Build scripts
```
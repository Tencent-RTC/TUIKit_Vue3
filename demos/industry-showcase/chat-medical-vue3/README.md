# Medical Chat Showroom

A standalone medical consultation chat demo built with [Tencent Cloud Chat UIKit](https://www.tencentcloud.com/document/product/1047).

This project demonstrates how to customize Chat UIKit for the **medical consultation** vertical industry, featuring:

- 🏥 Medical-themed UI (green primary color)
- 📋 Medical record cards & prescription cards
- 💬 Quick reply & rating pickers
- 🩺 Patient info panel
- 📞 Audio/Video call integration
- 🔍 Conversation status filter (Pending / In Progress / Completed)

## Quick Start

### Prerequisites

- Node.js >= 18
- pnpm (recommended) or npm

### 1. Install dependencies

```bash
pnpm install
```

### 2. Get credentials

Go to [IM Console](https://console.cloud.tencent.com/im) to get:
- **SDKAppID**
- **UserID**
- **UserSig** (generate from [UserSig Tool](https://console.cloud.tencent.com/im/tool-usersig))

### 3. Run

```bash
pnpm dev
```

Open the browser, enter your credentials, and start chatting!

## Project Structure

```
src/
├── App.vue                     # Login/Chat state machine
├── MedicalChat.vue             # Main medical chat layout
├── components/
│   ├── Login.vue               # Login form
│   ├── SideTab/                # Side navigation (conversation/contact tabs)
│   └── Medical/
│       ├── cards/              # Custom message cards (record, prescription, rating)
│       ├── pickers/            # Toolbar pickers (quick reply, prescription, etc.)
│       ├── ConversationFilterBar.vue
│       ├── MedicalChatSetting.vue
│       ├── MedicalConversationPreview.vue
│       ├── MedicalConversationTitle.vue
│       ├── MedicalMessageRenderer.vue
│       └── PatientInfoPanel.vue
```

## License

MIT

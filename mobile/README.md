# ConnectPulse — React Native Android Dating & Chat App

ConnectPulse is a real-time dating & communication mobile application for Android built with **React Native (0.87.1)**, designed to connect directly with the Node.js/TypeScript backend (`REST Auth` + `GraphQL Data` + `Socket.IO Real-time`).

---

## Features

- **🔐 REST Authentication**: Login, Sign Up, Profile Bootstrap, and Forgot Password recovery.
- **⚡ 1-Tap Demo Logins**: Instantly sign in as **Alice**, **Bob**, or **Charlie** to test real-time chat between devices/windows without typing credentials.
- **💬 Real-Time Chat (Socket.IO & GraphQL)**:
  - Instant live messaging stream with auto-scroll.
  - Live typing indicators ("Alice is typing...").
  - Sent / Delivered / Read receipts (✓ / ✓✓ cyan double ticks).
  - Unread message counters on conversation cards and tab bar.
- **💖 Dating Discovery**:
  - Discover profiles with photos, bio, gender, online presence badge, and status messages.
  - Direct "Message" and "Call" action buttons.
- **📞 Audio & Video Calling UI**:
  - Full-screen calling modal overlay with ringing, connected timer (MM:SS), mute, speaker, camera toggles, and hang-up actions.
  - Call records synced with the backend GraphQL `GetCallHistory`.
- **⚙️ Dynamic Server IP Switcher**:
  - In-app switcher to effortlessly toggle between **Android Emulator (`http://10.0.2.2:5000`)**, **Local Wi-Fi LAN (`http://192.168.1.5:5000`)**, or custom server URLs.
  - Live server health test button.

---

## Project Structure

```
mobile/
├── android/                   # Native Android configuration (package: com.connectpulse)
│   ├── app/src/main/AndroidManifest.xml
│   └── app/src/main/java/com/connectpulse/MainActivity.kt
├── src/
│   ├── components/            # Avatar, CallModal, MessageBubble, ServerConfigModal
│   ├── config/                # Host resolution & server IP storage
│   ├── context/               # AuthContext, ChatContext, CallContext
│   ├── navigation/            # RootNavigator
│   ├── screens/               # LoginScreen, RegisterScreen, ForgotPasswordScreen,
│   │   │                      # HomeScreen, ChatScreen, NewChatModal
│   │   └── tabs/              # ChatsTab, DiscoverTab, CallsTab, ProfileTab
│   ├── services/              # REST api.ts, GraphQL client graphql.ts, Socket socket.ts
│   ├── theme/                 # Dark aesthetic color palette with vibrant rose accents
│   └── types/                 # User, Conversation, Message, Call models
├── App.tsx                    # Root App component with context providers
└── package.json
```

---

## How to Run

### 1. Start the Backend Server
In the root directory, navigate to `backend`:
```bash
cd backend
npm run dev
```
The server will start on port `5000` (with in-memory MongoDB fallback if local Mongo isn't running).

### 2. Start the Android Emulator or Connect Physical Device
- **Android Emulator**: Launch an AVD from Android Studio.
- **Physical Device**: Connect phone via USB with USB Debugging enabled, or on the same Wi-Fi network.

### 3. Start Metro Bundler & Run on Android
In the `mobile` directory:
```bash
cd mobile
npm start
```
In a new terminal window:
```bash
cd mobile
npm run android
```

> **Note on Network Connection**:
> - If running inside the **Android Emulator**, the app automatically connects to `http://10.0.2.2:5000` which maps to your PC.
> - If running on a **Physical Device**, open Settings (gear icon on Login or in Profile) and select **Wi-Fi LAN (192.168.1.5:5000)** or enter your PC's IP address.

# ConnectPulse (Dating & Real-Time Chat App)

A modern full-stack real-time communication & dating platform featuring:
- **Web App**: React 18, Vite, TypeScript, Material-UI & Emotion.
- **Backend**: Node.js, Express, Apollo Server (GraphQL), Socket.IO (WebSockets), WebRTC peer-to-peer signaling, and MongoDB.
- **Mobile App**: React Native (Android & iOS) with native navigation and real-time audio/video calls.
- **DevOps & Cloud**: Docker multi-stage builds, Docker Compose, AWS CI/CD pipelines (ECS Fargate, S3 + CloudFront), and automated Android APK build workflows.

---

## 🏗️ Repository Architecture

- `backend/`: REST Auth API, Apollo GraphQL, Socket.IO WebSockets, WebRTC signaling & MongoDB models.
- `frontend/`: Responsive React + Vite web dashboard.
- `mobile/`: React Native cross-platform mobile application.
- `.github/workflows/`: Automated GitHub Actions pipelines for AWS & Android APK releases.
- `docker-compose.yml`: Local full-stack container orchestration.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js >= 20.x
- Local MongoDB running on `localhost:27017` (or MongoDB Atlas)

### 2. Backend
```bash
cd backend
npm install
npm run dev
```

### 3. Frontend Web Client
```bash
cd frontend
npm install
npm run dev
```

### 4. Mobile Client
```bash
cd mobile
npm install
npm run android
```

---

## 🚢 CI/CD & Deployment

Refer to [`DEPLOYMENT_PIPELINE.md`](./DEPLOYMENT_PIPELINE.md) for full AWS ECS Fargate, S3 + CloudFront, and Android APK build configurations.

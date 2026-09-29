# ConnectPulse CI/CD & AWS Deployment Pipeline

This repository includes a production-ready CI/CD deployment pipeline using **GitHub Actions**, **AWS (ECS Fargate + S3 + CloudFront)**, and **Docker**.

---

## 🏛️ Architecture Overview

```mermaid
flowchart TD
    subgraph GitHub["GitHub Repository"]
        Push["git push origin main"]
        W1[".github/workflows/deploy-frontend-aws.yml"]
        W2[".github/workflows/deploy-backend-aws.yml"]
        W3[".github/workflows/build-mobile-android.yml"]
    end

    subgraph AWS_Frontend["AWS Frontend Hosting"]
        S3["AWS S3 Bucket<br/>(Static Web Hosting)"]
        CF["AWS CloudFront CDN<br/>(Global HTTPS Distribution)"]
        UserWeb["Web Users / Browsers"]
    end

    subgraph AWS_Backend["AWS Backend Hosting"]
        ECR["AWS ECR<br/>(Docker Image Registry)"]
        ECS["AWS ECS Fargate / ALB<br/>(Node.js, GraphQL & WebSockets)"]
    end

    subgraph Database["Database"]
        Atlas[("MongoDB Atlas Cloud")]
    end

    subgraph MobileApp["Mobile App Artifacts"]
        APK["Downloadable Android APK<br/>(GitHub Artifacts / Releases)"]
    end

    Push --> W1
    Push --> W2
    Push --> W3

    W1 -->|"npm run build & sync"| S3
    S3 --> CF
    CF --> UserWeb

    W2 -->|"docker build & push"| ECR
    ECR -->|"deploy task definition"| ECS
    ECS <--> Atlas
    UserWeb <-->|"REST, GraphQL & WebSockets"| ECS

    W3 -->|"gradle assembleRelease"| APK
```

---

## 📁 Pipeline Workflows

| Component | Workflow File | Trigger Path | Target Deployment |
| :--- | :--- | :--- | :--- |
| **Backend** | [deploy-backend-aws.yml](.github/workflows/deploy-backend-aws.yml) | `backend/**` | AWS ECR + AWS ECS Fargate |
| **Frontend** | [deploy-frontend-aws.yml](.github/workflows/deploy-frontend-aws.yml) | `frontend/**` | AWS S3 + CloudFront CDN |
| **Mobile** | [build-mobile-android.yml](.github/workflows/build-mobile-android.yml) | `mobile/**` | GitHub Actions APK Artifact |

---

## 🔑 GitHub Secrets Configuration

In your GitHub repository, navigate to **Settings** → **Secrets and variables** → **Actions**, and add the following repository secrets:

### 1. AWS Credentials
| Secret Name | Description | Example |
| :--- | :--- | :--- |
| `AWS_ACCESS_KEY_ID` | IAM User Access Key ID with ECR, ECS, S3, CloudFront permissions | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | IAM User Secret Access Key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS Region where services are hosted | `us-east-1` or `ap-south-1` |

### 2. Frontend & CDN Secrets
| Secret Name | Description | Example |
| :--- | :--- | :--- |
| `AWS_S3_BUCKET` | S3 bucket name for hosting frontend assets | `connectpulse-web-client` |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront Distribution ID for cache invalidation | `E12345EXAMPLE` |
| `PROD_VITE_API_URL` | Public URL for backend REST Auth API | `https://api.yourdomain.com/api/auth` |
| `PROD_VITE_GRAPHQL_URL` | Public URL for backend Apollo GraphQL endpoint | `https://api.yourdomain.com/graphql` |
| `PROD_VITE_SOCKET_URL` | Public URL for backend Socket.IO WebSockets | `https://api.yourdomain.com` |

### 3. Backend ECS Secrets
| Secret Name | Description | Example |
| :--- | :--- | :--- |
| `AWS_ECR_REPOSITORY` | Name of your Amazon ECR Repository | `connectpulse-backend` |
| `AWS_ECS_CLUSTER` | Name of your ECS Fargate Cluster | `connectpulse-cluster` |
| `AWS_ECS_SERVICE` | Name of your ECS Service running behind ALB | `connectpulse-backend-service` |

---

## 🚀 AWS Infrastructure Setup Checklist

### Step 1: Frontend (S3 + CloudFront)
1. **S3 Bucket**:
   - Create bucket `connectpulse-web-client`.
   - Enable "Static website hosting" or configure CloudFront Origin Access Control (OAC).
2. **CloudFront Distribution**:
   - Set Origin to the S3 bucket.
   - Set Default Root Object to `index.html`.
   - Under **Custom Error Responses**:
     - HTTP Error Code: `403` & `404` -> Response Page Path: `/index.html` -> HTTP Response Code: `200` *(ensures React Router SPA navigation works without 404s)*.

### Step 2: Backend (ECR + ECS Fargate)
1. **ECR Repository**:
   - Create a private repository named `connectpulse-backend`.
2. **ECS Cluster & Fargate Service**:
   - Create an ECS Cluster (e.g. `connectpulse-cluster`).
   - Create an **Application Load Balancer (ALB)** with a target group pointing to port `5000`.
   - Configure ALB idle timeout to `300s` or higher to ensure persistent **Socket.IO** connections do not drop.
   - In AWS Secrets Manager or Parameter Store, save:
     - `MONGODB_URI`: Your MongoDB Atlas URI (`mongodb+srv://...`).
     - `JWT_SECRET` & `JWT_REFRESH_SECRET`.
     - `CLIENT_URL`: Your CloudFront / custom frontend domain URL.

---

## 📱 Mobile Android APK Build

Every time changes are pushed to `mobile/**`:
1. GitHub Actions spins up an Ubuntu VM with JDK 17, Android SDK, and Node 22.
2. It executes `./gradlew assembleRelease`.
3. The resulting APK is uploaded to the workflow summary under **Artifacts** named `ConnectPulse-Android-Release-APK`.
4. Anyone on your team can download and install the APK directly on Android devices.

---

## 🐳 Local Docker Testing

You can simulate the production container setup locally with Docker Compose:

```bash
docker compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

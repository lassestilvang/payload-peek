# Payload Peek

> **Catch webhooks. Inspect payloads. Generate TypeScript.**  
> A live webhook inbox that turns real HTTP requests into strongly-typed code and Zod schemas. No installation, no account, no setup hassle.

Built for the **Google Cloud Run Takeover & Product Hunt Hackathon**.

---

## ⚡ The 30-Second Demo

1. **Get an inbox instantly**: Open the app to get a unique webhook URL without creating an account.
2. **Send a request**: Click **"Send Sample Webhook"** (Stripe, GitHub, Shopify, Clerk) or send a real HTTP payload using `curl`.
3. **Generate code**: Click **TypeScript** or **Zod** to inspect generated interfaces, view full headers, and copy code straight into your application.

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│                  Next.js App Router                    │
│      Tailwind CSS · Responsive 3-Pane Interface        │
│    TypeScript & Zod Code Generator · Live Poller       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Google Cloud Run                     │
│               Single Container Service                 │
│      Autoscaling · Scale-to-zero · Webhook Receiver    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Cloud Firestore                      │
│     Inboxes Collection · Captured Events Subcollection │
│        Resilient fallback for local development        │
└────────────────────────────────────────────────────────┘
```

- **Runtime**: Single containerized Next.js 16 application running on **Google Cloud Run**.
- **Persistence**: **Cloud Firestore** for storing inbox records and incoming events across container restarts. Includes an in-memory/file resilient fallback for zero-dependency local development and testing.
- **Safety**: 128 KB payload guardrail, automatic redaction of sensitive authentication tokens & headers (`authorization`, `cookie`, `x-api-key`, etc.), and SHA-256 hashed dashboard owner tokens.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/inboxes` | Create a new inbox, returns receiver URL and private owner token. |
| `GET` | `/api/inboxes/:id` | Get inbox metadata (requires owner token). |
| `DELETE` | `/api/inboxes/:id` | Remove inbox and associated events (requires owner token). |
| `GET` | `/api/inboxes/:id/events` | Return captured events (requires owner token, polled every 1.5s). |
| `DELETE` | `/api/inboxes/:id/events` | Clear events for this inbox (requires owner token). |
| `POST` | `/api/inboxes/:id/sample` | Trigger a realistic mock webhook (Stripe, GitHub, Shopify, Clerk). |
| `*` | `/api/hooks/:token` | **Public receiver endpoint**. Accepts any HTTP method (`POST`, `GET`, `PUT`, `PATCH`, `DELETE`), captures body and headers, redacts secrets, and persists the event. |

---

## 🚀 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Open http://localhost:3000 in your browser
```

---

## 🚢 Deploying to Google Cloud Run

To deploy Payload Peek directly from source to Cloud Run:

```bash
# Set your Google Cloud project
gcloud config set project YOUR_PROJECT_ID

# Deploy to Cloud Run
gcloud run deploy payload-peek \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1
```

Once deployment completes, Cloud Run will print the live HTTPS service URL.

---

## 🏆 Product Hunt Launch Submission Package

- **Product Name**: Payload Peek
- **Tagline**: Catch webhooks. Inspect payloads. Generate TypeScript. (53 chars)
- **Description**: A live webhook inbox for developers. Inspect HTTP requests, explore JSON payloads, and turn real events into TypeScript interfaces or Zod schemas—all in your browser, with no setup or account required.
- **Cloud Run Hackathon Description**:
  > Payload Peek runs as a containerized Next.js application on Google Cloud Run. Cloud Run serves the dashboard and receives incoming webhook events through unique HTTP endpoints, while Cloud Firestore persists request metadata and JSON payloads. Its managed, autoscaling infrastructure lets us accept webhook traffic without managing servers, scaling down when idle and scaling up with demand.

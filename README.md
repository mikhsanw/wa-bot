# 🤖📱 WA Gateway — Multi-Session WhatsApp Gateway v5

[![Version](https://img.shields.io/badge/version-5.0.0-blue)]()
[![License](https://img.shields.io/badge/license-ISC-green)]()

> **WA Gateway** is a headless multi-session WhatsApp gateway with a built-in **Auto-Reply RAG system**, **Multi-Session Knowledge Base**, and a modern **Web Dashboard** — built with Hono JSX + Tailwind CSS v4.

---

## ✨ Features

### Core Gateway
- ✅ Multi-device support (WhatsApp Web JS)
- ✅ Multi-session / multiple phone numbers
- ✅ Send text, images, videos, and documents
- ✅ Webhook integration (session, message events)
- ✅ Session management (create, list, logout)
- ✅ SQLite session storage (default) / Redis support
- ✅ RESTful API with API Key authentication

### 🧠 Auto-Reply RAG System *(New in v5)*
- **3-tier intelligent reply engine:**
  1. **FAQ keyword matching** — Instant responses for predefined patterns per session
  2. **Knowledge Base search** — Semantic keyword scoring from markdown files
  3. **LLM RAG fallback** — OpenAI-compatible API with context retrieval (optional)
- Per-session knowledge base (`knowledge/{session}/`)
- Contact person fallback (when AI can't answer)
- Unanswered question logging

### 🖥️ Web Dashboard
- Modern UI with Hono JSX + **Tailwind CSS v4**
- API Key authentication
- Session management (start, QR scan, logout)
- Real-time session status

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
mkdir -p ~/app/wa-gateway && cd ~/app/wa-gateway
```

Create `docker-compose.yaml`:

```yaml
services:
  wa-gateway:
    container_name: "wa-gateway"
    restart: unless-stopped
    image: mimamch/wa-gateway:latest
    volumes:
      - ./wa_credentials:/app/wa_credentials
      - ./media:/app/media
      - ./knowledge:/app/knowledge   # mount your knowledge base
    ports:
      - "5001:5001"
    environment:
      - KEY=your-secret-api-key
      - WEBHOOK_BASE_URL=
      - REDIS_URL=                   # optional: redis://... for Redis sessions
```

Start the container:

```bash
docker compose up -d
```

### Option 2: Direct (Node.js + PM2)

```bash
git clone git@github.com:mikhsanw/wa-bot.git
cd wa-bot
cp .env.example .env   # configure your environment
npm install
npx tsx src/index.ts
```

Or with PM2:

```bash
pm2 start ecosystem.config.cjs
```

---

## 🖥️ Web Dashboard

Open your browser at:

```
http://your-server-ip:5001
```

1. **Login** with your API Key (`KEY` env)
2. **Create Session** — Enter a session name, scan QR with WhatsApp
3. **Manage Sessions** — View status, delete expired sessions

---

## 📡 API Reference

All API endpoints require a header:

```
X-API-Key: your-secret-api-key
```

### Session Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/session/start?session=NAME` | Create new session |
| `POST` | `/session/start` | Create session (JSON body) |
| `GET` | `/session/list` | List all sessions |
| `GET` | `/session/delete?session=NAME` | Delete session |
| `GET` | `/session/logout?session=NAME` | Logout session |

### Send Messages

#### Text Message

```bash
POST /message/send-text
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session` | string | ✅ | Session name |
| `to` | string | ✅ | Phone number (e.g. 628123456789) |
| `text` | string | ✅ | Message text |
| `is_group` | boolean | ❌ | true if group chat |

#### Image Message

```bash
POST /message/send-image
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session` | string | ✅ | Session name |
| `to` | string | ✅ | Phone number |
| `image_url` | string | ✅ | URL of the image |
| `text` | string | ❌ | Caption |

#### Document Message

```bash
POST /message/send-document
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session` | string | ✅ | Session name |
| `to` | string | ✅ | Phone number |
| `document_url` | string | ✅ | URL of the document |
| `document_name` | string | ✅ | Display name |

#### Video Message

```bash
POST /message/send-video
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session` | string | ✅ | Session name |
| `to` | string | ✅ | Phone number |
| `video_url` | string | ✅ | URL of the video |
| `text` | string | ❌ | Caption |
| `is_group` | boolean | ❌ | true if group chat |

### Health Check

```bash
GET /health
```

---

## 🧠 Auto-Reply RAG System *(New in v5)*

The auto-reply system uses a **3-tier fallback** approach:

```
Incoming Message
       │
       ▼
┌─────────────────┐
│ 1. FAQ Matching  │ ← Instant keyword/pattern match per session
└────────┬────────┘
         │ No match
         ▼
┌──────────────────────┐
│ 2. Knowledge Search  │ ← Semantic keyword scoring from markdown KB
└────────┬─────────────┘
         │ No match
         ▼
┌───────────────────┐
│ 3. LLM RAG (opt)  │ ← OpenAI-compatible API + context retrieval
└───────────────────┘
         │ No match / not configured
         ▼
   Contact Person Fallback
```

### Knowledge Base Structure

```
knowledge/
├── kpu-siak/
│   ├── visi-misi.md
│   ├── tugas-pokok.md
│   ├── layanan-ppid.md
│   └── struktur-organisasi.md
├── default/
│   └── faq-umum.md
└── ... (other sessions)
```

Each `.md` file can have `##` sections — each section becomes a searchable chunk.

### Environment Variables for LLM

| Variable | Description |
|----------|-------------|
| `LLM_API_URL` | OpenAI-compatible API endpoint |
| `LLM_API_KEY` | API key |
| `LLM_MODEL` | Model name (default: `gpt-4o-mini`) |

---

## 📦 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5001` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `KEY` | (required) | API Key for dashboard & API auth |
| `WEBHOOK_BASE_URL` | — | Base URL for webhook events |
| `REDIS_URL` | — | Redis connection string (session storage) |
| `LLM_API_URL` | — | LLM API endpoint (auto-reply) |
| `LLM_API_KEY` | — | LLM API key |
| `LLM_MODEL` | `gpt-4o-mini` | LLM model name |

---

## 🔌 Webhook Setup

Set `WEBHOOK_BASE_URL` environment variable to receive real-time events:

```env
WEBHOOK_BASE_URL=https://your-domain.com/webhook
```

### Webhook Endpoints

| Event | Endpoint | Description |
|-------|----------|-------------|
| Session | `POST /webhook/session` | Session connected/disconnected |
| Message | `POST /webhook/message` | Incoming/outgoing messages |
| Media | `POST /webhook/media` | Media file events |

---

## 🗂️ Project Structure

```
wa-bot/
├── src/
│   ├── index.ts                    # App entry point + routes
│   ├── whatsapp.ts                 # WhatsApp client manager
│   ├── env.ts                      # Environment config
│   ├── auto-reply/
│   │   └── index.ts                # 3-tier auto-reply engine
│   ├── knowledge/
│   │   └── loader.ts               # Markdown KB loader + search
│   ├── controllers/
│   │   ├── session.ts              # Session management
│   │   ├── message.ts              # Message sending
│   │   ├── profile.ts              # Profile endpoint
│   │   ├── health.ts               # Health check
│   │   └── dashboard/             # Dashboard routes
│   ├── webhooks/
│   │   ├── index.ts               # Webhook router
│   │   ├── session.ts             # Session webhook handler
│   │   ├── message.ts             # Message webhook handler
│   │   └── media.ts               # Media webhook handler
│   └── middlewares/
│       ├── error.middleware.ts     # Global error handler
│       ├── key.middleware.ts       # API Key auth
│       ├── notfound.middleware.ts  # 404 handler
│       └── validation.middleware.ts # Input validation
├── assets/
│   ├── style.css                  # Tailwind CSS output
│   └── js/
│       ├── script.js              # Dashboard JS
│       ├── create-session.js      # Session creation UI
│       └── qrcode.min.js          # QR code library
├── knowledge/                     # Knowledge base files
│   └── default/
├── ecosystem.config.cjs           # PM2 configuration
├── package.json
└── README.md
```

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run in development mode (hot reload)
npm run dev

# Build for production
npm run build

# Build CSS
npm run build:css

# Run dev with UI (concurrent)
npm run dev:ui
```

### PM2 Deployment

```bash
# Start with PM2
pm2 start ecosystem.config.cjs

# Monitor logs
pm2 logs wa-bot

# Restart
pm2 restart wa-bot
```

---

## ⬆️ Upgrading

### Docker

```bash
cd ~/app/wa-gateway
docker compose pull
docker compose down
docker compose up -d
```

### Direct

```bash
cd wa-bot
git pull
npm install
npm run build
pm2 restart wa-bot
```

---

## 📄 License

ISC — Originally developed by [mimamch](https://github.com/mimamch/wa-gateway). Forked and enhanced with Auto-Reply RAG system, Knowledge Base, and Dashboard v2.

---

## 🙏 Support

For issues and feature requests, open an issue on GitHub.

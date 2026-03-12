# SimpleNow — AI-Native ITSM Platform

> Next-generation IT Service Management platform that delivers the core capabilities of legacy ITSM platforms at 10x lower cost and 10x better UX, with AI deeply embedded into every workflow.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)
[![NestJS](https://img.shields.io/badge/NestJS-10-red.svg)](https://nestjs.com)

---

## Features

### Core ITSM Modules
- **Incident Management** — AI-powered triage, SLA tracking, real-time updates
- **Service Request Management** — Service catalog with approval workflows
- **Problem Management** — Root cause analysis, incident pattern clustering
- **Change Management** — AI risk prediction, change calendar
- **Knowledge Base** — AI-generated articles, semantic search
- **CMDB** — Configuration item management with relationship mapping
- **Service Catalog** — Self-service portal with rich form builder
- **Workflow Automation** — Visual workflow engine with triggers and actions
- **Reporting & Analytics** — Real-time dashboards, SLA reports, trend analysis

### AI Capabilities
- 🤖 **Intelligent Triage** — Auto-classify priority, category, and route tickets
- 📊 **Sentiment Analysis** — Detect frustrated users and escalate automatically
- 🔍 **Pattern Detection** — Identify major incident patterns in real-time
- 📝 **Knowledge Generation** — Auto-generate KB articles from resolved tickets
- 🎯 **Change Risk Prediction** — AI-powered risk scoring for changes
- 💬 **AI Chat Assistant** — Conversational ops intelligence

### Technical Highlights
- Sub-second page loads
- Real-time updates via WebSocket
- Dark/light mode
- Keyboard-driven UX (Cmd+K command palette)
- Multi-tenant SaaS architecture
- Horizontal scaling with Kubernetes

---

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose

### 1. Clone and Setup
```bash
git clone https://github.com/your-org/simplenow
cd simplenow
./scripts/setup.sh
```

### 2. Start Development
```bash
npm run dev
```

### 3. Access
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger Docs | http://localhost:3001/api/docs |
| DB Admin | http://localhost:8080 |

### Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@simplenow.io | admin123 |
| Agent | sarah.agent@simplenow.io | admin123 |
| Viewer | viewer@simplenow.io | admin123 |

---

## Architecture

```
simplenow/
├── apps/
│   ├── api/                 # NestJS backend
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/        # JWT authentication
│   │       │   ├── tickets/     # Core ticket management
│   │       │   ├── knowledge/   # Knowledge base
│   │       │   ├── cmdb/        # Configuration items
│   │       │   ├── workflows/   # Workflow automation
│   │       │   ├── ai/          # AI service layer
│   │       │   ├── dashboard/   # Real-time metrics
│   │       │   ├── notifications/ # WebSocket notifications
│   │       │   ├── catalog/     # Service catalog
│   │       │   ├── integrations/ # Third-party connectors
│   │       │   └── reports/     # Analytics & reports
│   │       └── database/
│   │           └── seeds/       # Demo data
│   └── frontend/            # Next.js frontend
│       └── src/
│           ├── app/         # App Router pages
│           ├── components/  # Reusable components
│           ├── store/       # Zustand state
│           ├── hooks/       # React hooks
│           └── types/       # TypeScript types
├── docker/                  # Docker configs
├── k8s/                     # Kubernetes manifests
└── scripts/                 # Setup & deployment
```

---

## Configuration

### Backend Environment (apps/api/.env)
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://simplenow:simplenow@localhost:5432/simplenow
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-this-in-production
JWT_EXPIRY=24h

# AI Configuration (optional - platform works without these)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@simplenow.io
SMTP_PASS=your-smtp-password
```

---

## API Documentation

Full Swagger documentation available at `http://localhost:3001/api/docs`

### Key Endpoints
```
POST   /api/auth/login           # Login
POST   /api/auth/register        # Register user
GET    /api/tickets              # List tickets (with filters)
POST   /api/tickets              # Create ticket (AI triage runs automatically)
GET    /api/tickets/:id          # Get ticket detail
PATCH  /api/tickets/:id          # Update ticket
POST   /api/tickets/:id/ai-triage # Re-run AI triage
GET    /api/dashboard/metrics    # Real-time dashboard metrics
POST   /api/ai/chat              # AI chat assistant
POST   /api/ai/triage            # AI ticket triage
GET    /api/reports/sla          # SLA performance report
```

---

## Integrations

Built-in connector support for:
- **Messaging**: Slack, Microsoft Teams
- **Ticketing**: Jira Software
- **Development**: GitHub
- **Identity**: Azure AD, Okta
- **Monitoring**: Datadog, Prometheus/Alertmanager
- **Alerting**: PagerDuty

---

## Deployment

### Docker Compose (recommended for small/medium)
```bash
docker compose -f docker/docker-compose.yml up -d
```

### Kubernetes (recommended for enterprise)
```bash
kubectl apply -f k8s/
```

### Using deployment script
```bash
VERSION=1.0.0 ./scripts/deploy.sh
```

---

## License
MIT License — see [LICENSE](LICENSE)

---

Built with ❤️ by the SimpleNow team. Designed to make IT service management genuinely enjoyable.

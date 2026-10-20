# GitFix AI — Frontend Engineering Dashboard

> **Autonomous AI-driven GitHub Issue Resolver & Pipeline Monitor**  
> Built with React 19, Vite, Lucide Icons, and Vanilla CSS with modern Cyber-DevTools dark mode aesthetics.

---

## 🚀 Architecture & Senior Software Engineering Design

This application was engineered following senior-level frontend architecture, separating concerns across clean layers:

```
gitfix-frontend/
├── src/
│   ├── api/
│   │   ├── apiClient.js            # Standard Fetch wrapper with timeouts, JSON parsing & error interceptors
│   │   ├── connectionsService.js   # GitHub repository connection management & webhook auto-registration
│   │   ├── jobsService.js          # Manual pipeline triggering, logs stream, retry & patch inspections
│   │   └── systemService.js        # Spring Boot Actuator health checks (/actuator/health)
│   ├── constants/
│   │   ├── apiEndpoints.js         # Base URL & REST endpoints
│   │   ├── jobStatus.js            # Pipeline progression steps, status badges, colors, icons & metadata
│   │   └── appConfig.js            # LocalStorage keys, polling intervals, and tabs
│   ├── utils/
│   │   ├── DateHelper.js           # ISO timestamp formatting, duration calculator & relative time-ago
│   │   ├── DiffHelper.js           # JSON patch parser, file diff statistics & path extractors
│   │   ├── StorageHelper.js        # Safe LocalStorage wrapper with fallback handling
│   │   ├── ErrorHelper.js          # Backend error message & field validation normalizer
│   │   └── ValidationHelper.js     # GitHub repository format & token validation
│   ├── context/
│   │   └── AppContext.jsx          # Central state, automatic polling for active jobs, toasts & modal controls
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.jsx          # Top bar with health pill, repo selector & primary action buttons
│   │   │   ├── StatusBadge.jsx     # Glowing status badges with animated spinners
│   │   │   ├── ToastContainer.jsx  # Notification toast system
│   │   │   ├── Modal.jsx           # Accessible glassmorphism modal
│   │   │   └── EmptyState.jsx      # Clean zero-data illustrations
│   │   ├── analytics/
│   │   │   └── MetricStats.jsx     # Total pipelines, PRs created, active fixes & connected repos
│   │   ├── jobs/
│   │   │   ├── JobList.jsx         # Searchable, filterable list of pipeline runs
│   │   │   ├── JobCard.jsx         # Card with status badge, duration, retry & PR links
│   │   │   ├── PipelineStepper.jsx # Visual 8-step pipeline progression
│   │   │   └── TriggerJobModal.jsx # Manual issue trigger dialog with quick presets
│   │   ├── console/
│   │   │   ├── JobInspector.jsx    # Dual-tab inspector container
│   │   │   ├── LiveLogViewer.jsx   # Live terminal console with auto-scroll, step tags & export
│   │   │   └── AttemptsViewer.jsx  # AI surgical reasoning, code patch diff & Docker test logs
│   │   ├── connections/
│   │   │   ├── ConnectionList.jsx  # Repositories manager, webhook status & secrets copy
│   │   │   └── AddConnectionModal.jsx # AES-256 token registration modal
│   │   └── guide/
│   │       └── ArchitectureGuide.jsx # Interactive 11-step autonomous pipeline guide
│   ├── styles/
│   │   └── index.css               # Design system: glassmorphism, animations, custom scrollbars
│   ├── App.jsx                     # Split-pane dashboard & routing
│   └── main.jsx                    # Root entry point
```

---

## 🛠️ How to Run Locally

### Prerequisites
1. Spring Boot backend running on `http://localhost:8080`
2. Node.js v18+ and npm installed

### Start Dev Server
```bash
cd c:/Users/Akshay/Downloads/git_ai/gitfix-frontend
npm install
npm run dev
```

The application will start on: **`http://localhost:5173`** (CORS-enabled on backend).

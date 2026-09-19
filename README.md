# Personal Health Companion (PHC) — Prototype

This directory contains the working frontend prototype of the **Personal Health Companion (PHC)**, built for the Smart India Hackathon (SIH) 2026. 

The application is a Progressive Web App (PWA) designed to simulate the user experience of real-time health monitoring, localized edge AI anomaly detection, disaster awareness, and emergency SOS routing.

## 📱 Live Demo
The application is continuously deployed via Vercel:
**[View Live Prototype](https://health-companion-omega.vercel.app)**

*(Note: Designed mobile-first. For the best experience on a desktop browser, use responsive design mode or shrink your viewport width to ~390px).*

## 🛠 Tech Stack
This prototype is built intentionally lightweight to ensure maximum compatibility and zero build-step friction:
- **Core:** Vanilla HTML5, CSS3, JavaScript (ES6)
- **Design System:** Custom CSS tokens inspired by `shadcn/ui`, fully responsive and utilizing fluid layouts.
- **State & Data:** Deterministic mock data engine (`data.js`) feeding into a vanilla JS reactive router (`app.js`).
- **PWA Capabilities:** Service Worker (`sw.js`) utilizing a Network-First strategy to allow for offline resilience, and a `manifest.json` for "Add to Home Screen" functionality.

## ✨ Core Capabilities (Simulated)
1. **Continuous Health Monitoring:** 
   Simulates incoming telemetry (Heart Rate, SpO2, Skin Temp, Respiration) from a connected wearable via a mock data generator stream.
2. **On-Device Anomaly Detection:**
   Evaluates a sliding window of sensor data locally to identify heat stress, respiratory anomalies, and cardiac spikes without cloud dependency.
3. **Disaster-Specific Context:**
   Merges environmental indicators (AQI, extreme heat) with physiological signals to deliver context-aware alerts (e.g., heatstroke warnings).
4. **Emergency SOS Protocol:**
   A one-touch and automated (fall-detection) SOS system that initiates a 30-second cancellation window before broadcasting GPS and medical ID data to emergency contacts.
5. **Medical ID Dashboard:**
   Offline-available profile containing critical triage data (blood type, allergies, conditions, and contacts).

## 📁 Project Structure
```text
www/
├── index.html        # Main application shell and UI layout structure
├── manifest.json     # PWA manifest for native app-like installation
├── sw.js             # Service worker handling the offline caching strategy
├── css/
│   ├── app.css       # Core application styling, components, and animations
│   └── tokens.css    # shadcn-inspired design system tokens (colors, typography, spacing)
├── js/
│   ├── app.js        # Core logic: Router, UI renderers, SOS lifecycle, chart rendering
│   ├── charts.js     # Lightweight SVG charting utility for health trends
│   └── data.js       # Global state and deterministic mock data generators
└── icons/            # App icons for various PWA manifest requirements
```

## 🚀 Running Locally
Because this is a vanilla web application, no `npm install` or build step is required. 

1. **Serve the directory:**
   You can use any local web server to run the app. If you have Python installed:
   ```bash
   python -m http.server 8000
   ```
   Or using Node.js:
   ```bash
   npx serve .
   ```
2. **Open your browser:**
   Navigate to `http://localhost:8000` (or the port specified by your server).
3. **PWA Testing:**
   To test the offline functionality, open Chrome DevTools > Application > Service Workers, check "Offline", and reload the page.

## 🔧 Extending the Prototype
- **Theme Adjustments:** All colors and typography are centralized in `css/tokens.css`.
- **Data Modding:** To simulate different physiological events or tweak the user profile, edit the `PHC` object in `js/data.js`.
- **UI Logic:** Component renderers and navigation state are managed in `js/app.js`.

---
*Built for Smart India Hackathon (SIH) 2026*

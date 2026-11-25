# Campus Bites — Full-stack project

A campus café ordering app with a Node.js/Express API and a browser-only demo mode.

## Features
- Browse the menu, manage a cart, and get menu suggestions based on what you feel like eating. The app uses the existing `/api/ai/suggest` endpoint when the server is available, with local menu-matching suggestions as a fallback.
- Checkout automatically calculates an itemized bill from menu prices, places the order, and creates a UPI payment request for the exact total. Customers review and confirm payment in their UPI app; this app does not automatically charge a payment method.
- Orders can be viewed in the browser's **My orders** tab. In browser-only mode, demo orders are stored in local storage.

## Stack
- Frontend: HTML, CSS and vanilla JavaScript (`public/index.html`)
- Backend: Node.js + Express (`server.js`)
- Persistence: JSON file (`data/db.json`)
- Order lookup: in-memory 2-3-4 tree

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000. For shared live orders, run the Express server; GitHub Pages runs the frontend in browser-only demo mode.

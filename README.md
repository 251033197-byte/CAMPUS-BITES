# Campus Bites — Full-stack project

A full-stack version of the Campus Bites café ordering app.

## Stack
- Frontend: HTML, CSS and vanilla JavaScript (`public/index.html`)
- Backend: Node.js + Express (`server.js`)
- Persistence: JSON file (`data/db.json`)
- Data structure: a 2-3-4 tree indexes order IDs for fast order lookup.

## Features
- Student menu, live stock display, cart and order placement
- Staff order board and order-status updates
- Inventory restocking
- Order lookup using the backend 2-3-4 tree
- AI-style menu suggestions and sales summary
- In-app WhatsApp bot demonstration
- Persistent orders and inventory in `data/db.json`

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000

## GitHub Codespaces

Run `npm install`, then `npm start`. Forward port 3000 when prompted.

## Important notes

- The WhatsApp screen is an in-app bot simulation. Real WhatsApp messaging requires the Meta WhatsApp Business Cloud API and server-side webhook configuration.
- The suggestion feature is local rule-based logic. Keep hosted AI API keys in environment variables and never place secret keys in frontend JavaScript.
- Replace the JSON storage with PostgreSQL or MongoDB for production or multiple server instances.

# Vercel Deployment for ExaMonitor

This document explains the configuration added to allow deploying the ExaMonitor project to Vercel.

## Files Added

1.  **`vercel.json`**: This is the main configuration file for Vercel. It defines how to build and route the frontend and backend of your monorepo.
    *   It configures Vercel to build the Vite frontend located in the `examonitor-vite` directory.
    *   It configures the Node.js Express server from the `server` directory to run as a serverless function.
    *   It sets up routing rules:
        *   Requests starting with `/api/` are sent to the backend server.
        *   All other requests are handled by the frontend, with a fallback to `index.html` to support the Single-Page Application (SPA) routing.

2.  **`server/vercel.js`**: This file was created to serve as a Vercel-compatible entry point for the backend.

## Important: Real-Time Features (Socket.io)

**The current real-time features (like chat and live notifications) implemented with `socket.io` will not work with this Vercel deployment.**

### Why?

Your backend server in `server/src/index.js` is a **stateful** server that creates a persistent WebSocket connection. Vercel's default hosting plan uses **stateless** serverless functions. These functions are designed to handle HTTP requests and responses, but they cannot maintain a long-running, stateful connection required by your current `socket.io` setup.

The `server/vercel.js` file that was added only exports your Express application to handle the REST API routes, omitting the `socket.io` server.

### How to Fix This?

To get your real-time features working on a platform like Vercel, you have a few options:

1.  **Use a Third-Party Service**: Integrate a managed service for WebSockets like [Pusher](https://pusher.com/) or [Ably](https://ably.com/). You would use their SDKs on your frontend and backend. This is often the easiest and most scalable solution.
2.  **Deploy the Socket.io Server Separately**: Host your stateful Node.js server (the one in `server/src/index.js`) on a different platform that supports long-running processes (e.g., [Railway](https://railway.app/), [Render](https://render.com/), or a traditional VPS). Your Vercel-hosted frontend would then connect to that server's URL.
3.  **Vercel Pro/Enterprise Plan**: Vercel does offer solutions for WebSockets on their paid plans, which might be another avenue to explore.

With the current setup, your REST API endpoints and the React application will be fully functional on Vercel.

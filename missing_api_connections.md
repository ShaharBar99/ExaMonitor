# Missing API Connections

This document lists the API endpoints that are used in the frontend but are not implemented on the server.

## Bot API (`/api/bot`)

- `POST /api/bot/chat`: Used in `examonitor-vite/src/api/BotApi.js` for sending chat messages to the bot.
- `GET /api/bot/status`: Used in `examonitor-vite/src/api/BotApi.js` to get the bot's status.

**Files to create/edit:**
- `server/src/routes/botRoutes.js` (create)
- `server/src/controllers/botController.js` (create)
- `server/src/services/botService.js` (create)

## Incidents API (`/api/incidents`)

- `POST /incidents`: Used in `examonitor-vite/src/api/incidentsApi.js` to report an incident.
- `POST /incidents/call-manager`: Used in `examonitor-vite/src/api/incidentsApi.js` to call a floor manager.

**Files to create/edit:**
- `server/src/routes/incidentRoutes.js` (create)
- `server/src/controllers/incidentController.js` (create)
- `server/src/services/incidentService.js` (create)
- `server/src/app.js` (add incident routes)

## Notifications API (`/api/notifications`)

- `GET /notifications?contextId={contextId}`: Used in `examonitor-vite/src/api/incidentsApi.js` to get notifications.

**Files to create/edit:**
- `server/src/routes/notificationRoutes.js` (create)
- `server/src/controllers/notificationController.js` (create)
- `server/src/services/notificationService.js` (edit)
- `server/src/app.js` (add notification routes)

## Attendance API (`/api/attendance`)

The frontend `attendanceApi.js` is a mess and needs to be rewritten. The server has `GET /attendance` and `POST /attendance/mark` which are not used. The frontend expects:

- `GET /rooms/{roomId}/students`
- `PATCH /students/{studentId}/status`
- `GET /exams/floor/{floorId}`
- `PATCH /rooms/{roomId}/supervisor`
- `GET /rooms/summary?floor={floorId}`

This requires a bigger refactoring effort. For now, I will focus on implementing the missing `bot`, `incident`, and `notification` APIs.

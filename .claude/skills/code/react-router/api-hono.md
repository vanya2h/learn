# API routes go through Hono

Never put API logic directly into React Router actions if it belongs on `src/server/routes/`. Page actions (form submissions that redirect) are fine in route files. JSON API endpoints belong in Hono.

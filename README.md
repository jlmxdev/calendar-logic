# Calendar App (Google Calendar–style) — Replit Ready

## Run
- Click **Run** (or `npm run dev` in the shell). This will:
  - install deps in the root, server, and web workspaces
  - launch the **API** on port **4000**
  - launch the **web** (Vite) on port **5173**

Use the Replit **Open in a new tab** button for each exposed port if they don't auto-open.

### Environment
- Frontend uses `VITE_API_URL` from the root script; when running on Replit, it defaults to `http://localhost:4000`.
- For production or if your API runs elsewhere, set `VITE_API_URL` in `web/.env`

## Project Structure
- `server/`: Express + TypeScript + SQLite + RRULE expansion + ICS import/export
- `web/`: React + Vite + Tailwind

## Notes
- First run will create `server/calendar.sqlite`.
- To reset data, delete that file and restart.

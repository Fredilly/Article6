## Live data checklist (Vercel)

1) Set these ENV VARS in **Development, Preview, and Production**:
   - GOOGLE_SHEETS_CLIENT_EMAIL
   - GOOGLE_SHEETS_PRIVATE_KEY  (multiline, no quotes)
   - GOOGLE_SHEETS_SHEET_ID
   - GOOGLE_SHEETS_TAB_NAME = Leaderboard

2) After any env change → trigger a new deployment (envs are captured at build).

3) Confirm health per deploy:
   - /api/leaderboard/health → ok:true, same SA & sheet tail across environments.

4) All Sheets routes are **Node runtime** and set `Cache-Control: no-store`.

5) SSR does **not** self-fetch the API; it calls the shared helper directly.

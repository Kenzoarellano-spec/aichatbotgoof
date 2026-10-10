# Fred

Next.js chat app with a streaming backend powered by Groq. The system prompt is in `lib/prompt.ts`.

## Project structure

- `app/` — pages, shared styles, and API routes. The chat endpoint is in `app/api/chat/`.
- `components/` — reusable interface components, including the chat UI.
- `lib/` — shared application logic, including the system prompt.
- `.env.example` — environment variable template. Copy it to `.env.local` for local development.

## Run it

1. Install [Node.js LTS](https://nodejs.org/) if you don't have it.
2. Create an API key in the [Groq console](https://console.groq.com/keys).
3. In this folder, copy the example environment file:

```bash
npm install
copy .env.example .env.local
```

4. Add your key to `.env.local` as `GROQ_API_KEY`. The default model is `llama-3.3-70b-versatile`; set `GROQ_MODEL` there to choose another Groq model available to your account.
5. `npm run dev` and open [http://localhost:3000](http://localhost:3000).

If PowerShell blocks `npm`, use:

```powershell
& "C:\Program Files\nodejs\npm.cmd" run dev
```

Keep the API key in `.env.local`; never put it in client-side code or commit it. If switching from a previous provider, replace its API key with your Groq key. Restart the dev server after changing environment variables.

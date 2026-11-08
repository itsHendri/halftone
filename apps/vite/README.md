# Halftone (Vite + Workers)

A web app on Vite, React Router and Cloudflare Workers, built from [Halftone](https://halftonedesignsystem.com)'s
web kit: a dashboard with an overview, a projects table and settings, light and dark, and a Worker that answers
`/api` with sample data. A starting point for an internal tool, a dashboard or a prototype.

```bash
npx giget@latest gh:itsHendri/halftone/apps/vite my-app
cd my-app && npm install
npm run dev        # http://localhost:5173
npm run deploy     # to Cloudflare Workers (asks you to log in the first time)
```

Re-brand it with a theme from [Studio](https://halftonedesignsystem.com/studio): `npm run theme -- apply <code>`.
Add components with `npx shadcn@latest add @halftone-web/<name>`.

`AGENTS.md` is the guide for you and your coding agent: the layout, the commands, and how to swap the sample data
for a database.

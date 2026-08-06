# Florence Frontend

## Commands

- `npm ci` installs the locked dependencies.
- `npm run dev` starts Vite; `/api/*` is proxied to `VITE_API_URL`, defaulting to `http://localhost:7055`.
- `npm run lint` runs Oxlint using `.oxlintrc.json`.
- `npm run build` must be used for verification: it runs `tsc -b` and then `vite build`.
- `npm run preview` serves the built `dist/` output.
- There is no test script or test suite in this repository.

## Structure

- `src/main.tsx` is the browser entrypoint; `src/App.tsx` owns providers, lazy routes, and protected routing.
- `src/pages/` contains route pages, `src/components/` contains shared and shadcn UI, and `src/widgets/` contains dashboard widgets.
- Zustand stores client state; TanStack React Query handles server state; Axios setup is in `src/lib/api.ts`.
- `@/*` resolves to `src/*` in TypeScript and Vite.
- The backend is not in this repository. The frontend expects the FastAPI API under `/api/v1/*`.

## Conventions And Gotchas

- TypeScript is strict about unused locals/parameters, `verbatimModuleSyntax`, `erasableSyntaxOnly`, and fallthrough cases; `tsc -b` catches issues Oxlint does not.
- Tailwind CSS 4 is CSS-first in `src/index.css`; there is no Tailwind config. shadcn settings and aliases are in `components.json`.
- Turkish is the default/fallback locale; translations live in `src/i18n/locales/tr.json` and `en.json`.
- The app starts dark and supports theme overrides; preserve the theme variables in `index.html` and `src/index.css` when changing styling.
- API requests use same-origin `/api` and `withCredentials`; do not introduce a separate token-storage model without coordinating with the backend.
- Copy `.env.example` to `.env` for local configuration. Supported frontend variables are `VITE_API_URL` and `VITE_PORTFOLIO_COMMISSION_RATE`; never commit `.env`.
- `dist/` is generated and ignored. The production `Dockerfile` builds the SPA, while `nginx.conf` serves it and proxies `/api/` to a Docker service named `api` on port `7055`.

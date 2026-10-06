# Context

This is the UI component of Fintekkers that provides samples on getting started with the platform. Our goal is to be open-source as much as possible, hence sharing this source code.

This UI project:

- Has a marketing front end
- Has some out-of-the-box UI pages (e.g. list portfolios; etc)

# Technologies

This project uses Svelte. For the most part it is a static website, but the UI pages that interact with the backend are server-rendered pages. This is because the Javascript ledger models implementation uses node for the APIs, and will not currently work directly out of the browser. We may add that capability down the line if there is demand.

## Getting started

Clone this repo, then run:

npm install
cd fin-ui
npm run dev

## Sign-in and API keys

Data pages call broker-service over gRPC with the user's API key (`x-api-key`),
which the server keeps in the `ft_api_key` cookie after sign-in.

- **Email and password** (`/login`, `/register`): broker's `Auth/Login` and
  `Auth/Register` return the key.
- **Google SSO** (`/login/google`): after Google verifies the email, the server
  calls broker's `Auth/ProvisionApiKey`. A first sign-in creates the account
  and its key. For a returning user, broker only hands out the existing key to
  a trusted caller, so the UI server sends `BROKER_ADMIN_KEY` as the
  `x-admin-key` header (`src/lib/grpc-auth.ts`, `brokerProvisionApiKey`).
  Broker returns the user's current key, or a new one if it has expired.

`BROKER_ADMIN_KEY` must match broker-service's value. Anyone holding it can get
any user's API key, so it lives only in server-side environment files, never
in the repo or the browser. If it is unset, returning SSO users get no API key
and `/data/profile` shows "No API key available".

On the Horizon host both services read it from `/etc/fintekkers/admin-key.env`
(root-only), loaded by systemd drop-ins (`fintekkers-ui.service.d/admin-key.conf`
and `fintekkers-broker.service.d/admin-key.conf`). To rotate it, write a new
random value there (e.g. `openssl rand -hex 32`) and restart both services.

## Publishing

Currently this code is deployed periodically to AWS. We may automate if there is reason to (e.g. publish when a new release version in Github is created)

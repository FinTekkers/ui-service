# Context

This is the UI component of Fintekkers that provides samples on getting started with the platform. Our goal is to be open-source as much as possible, hence sharing this source code.

This UI project:
* Has a marketing front end
* Has some out-of-the-box UI pages (e.g. list portfolios; etc)

# Technologies

This project uses Svelte. For the most part it is a static website, but the UI pages that interact with the backend are server-rendered pages. This is because the Javascript ledger models implementation uses node for the APIs, and will not currently work directly out of the browser. We may add that capability down the line if there is demand.

## Getting started

Clone this repo, then run:

npm install
cd fin-ui
npm run dev


## Publishing

Currently this code is deployed periodically to AWS. We may automate if there is reason to (e.g. publish when a new release version in Github is created)


Backend Notes
-------------
- Build: `npm run build`
- Dev: `npm run dev` (requires `ts-node-dev`)
- Environment: copy `.env.example` to `.env` and fill IMAP credentials and webhooks.
- On startup the backend will create the 'emails' index in Elasticsearch if missing.

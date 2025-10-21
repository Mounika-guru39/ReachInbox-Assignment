import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import pino from "pino";
import { initElastic } from "./elasticsearch";
import { startImapWorkers } from "./imapSync";
import emailsRouter from "./routes/emails";

dotenv.config();
const log = pino();

const PORT = process.env.PORT || 3000;
const app = express();
app.use(bodyParser.json());

app.use("/api/emails", emailsRouter);

app.get("/health", async (req, res) => {
  res.json({ ok: true });
});

async function start() {
  try {
    await initElastic();
    // Start IMAP workers (2 accounts expected)
    startImapWorkers().catch((e) => log.error(e, "IMAP worker failed"));
    app.listen(PORT, () => {
      log.info(`Server listening on ${PORT}`);
    });
  } catch (err) {
    log.error(err);
    process.exit(1);
  }
}

start();

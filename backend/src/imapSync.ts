/**
 * IMAP IDLE skeleton using node-imap.
 * - On first run, performs initial sync for the last 30 days (ENVELOPE & BODYSTRUCTURE)
 * - Then enters IDLE to listen for new emails and indexes them into Elasticsearch.
 *
 * NOTE: You MUST provide IMAP credentials via environment variables (.env)
 */

import Imap from "node-imap";
import { simpleParser } from "mailparser";
import dotenv from "dotenv";
import pino from "pino";
import { indexEmail } from "./elasticsearch";
import { promisify } from "util";

dotenv.config();
const log = pino();

type ImapAccountConfig = {
  user: string;
  password: string;
  host: string;
  port: number;
  tls?: boolean;
};

function makeImapConfig(prefix: string): ImapAccountConfig | null {
  const user = process.env[`${prefix}_USER`];
  const pass = process.env[`${prefix}_PASS`];
  const host = process.env[`${prefix}_HOST`];
  const port = parseInt(process.env[`${prefix}_PORT`] || "993", 10);
  if (!user || !pass || !host) return null;
  return { user, password: pass, host, port, tls: true };
}

async function performInitialSync(imap: Imap, accountId: string) {
  // Fetch last 30 days of emails from INBOX
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  return new Promise<void>((resolve, reject) => {
    imap.openBox("INBOX", true, (err, box) => {
      if (err) return reject(err);
      const criteria = [["SINCE", since.toISOString()]];
      imap.search(criteria, (err2, results) => {
        if (err2) return reject(err2);
        if (!results || results.length === 0) {
          log.info("No messages found for initial sync");
          resolve();
          return;
        }
        const f = imap.fetch(results, { bodies: "", struct: true });
        f.on("message", (msg, seqno) => {
          let attributes: any = {};
          msg.on("attributes", (attrs) => (attributes = attrs));
          msg.on("body", async (stream) => {
            try {
              const parsed = await simpleParser(stream);
              const doc = {
                id: attributes.uid ? String(attributes.uid) : `${accountId}-${seqno}`,
                accountId,
                folder: "INBOX",
                subject: parsed.subject || "",
                body: parsed.text || parsed.html || "",
                from: parsed.from?.text || "",
                to: parsed.to?.value?.map((v:any)=>v.address) || [],
                date: parsed.date || new Date(),
                aiCategory: "Uncategorized",
                indexedAt: new Date()
              };
              await indexEmail(doc);
            } catch (e) {
              log.error(e, "Failed parsing message during initial sync");
            }
          });
        });
        f.on("error", (e) => reject(e));
        f.on("end", () => resolve());
      });
    });
  });
}

export async function startImapWorkers() {
  const accounts = ["IMAP_1", "IMAP_2"];
  for (const prefix of accounts) {
    const cfg = makeImapConfig(prefix);
    if (!cfg) {
      log.warn(`IMAP config ${prefix} not found in environment - skipping`);
      continue;
    }
    startWorker(cfg, process.env[`${prefix}_USER`] || "unknown");
  }
}

function startWorker(cfg: any, accountId: string) {
  const imap = new Imap({
    user: cfg.user,
    password: cfg.password,
    host: cfg.host,
    port: cfg.port,
    tls: cfg.tls !== false,
    keepalive: { interval: 300000, idleInterval: 300000 }
  });

  function openInbox(cb: any) {
    imap.openBox("INBOX", true, cb);
  }

  imap.once("ready", async function () {
    log.info(`IMAP ready for ${accountId}`);
    try {
      await performInitialSync(imap, accountId);
    } catch (e) {
      log.error(e, "Initial sync error");
    }

    // IDLE: listen for new mail
    imap.on("mail", (numNewMsgs) => {
      log.info({ numNewMsgs }, "New mail event");
      const f = imap.seq.fetch(`${imap.seqno}:${imap.seqno + numNewMsgs - 1}`, { bodies: "" });
      f.on("message", (msg, seqno) => {
        let attrs: any = {};
        msg.on("attributes", (a) => (attrs = a));
        msg.on("body", async (stream) => {
          try {
            const parsed = await simpleParser(stream);
            const doc = {
              id: attrs.uid ? String(attrs.uid) : `${accountId}-${seqno}-${Date.now()}`,
              accountId,
              folder: "INBOX",
              subject: parsed.subject || "",
              body: parsed.text || parsed.html || "",
              from: parsed.from?.text || "",
              to: parsed.to?.value?.map((v:any)=>v.address) || [],
                date: parsed.date || new Date(),
                aiCategory: "Uncategorized",
                indexedAt: new Date()
            };
            await indexEmail(doc);
          } catch (e) {
            log.error(e, "Failed parsing new message");
          }
        });
      });
    });

    imap.on("error", (err) => {
      log.error(err, "IMAP error - scheduling reconnect");
      setTimeout(() => {
        imap.end();
        startWorker(cfg, accountId);
      }, 5000);
    });

    // Keep the connection alive (IDLE). node-imap internally handles IDLE when no command pending.
  });

  imap.once("end", () => {
    log.info("Connection ended for " + accountId);
    // reconnect
    setTimeout(() => startWorker(cfg, accountId), 5000);
  });

  imap.connect();
}

import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";
import pino from "pino";

dotenv.config();
const log = pino();

export const client = new Client({ node: process.env.ELASTIC_URL || "http://localhost:9200" });

export async function initElastic() {
  const index = "emails";
  const exists = await client.indices.exists({ index });
  if (!exists.body) {
    log.info("Creating emails index in Elasticsearch");
    await client.indices.create({
      index,
      body: {
        mappings: {
          properties: {
            subject: { type: "text" },
            body: { type: "text" },
            accountId: { type: "keyword" },
            folder: { type: "keyword" },
            date: { type: "date" },
            aiCategory: { type: "keyword" },
            indexedAt: { type: "date" }
          }
        }
      }
    });
  } else {
    log.info("Emails index already exists");
  }
}

export async function indexEmail(doc: any) {
  const id = doc.id;
  await client.index({
    index: "emails",
    id,
    body: doc,
    refresh: "true"
  });
}

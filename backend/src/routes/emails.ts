import express from "express";
import { client } from "../elasticsearch";

const router = express.Router();

// GET /api/emails - paginated list
router.get("/", async (req, res) => {
  const from = parseInt(req.query.from as string || "0", 10);
  const size = parseInt(req.query.size as string || "20", 10);
  const resp = await client.search({
    index: "emails",
    from,
    size,
    query: { match_all: {} }
  });
  const hits = resp.body.hits.hits.map((h:any)=> ({ id: h._id, ...h._source }));
  res.json({ total: resp.body.hits.total, results: hits });
});

// GET /api/emails/search?q=...&account=...&folder=...
router.get("/search", async (req, res) => {
  const q = req.query.q as string || "";
  const account = req.query.account as string | undefined;
  const folder = req.query.folder as string | undefined;
  const from = parseInt(req.query.from as string || "0", 10);
  const size = parseInt(req.query.size as string || "20", 10);

  const must:any[] = [];
  if (q) must.push({ multi_match: { query: q, fields: ["subject", "body"] } });
  else must.push({ match_all: {} });

  const filter:any[] = [];
  if (account) filter.push({ term: { accountId: account } });
  if (folder) filter.push({ term: { folder: folder } });

  const body:any = {
    from,
    size,
    query: {
      bool: {
        must,
        filter
      }
    }
  };

  const resp = await client.search({ index: "emails", body });
  const hits = resp.body.hits.hits.map((h:any)=> ({ id: h._id, ...h._source }));
  res.json({ total: resp.body.hits.total, results: hits });
});

export default router;

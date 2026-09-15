import http from "node:http";
import pg from "pg";
import { getSeedData } from "./src/notula-context/seedData.js";

const { Pool } = pg;
const PORT = process.env.PORT || 3088;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ponytail: schema migration via raw DDL; add migration tool when schema evolution requires rollbacks.
async function initDb() {
  await pool.query(`
    CREATE SCHEMA IF NOT EXISTS notula;
    CREATE TABLE IF NOT EXISTS notula.meetings (
      id TEXT PRIMARY KEY,
      judul TEXT NOT NULL,
      jenis TEXT NOT NULL,
      tanggal TEXT NOT NULL,
      waktu TEXT,
      tempat TEXT,
      pemimpin TEXT,
      notulis TEXT,
      peserta TEXT,
      status TEXT DEFAULT 'draf',
      agenda TEXT,
      catatan TEXT,
      keputusan TEXT,
      created_at BIGINT
    );

    CREATE TABLE IF NOT EXISTS notula.questions (
      id TEXT PRIMARY KEY,
      mid TEXT NOT NULL REFERENCES notula.meetings(id) ON DELETE CASCADE,
      penanya TEXT,
      unit TEXT,
      teks TEXT NOT NULL,
      kategori TEXT DEFAULT 'Lainnya',
      prioritas TEXT DEFAULT 'Sedang',
      status TEXT DEFAULT 'baru',
      dibacakan BOOLEAN DEFAULT FALSE,
      rencana TEXT,
      output TEXT DEFAULT 'Belum ditentukan',
      pic TEXT,
      tenggat TEXT,
      progres INT DEFAULT 0,
      keterangan TEXT,
      log JSONB DEFAULT '[]'::jsonb,
      created_at BIGINT
    );
  `);

  const countRes = await pool.query("SELECT COUNT(*) FROM notula.meetings;");
  if (parseInt(countRes.rows[0].count, 10) === 0) {
    console.log("Seeding database with initial sample data...");
    await seedData(getSeedData());
  }
}

async function seedData({ meetings = [], questions = [] }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN;");
    await client.query("DELETE FROM notula.questions;");
    await client.query("DELETE FROM notula.meetings;");

    for (const m of meetings) {
      await client.query(
        `INSERT INTO notula.meetings (
          id, judul, jenis, tanggal, waktu, tempat, pemimpin, notulis, peserta, status, agenda, catatan, keputusan, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);`,
        [
          m.id,
          m.judul,
          m.jenis,
          m.tanggal,
          m.waktu || "",
          m.tempat || "",
          m.pemimpin || "",
          m.notulis || "",
          m.peserta || "",
          m.status || "draf",
          m.agenda || "",
          m.catatan || "",
          m.keputusan || "",
          m.createdAt || m.created_at || Date.now(),
        ]
      );
    }

    for (const q of questions) {
      await client.query(
        `INSERT INTO notula.questions (
          id, mid, penanya, unit, teks, kategori, prioritas, status, dibacakan, rencana, output, pic, tenggat, progres, keterangan, log, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17);`,
        [
          q.id,
          q.mid,
          q.penanya || "",
          q.unit || "",
          q.teks,
          q.kategori || "Lainnya",
          q.prioritas || "Sedang",
          q.status || "baru",
          Boolean(q.dibacakan),
          q.rencana || "",
          q.output || "Belum ditentukan",
          q.pic || "",
          q.tenggat || "",
          Number(q.progres || 0),
          q.keterangan || "",
          JSON.stringify(q.log || []),
          q.createdAt || q.created_at || Date.now(),
        ]
      );
    }

    await client.query("COMMIT;");
  } catch (err) {
    await client.query("ROLLBACK;");
    throw err;
  } finally {
    client.release();
  }
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString();
  return raw ? JSON.parse(raw) : {};
}

function mapQuestion(q) {
  return {
    ...q,
    createdAt: Number(q.created_at || q.createdAt || Date.now()),
    log: typeof q.log === "string" ? JSON.parse(q.log) : (q.log || []),
    dibacakan: Boolean(q.dibacakan),
    progres: Number(q.progres || 0),
  };
}

function mapMeeting(m) {
  return {
    ...m,
    createdAt: Number(m.created_at || m.createdAt || Date.now()),
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    // GET /api/data
    if (req.method === "GET" && path === "/api/data") {
      const [meetingsRes, questionsRes] = await Promise.all([
        pool.query("SELECT * FROM notula.meetings ORDER BY tanggal DESC, created_at DESC;"),
        pool.query("SELECT * FROM notula.questions ORDER BY created_at DESC;"),
      ]);
      return sendJson(res, {
        meetings: meetingsRes.rows.map(mapMeeting),
        questions: questionsRes.rows.map(mapQuestion),
      });
    }

    // POST /api/meetings
    if (req.method === "POST" && path === "/api/meetings") {
      const body = await readBody(req);
      const id = body.id || `m-${Math.random().toString(36).slice(2, 9)}`;
      const now = Date.now();
      const insertRes = await pool.query(
        `INSERT INTO notula.meetings (
          id, judul, jenis, tanggal, waktu, tempat, pemimpin, notulis, peserta, status, agenda, catatan, keputusan, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *;`,
        [
          id,
          body.judul || "Rapat Tanpa Judul",
          body.jenis || "Lainnya",
          body.tanggal || new Date().toISOString().slice(0, 10),
          body.waktu || "",
          body.tempat || "",
          body.pemimpin || "",
          body.notulis || "",
          body.peserta || "",
          body.status || "draf",
          body.agenda || "",
          body.catatan || "",
          body.keputusan || "",
          now,
        ]
      );
      return sendJson(res, mapMeeting(insertRes.rows[0]), 201);
    }

    // PUT /api/meetings/:id
    if (req.method === "PUT" && path.startsWith("/api/meetings/")) {
      const id = decodeURIComponent(path.split("/")[3]);
      const body = await readBody(req);
      const fields = [];
      const values = [];
      let idx = 1;

      const allowed = [
        "judul", "jenis", "tanggal", "waktu", "tempat",
        "pemimpin", "notulis", "peserta", "status",
        "agenda", "catatan", "keputusan",
      ];

      for (const key of allowed) {
        if (body[key] !== undefined) {
          fields.push(`${key} = $${idx++}`);
          values.push(body[key]);
        }
      }

      if (fields.length === 0) {
        return sendJson(res, { error: "No fields to update" }, 400);
      }

      values.push(id);
      const updateRes = await pool.query(
        `UPDATE notula.meetings SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *;`,
        values
      );

      if (updateRes.rows.length === 0) {
        return sendJson(res, { error: "Meeting not found" }, 404);
      }
      return sendJson(res, mapMeeting(updateRes.rows[0]));
    }

    // DELETE /api/meetings/:id
    if (req.method === "DELETE" && path.startsWith("/api/meetings/")) {
      const id = decodeURIComponent(path.split("/")[3]);
      await pool.query("DELETE FROM notula.meetings WHERE id = $1;", [id]);
      return sendJson(res, { success: true, id });
    }

    // POST /api/questions
    if (req.method === "POST" && path === "/api/questions") {
      const body = await readBody(req);
      const id = body.id || `q-${Math.random().toString(36).slice(2, 9)}`;
      const now = Date.now();
      const defaultLog = [{ ts: now, teks: "Pertanyaan dicatat ke dalam sistem Notula SMK Hassina." }];
      const log = body.log && Array.isArray(body.log) ? body.log : defaultLog;

      const insertRes = await pool.query(
        `INSERT INTO notula.questions (
          id, mid, penanya, unit, teks, kategori, prioritas, status, dibacakan, rencana, output, pic, tenggat, progres, keterangan, log, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *;`,
        [
          id,
          body.mid,
          body.penanya || "",
          body.unit || "",
          body.teks || "",
          body.kategori || "Lainnya",
          body.prioritas || "Sedang",
          body.status || "baru",
          Boolean(body.dibacakan),
          body.rencana || "",
          body.output || "Belum ditentukan",
          body.pic || "",
          body.tenggat || "",
          Number(body.progres || 0),
          body.keterangan || "",
          JSON.stringify(log),
          now,
        ]
      );
      return sendJson(res, mapQuestion(insertRes.rows[0]), 201);
    }

    // PUT /api/questions/:id
    if (req.method === "PUT" && path.startsWith("/api/questions/")) {
      const id = decodeURIComponent(path.split("/")[3]);
      const body = await readBody(req);

      // Fetch existing row for log merging
      const curr = await pool.query("SELECT * FROM notula.questions WHERE id = $1;", [id]);
      if (curr.rows.length === 0) {
        return sendJson(res, { error: "Question not found" }, 404);
      }

      let logArr = typeof curr.rows[0].log === "string" ? JSON.parse(curr.rows[0].log) : (curr.rows[0].log || []);
      if (body.logTeks && typeof body.logTeks === "string" && body.logTeks.trim()) {
        logArr = [{ ts: Date.now(), teks: body.logTeks.trim() }, ...logArr];
      } else if (Array.isArray(body.log)) {
        logArr = body.log;
      }

      const fields = [];
      const values = [];
      let idx = 1;

      const allowed = [
        "mid", "penanya", "unit", "teks", "kategori",
        "prioritas", "status", "dibacakan", "rencana",
        "output", "pic", "tenggat", "progres", "keterangan",
      ];

      for (const key of allowed) {
        if (body[key] !== undefined) {
          fields.push(`${key} = $${idx++}`);
          values.push(key === "progres" ? Number(body[key]) : body[key]);
        }
      }

      fields.push(`log = $${idx++}`);
      values.push(JSON.stringify(logArr));

      values.push(id);
      const updateRes = await pool.query(
        `UPDATE notula.questions SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *;`,
        values
      );

      return sendJson(res, mapQuestion(updateRes.rows[0]));
    }

    // DELETE /api/questions/:id
    if (req.method === "DELETE" && path.startsWith("/api/questions/")) {
      const id = decodeURIComponent(path.split("/")[3]);
      await pool.query("DELETE FROM notula.questions WHERE id = $1;", [id]);
      return sendJson(res, { success: true, id });
    }

    // POST /api/reset
    if (req.method === "POST" && path === "/api/reset") {
      await seedData(getSeedData());
      const [meetingsRes, questionsRes] = await Promise.all([
        pool.query("SELECT * FROM notula.meetings ORDER BY tanggal DESC;"),
        pool.query("SELECT * FROM notula.questions ORDER BY created_at DESC;"),
      ]);
      return sendJson(res, {
        meetings: meetingsRes.rows.map(mapMeeting),
        questions: questionsRes.rows.map(mapQuestion),
      });
    }

    // POST /api/import
    if (req.method === "POST" && path === "/api/import") {
      const body = await readBody(req);
      if (Array.isArray(body.meetings) && Array.isArray(body.questions)) {
        await seedData(body);
        return sendJson(res, { success: true });
      }
      return sendJson(res, { error: "Invalid import format" }, 400);
    }

    sendJson(res, { error: "Not found" }, 404);
  } catch (err) {
    console.error("API error:", err);
    sendJson(res, { error: err.message || "Internal server error" }, 500);
  }
});

initDb()
  .then(() => {
    server.listen(PORT, "127.0.0.1", () => {
      console.log(`Notula API server listening on http://127.0.0.1:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });

import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import nodePath from "node:path";
import pg from "pg";
import { getSeedData } from "./src/notula-context/seedData.js";

const { Pool } = pg;
const PORT = process.env.PORT || 3088;
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || "smk-hassina-notula-secret-key-2026";

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Password Hashing via native crypto (scrypt)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, originalHash] = storedHash.split(":");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(originalHash));
}

// Token generation & verification via HMAC-SHA256
function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 14 * 86400000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

async function getAuthUser(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  const payload = verifyToken(token);
  if (!payload || !payload.id) return null;

  const res = await pool.query("SELECT id, username, email, nama, role, unit, avatar FROM notula.users WHERE id = $1;", [payload.id]);
  return res.rows[0] || null;
}

const DEFAULT_USERS = [
  {
    id: "usr-superadmin",
    username: "admin",
    email: "admin@smkhassina.sch.id",
    password: "admin123",
    nama: "Kepala Sekolah / Super Admin",
    role: "superadmin",
    unit: "Pimpinan SMK Hassina",
  },
  {
    id: "usr-moderator",
    username: "notulen",
    email: "notulis@smkhassina.sch.id",
    password: "notulis123",
    nama: "Aryani, S.Kom. (Notulen)",
    role: "moderator",
    unit: "Tata Usaha / Notulis",
  },
  {
    id: "usr-guru-1",
    username: "guru",
    email: "guru@smkhassina.sch.id",
    password: "guru123",
    nama: "Rina Marlina, S.Pd.",
    role: "guru",
    unit: "Guru Bahasa Indonesia",
  },
  {
    id: "usr-guru-2",
    username: "hendra",
    email: "hendra@smkhassina.sch.id",
    password: "guru123",
    nama: "Hendra Saputra, S.Kom.",
    role: "guru",
    unit: "Guru Informatika / TJKT",
  },
];

// ponytail: schema migration via raw DDL; add migration tool when schema evolution requires rollbacks.
async function initDb() {
  await pool.query(`
    CREATE SCHEMA IF NOT EXISTS notula;

    CREATE TABLE IF NOT EXISTS notula.users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nama TEXT NOT NULL,
      role TEXT NOT NULL,
      unit TEXT,
      avatar TEXT,
      created_at BIGINT
    );

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
      created_at BIGINT,
      is_finalized BOOLEAN DEFAULT FALSE,
      finalized_by TEXT,
      finalized_at BIGINT,
      dokumentasi JSONB DEFAULT '[]'::jsonb
    );

    ALTER TABLE notula.meetings ADD COLUMN IF NOT EXISTS dokumentasi JSONB DEFAULT '[]'::jsonb;

    CREATE TABLE IF NOT EXISTS notula.questions (
      id TEXT PRIMARY KEY,
      mid TEXT NOT NULL REFERENCES notula.meetings(id) ON DELETE CASCADE,
      user_id TEXT,
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
      created_at BIGINT,
      lampiran JSONB DEFAULT '[]'::jsonb
    );

    ALTER TABLE notula.questions ADD COLUMN IF NOT EXISTS lampiran JSONB DEFAULT '[]'::jsonb;
  `);

  // Seed default users if empty
  const usersCount = await pool.query("SELECT COUNT(*) FROM notula.users;");
  if (parseInt(usersCount.rows[0].count, 10) === 0) {
    console.log("Seeding default authentication users...");
    for (const u of DEFAULT_USERS) {
      const hash = hashPassword(u.password);
      await pool.query(
        `INSERT INTO notula.users (id, username, email, password_hash, nama, role, unit, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (username) DO NOTHING;`,
        [u.id, u.username, u.email, hash, u.nama, u.role, u.unit, Date.now()]
      );
    }
  }

  // Seed meetings if empty
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
          id, judul, jenis, tanggal, waktu, tempat, pemimpin, notulis, peserta, status, agenda, catatan, keputusan, created_at, is_finalized, finalized_by, finalized_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17);`,
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
          Boolean(m.is_finalized),
          m.finalized_by || null,
          m.finalized_at || null,
        ]
      );
    }

    for (const q of questions) {
      await client.query(
        `INSERT INTO notula.questions (
          id, mid, user_id, penanya, unit, teks, kategori, prioritas, status, dibacakan, rencana, output, pic, tenggat, progres, keterangan, log, created_at, lampiran
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19);`,
        [
          q.id,
          q.mid,
          q.user_id || null,
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
          JSON.stringify(q.lampiran || []),
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
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
    user_id: q.user_id || null,
    createdAt: Number(q.created_at || q.createdAt || Date.now()),
    log: typeof q.log === "string" ? JSON.parse(q.log) : (q.log || []),
    lampiran: typeof q.lampiran === "string" ? JSON.parse(q.lampiran) : (q.lampiran || []),
    dibacakan: Boolean(q.dibacakan),
    progres: Number(q.progres || 0),
  };
}

function mapMeeting(m) {
  return {
    ...m,
    is_finalized: Boolean(m.is_finalized),
    finalized_by: m.finalized_by || null,
    finalized_at: m.finalized_at ? Number(m.finalized_at) : null,
    dokumentasi: typeof m.dokumentasi === "string" ? JSON.parse(m.dokumentasi) : (m.dokumentasi || []),
    createdAt: Number(m.created_at || m.createdAt || Date.now()),
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    // -------------------------------------------------------------
    // AUTH ENDPOINTS
    // -------------------------------------------------------------

    // POST /api/auth/login
    if (req.method === "POST" && path === "/api/auth/login") {
      const { username, password } = await readBody(req);
      if (!username || !password) {
        return sendJson(res, { error: "Username/email dan password wajib diisi." }, 400);
      }

      const q = await pool.query(
        "SELECT * FROM notula.users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1);",
        [username.trim()]
      );

      if (q.rows.length === 0) {
        return sendJson(res, { error: "Akun tidak ditemukan. Periksa username atau email Anda." }, 401);
      }

      const userRow = q.rows[0];
      const valid = verifyPassword(password, userRow.password_hash);
      if (!valid) {
        return sendJson(res, { error: "Kata sandi yang Anda masukkan salah." }, 401);
      }

      const user = {
        id: userRow.id,
        username: userRow.username,
        email: userRow.email,
        nama: userRow.nama,
        role: userRow.role,
        unit: userRow.unit,
        avatar: userRow.avatar,
      };

      const token = createToken(user);
      return sendJson(res, { token, user });
    }

    // GET /api/auth/me
    if (req.method === "GET" && path === "/api/auth/me") {
      const user = await getAuthUser(req);
      if (!user) {
        return sendJson(res, { error: "Sesi tidak valid atau telah berakhir." }, 401);
      }
      return sendJson(res, { user });
    }

    // POST /api/auth/logout
    if (req.method === "POST" && path === "/api/auth/logout") {
      return sendJson(res, { success: true });
    }

    // GET /api/users (List users for admin)
    if (req.method === "GET" && path === "/api/users") {
      const usersRes = await pool.query(
        "SELECT id, username, email, nama, role, unit FROM notula.users ORDER BY role ASC, nama ASC;"
      );
      return sendJson(res, usersRes.rows);
    }

    // -------------------------------------------------------------
    // DATA & CRUD ENDPOINTS WITH ROLE VALIDATION
    // -------------------------------------------------------------

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
    // Peran: Super Admin dan Moderator (Notulen) bisa menambah rapat baru. Guru tidak bisa.
    if (req.method === "POST" && path === "/api/meetings") {
      const authUser = await getAuthUser(req);
      if (authUser && authUser.role === "guru") {
        return sendJson(res, { error: "Peran Guru hanya dapat melihat daftar rapat dan mengajukan pertanyaan." }, 403);
      }

      const body = await readBody(req);
      const id = body.id || `m-${Math.random().toString(36).slice(2, 9)}`;
      const now = Date.now();
      const insertRes = await pool.query(
        `INSERT INTO notula.meetings (
          id, judul, jenis, tanggal, waktu, tempat, pemimpin, notulis, peserta, status, agenda, catatan, keputusan, created_at, is_finalized, dokumentasi
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *;`,
        [
          id,
          body.judul || "Rapat Tanpa Judul",
          body.jenis || "Lainnya",
          body.tanggal || new Date().toISOString().slice(0, 10),
          body.waktu || "",
          body.tempat || "",
          body.pemimpin || "",
          body.notulis || (authUser ? authUser.nama : ""),
          body.peserta || "",
          body.status || "draf",
          body.agenda || "",
          body.catatan || "",
          body.keputusan || "",
          now,
          false,
          JSON.stringify(body.dokumentasi || []),
        ]
      );
      return sendJson(res, mapMeeting(insertRes.rows[0]), 201);
    }

    // PUT /api/meetings/:id
    // Skema Validasi:
    // 1. Finalisasi hanya boleh oleh Super Admin.
    // 2. Jika rapat sudah difinalisasi, catatan/risalah/info tidak boleh diubah oleh Notulen/Guru.
    // 3. Guru tidak dapat mengubah rapat sama sekali.
    if (req.method === "PUT" && path.startsWith("/api/meetings/")) {
      const id = decodeURIComponent(path.split("/")[3]);
      const authUser = await getAuthUser(req);

      if (authUser && authUser.role === "guru") {
        return sendJson(res, { error: "Peran Guru tidak diizinkan menyunting dokumen rapat." }, 403);
      }

      // Check existing meeting
      const checkM = await pool.query("SELECT * FROM notula.meetings WHERE id = $1;", [id]);
      if (checkM.rows.length === 0) {
        return sendJson(res, { error: "Dokumen rapat tidak ditemukan." }, 404);
      }
      const existingM = checkM.rows[0];

      const body = await readBody(req);

      // Handle Finalization field toggle
      if (body.is_finalized !== undefined) {
        if (authUser && authUser.role !== "superadmin") {
          return sendJson(res, { error: "Hanya Super Admin / Kepala Sekolah yang memiliki hak validasi dan finalisasi catatan rapat." }, 403);
        }
        const finalize = Boolean(body.is_finalized);
        const updateFin = await pool.query(
          `UPDATE notula.meetings SET
            is_finalized = $1,
            finalized_by = $2,
            finalized_at = $3
           WHERE id = $4 RETURNING *;`,
          [
            finalize,
            finalize ? (authUser ? authUser.nama : "Super Admin") : null,
            finalize ? Date.now() : null,
            id,
          ]
        );
        return sendJson(res, mapMeeting(updateFin.rows[0]));
      }

      // If meeting is already finalized, Moderator CANNOT modify notes/agenda/details
      if (existingM.is_finalized && authUser && authUser.role !== "superadmin") {
        return sendJson(res, { error: "Rapat ini telah difinalisasi oleh Super Admin. Catatan notulensi dan rincian rapat terkunci." }, 403);
      }

      const fields = [];
      const values = [];
      let idx = 1;

      const allowed = [
        "judul", "jenis", "tanggal", "waktu", "tempat",
        "pemimpin", "notulis", "peserta", "status",
        "agenda", "catatan", "keputusan", "dokumentasi",
      ];

      for (const key of allowed) {
        if (body[key] !== undefined) {
          fields.push(`${key} = $${idx++}`);
          if (key === "dokumentasi") {
            values.push(typeof body[key] === "string" ? body[key] : JSON.stringify(body[key]));
          } else {
            values.push(body[key]);
          }
        }
      }

      if (fields.length === 0) {
        return sendJson(res, { error: "Tidak ada data yang diperbarui." }, 400);
      }

      values.push(id);
      const updateRes = await pool.query(
        `UPDATE notula.meetings SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *;`,
        values
      );

      return sendJson(res, mapMeeting(updateRes.rows[0]));
    }

    // DELETE /api/meetings/:id
    // Hanya Super Admin yang berhak menghapus rapat
    if (req.method === "DELETE" && path.startsWith("/api/meetings/")) {
      const authUser = await getAuthUser(req);
      if (authUser && authUser.role !== "superadmin") {
        return sendJson(res, { error: "Hanya Super Admin yang diizinkan menghapus dokumen rapat." }, 403);
      }

      const id = decodeURIComponent(path.split("/")[3]);
      await pool.query("DELETE FROM notula.meetings WHERE id = $1;", [id]);
      return sendJson(res, { success: true, id });
    }

    // POST /api/questions
    // Peran: Semua peran (Super Admin, Moderator, Guru) bisa menambahkan pertanyaan ke rapat
    if (req.method === "POST" && path === "/api/questions") {
      const authUser = await getAuthUser(req);
      const body = await readBody(req);
      const id = body.id || `q-${Math.random().toString(36).slice(2, 9)}`;
      const now = Date.now();

      // If submitted by Guru, enforce their identity as penanya & user_id
      const userId = authUser ? authUser.id : (body.user_id || null);
      const penanya = (authUser && authUser.role === "guru") ? authUser.nama : (body.penanya || "Anonim");
      const unit = (authUser && authUser.role === "guru") ? (authUser.unit || "") : (body.unit || "");

      const defaultLog = [{
        ts: now,
        teks: authUser ? `Pertanyaan dicatat oleh ${authUser.nama} (${authUser.role}).` : "Pertanyaan dicatat ke dalam sistem Notula SMK Hassina."
      }];
      const log = body.log && Array.isArray(body.log) ? body.log : defaultLog;

      const insertRes = await pool.query(
        `INSERT INTO notula.questions (
          id, mid, user_id, penanya, unit, teks, kategori, prioritas, status, dibacakan, rencana, output, pic, tenggat, progres, keterangan, log, created_at, lampiran
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *;`,
        [
          id,
          body.mid,
          userId,
          penanya,
          unit,
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
          JSON.stringify(body.lampiran || []),
        ]
      );
      return sendJson(res, mapQuestion(insertRes.rows[0]), 201);
    }

    // PUT /api/questions/:id
    // Catatan penting: Pertanyaan SELALU BISA DIEDIT oleh Notulen/Moderator dan Super Admin
    // bahkan setelah rapat difinalisasi ("rapat yang sudah di finalisasi tidak bisa ubah oleh notula kecuali pertanyaannya")
    if (req.method === "PUT" && path.startsWith("/api/questions/")) {
      const id = decodeURIComponent(path.split("/")[3]);
      const authUser = await getAuthUser(req);
      const body = await readBody(req);

      const curr = await pool.query("SELECT * FROM notula.questions WHERE id = $1;", [id]);
      if (curr.rows.length === 0) {
        return sendJson(res, { error: "Pertanyaan tidak ditemukan." }, 404);
      }

      // Guru tidak dapat mengubah status RTL / PIC pertanyaan
      if (authUser && authUser.role === "guru") {
        return sendJson(res, { error: "Peran Guru tidak diizinkan mengubah status tindak lanjut atau PIC pertanyaan." }, 403);
      }

      let logArr = typeof curr.rows[0].log === "string" ? JSON.parse(curr.rows[0].log) : (curr.rows[0].log || []);
      // Ensure all existing log items have id and type
      logArr = logArr.map((item, i) => ({
        id: item.id || `log-${item.ts || Date.now()}-${i}`,
        ts: item.ts || Date.now(),
        teks: item.teks || "",
        type: item.type || (item.teks?.includes("[Sistem]") || item.teks?.includes("Status diubah") ? "system" : "manual"),
        author: item.author || null,
      }));

      const newSystemLogs = [];
      const actorName = authUser ? authUser.nama : "Pengguna";

      // Auto-detect Priority change
      if (body.prioritas && body.prioritas !== curr.rows[0].prioritas) {
        newSystemLogs.push({
          id: `log-${Date.now()}-pri`,
          ts: Date.now(),
          teks: `Prioritas diubah dari "${curr.rows[0].prioritas || 'Sedang'}" menjadi "${body.prioritas}" oleh ${actorName}`,
          type: "system",
          author: actorName,
        });
      }

      // Auto-detect Status change
      if (body.status && body.status !== curr.rows[0].status) {
        newSystemLogs.push({
          id: `log-${Date.now()}-st`,
          ts: Date.now(),
          teks: `Status tindak lanjut diubah dari "${curr.rows[0].status || 'baru'}" menjadi "${body.status}" oleh ${actorName}`,
          type: "system",
          author: actorName,
        });
      }

      // Auto-detect Output change
      if (body.output !== undefined && body.output !== curr.rows[0].output && body.output !== (curr.rows[0].output || "Belum ditentukan")) {
        newSystemLogs.push({
          id: `log-${Date.now()}-out`,
          ts: Date.now(),
          teks: `Output ditetapkan sebagai "${body.output}" oleh ${actorName}`,
          type: "system",
          author: actorName,
        });
      }

      // Auto-detect PIC change
      if (body.pic !== undefined && (body.pic || "").trim() !== (curr.rows[0].pic || "").trim() && (body.pic || "").trim() !== "") {
        newSystemLogs.push({
          id: `log-${Date.now()}-pic`,
          ts: Date.now(),
          teks: `PIC ditugaskan ke "${body.pic}" oleh ${actorName}`,
          type: "system",
          author: actorName,
        });
      }

      // Auto-detect Lampiran change (Upload/Delete file)
      if (body.lampiran !== undefined) {
        const oldDocs = typeof curr.rows[0].lampiran === "string" ? JSON.parse(curr.rows[0].lampiran) : (curr.rows[0].lampiran || []);
        const newDocs = Array.isArray(body.lampiran) ? body.lampiran : (typeof body.lampiran === "string" ? JSON.parse(body.lampiran) : oldDocs);

        if (newDocs.length > oldDocs.length) {
          const added = newDocs.filter((n) => !oldDocs.some((o) => (o.id && o.id === n.id) || o.url === n.url));
          added.forEach((d) => {
            newSystemLogs.push({
              id: `log-${Date.now()}-doc-${Math.random().toString(36).slice(2, 5)}`,
              ts: Date.now(),
              teks: `Menambahkan berkas lampiran output: "${d.name}" oleh ${actorName}`,
              type: "system",
              author: actorName,
            });
          });
        } else if (newDocs.length < oldDocs.length) {
          const removed = oldDocs.filter((o) => !newDocs.some((n) => (n.id && n.id === o.id) || n.url === o.url));
          removed.forEach((d) => {
            newSystemLogs.push({
              id: `log-${Date.now()}-rdoc-${Math.random().toString(36).slice(2, 5)}`,
              ts: Date.now(),
              teks: `Menghapus berkas lampiran output: "${d.name}" oleh ${actorName}`,
              type: "system",
              author: actorName,
            });
          });
        }
      }

      // If user supplied updated log list directly (e.g. edited or deleted a manual log entry)
      if (Array.isArray(body.log)) {
        logArr = body.log.map((item, i) => ({
          id: item.id || `log-${item.ts || Date.now()}-${i}`,
          ts: item.ts || Date.now(),
          teks: item.teks || "",
          type: item.type || "manual",
          author: item.author || null,
        }));
      }

      // If user submitted manual log text
      if (body.logTeks && typeof body.logTeks === "string" && body.logTeks.trim()) {
        const manualItem = {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          ts: Date.now(),
          teks: body.logTeks.trim(),
          type: "manual",
          author: actorName,
        };
        logArr = [manualItem, ...logArr];
      }

      // Prepend any new auto-generated system logs
      if (newSystemLogs.length > 0) {
        logArr = [...newSystemLogs, ...logArr];
      }

      const fields = [];
      const values = [];
      let idx = 1;

      const allowed = [
        "mid", "penanya", "unit", "teks", "kategori",
        "prioritas", "status", "dibacakan", "rencana",
        "output", "pic", "tenggat", "progres", "keterangan", "lampiran",
      ];

      for (const key of allowed) {
        if (body[key] !== undefined) {
          fields.push(`${key} = $${idx++}`);
          if (key === "progres") {
            values.push(Number(body[key]));
          } else if (key === "lampiran") {
            values.push(typeof body[key] === "string" ? body[key] : JSON.stringify(body[key] || []));
          } else {
            values.push(body[key]);
          }
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
      const authUser = await getAuthUser(req);
      if (authUser && authUser.role === "guru") {
        return sendJson(res, { error: "Peran Guru tidak diizinkan menghapus pertanyaan yang telah dicatat." }, 403);
      }
      const id = decodeURIComponent(path.split("/")[3]);
      await pool.query("DELETE FROM notula.questions WHERE id = $1;", [id]);
      return sendJson(res, { success: true, id });
    }

    // POST /api/reset
    if (req.method === "POST" && path === "/api/reset") {
      const authUser = await getAuthUser(req);
      if (authUser && authUser.role !== "superadmin") {
        return sendJson(res, { error: "Hanya Super Admin yang diizinkan mereset data sampel." }, 403);
      }
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

    // POST /api/upload (Foto & Dokumen PDF)
    if (req.method === "POST" && path === "/api/upload") {
      const authUser = await getAuthUser(req);
      if (!authUser) {
        return sendJson(res, { error: "Sesi tidak valid. Silakan masuk terlebih dahulu." }, 401);
      }
      if (authUser.role === "guru") {
        return sendJson(res, { error: "Peran Guru tidak memiliki hak akses mengunggah dokumentasi rapat." }, 403);
      }

      const body = await readBody(req);
      const { name, type, size, base64 } = body;

      if (!base64 || !name) {
        return sendJson(res, { error: "Berkas tidak ditemukan atau data korup." }, 400);
      }

      // Max file size: 10 MB (10 * 1024 * 1024 bytes)
      const MAX_SIZE = 10 * 1024 * 1024;
      if (size && size > MAX_SIZE) {
        return sendJson(res, { error: "Ukuran berkas melebihi batas maksimal 10 MB." }, 400);
      }

      const ext = nodePath.extname(name).toLowerCase();
      const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
      if (!allowedExts.includes(ext)) {
        return sendJson(res, { error: "Format berkas tidak didukung. Harap unggah foto (JPG, PNG, WEBP) atau dokumen PDF." }, 400);
      }

      const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(cleanBase64, "base64");

      if (buffer.length > MAX_SIZE) {
        return sendJson(res, { error: "Ukuran berkas melebihi batas maksimal 10 MB." }, 400);
      }

      const safeBase = nodePath.basename(name, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
      const filename = `${Date.now()}_${safeBase}${ext}`;
      const uploadDir = "/var/www/notula-smk-hassina/uploads";
      const filePath = nodePath.join(uploadDir, filename);

      await fs.writeFile(filePath, buffer);

      const docObj = {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name,
        type: type || (ext === ".pdf" ? "application/pdf" : "image/" + ext.replace(".", "")),
        size: buffer.length,
        url: `/uploads/${filename}`,
        uploadedAt: Date.now(),
        uploadedBy: authUser.nama,
      };

      return sendJson(res, docObj, 201);
    }

    // Static serve fallback for /uploads/
    if (req.method === "GET" && path.startsWith("/uploads/")) {
      const fileName = path.replace("/uploads/", "");
      const safePath = nodePath.join("/var/www/notula-smk-hassina/uploads", nodePath.basename(fileName));
      try {
        const fileData = await fs.readFile(safePath);
        const ext = nodePath.extname(safePath).toLowerCase();
        let contentType = "application/octet-stream";
        if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
        else if (ext === ".png") contentType = "image/png";
        else if (ext === ".webp") contentType = "image/webp";
        else if (ext === ".pdf") contentType = "application/pdf";
        res.writeHead(200, {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=2592000",
        });
        return res.end(fileData);
      } catch (e) {
        return sendJson(res, { error: "Berkas tidak ditemukan" }, 404);
      }
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

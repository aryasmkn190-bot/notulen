import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getSeedData } from "./seedData.js";
import { useAuth } from "./AuthContext";

const NotulaContext = createContext();

const STORE_KEY = "notula_smk_hassina_v2";

export const STATUS_LIST = [
  { id: "baru", label: "Baru", tone: "light", color: "secondary" },
  { id: "proses", label: "Proses", tone: "info", color: "info" },
  { id: "perlu", label: "Perlu Tindak Lanjut", tone: "warning", color: "warning" },
  { id: "selesai", label: "Selesai", tone: "success", color: "success" },
  { id: "batal", label: "Tidak Dilanjutkan", tone: "danger", color: "danger" },
];

export const OUTPUT_LIST = [
  "Belum ditentukan",
  "Program",
  "Aturan / Kebijakan",
  "SOP",
  "Kegiatan",
  "Anggaran",
  "Informasi",
];

export const JENIS_LIST = [
  "Rapat Dinas",
  "Rapat Guru",
  "Rapat Kurikulum",
  "Rapat Kesiswaan",
  "Rapat Wali Murid",
  "Rapat Komite",
  "Lainnya",
];

export const KATEGORI_LIST = [
  "Kurikulum",
  "Kesiswaan",
  "Sarana & Prasarana",
  "Keuangan",
  "Kepegawaian",
  "Humas",
  "Kedisiplinan",
  "Lainnya",
];

export const PRIORITAS_LIST = ["Tinggi", "Sedang", "Rendah"];

export const uid = (p = "id-") => p + Math.random().toString(36).slice(2, 9);

export const DF = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const DFS = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function fDate(d, short = false) {
  if (!d) return "—";
  try {
    const dt = new Date(d + "T00:00:00");
    if (isNaN(dt)) return d;
    return (short ? DFS : DF).format(dt);
  } catch (e) {
    return d;
  }
}

export function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export function sisaHari(d) {
  if (!d) return null;
  const a = new Date(todayISO() + "T00:00:00");
  const b = new Date(d + "T00:00:00");
  return Math.round((b - a) / 86400000);
}

// ponytail: optimistic React state + background REST fetch; add WebSockets/SSE when multi-user concurrent presence is requested.
export const NotulaProvider = ({ children }) => {
  const { token, user } = useAuth();

  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.meetings)) return parsed;
      }
    } catch (e) {}
    return getSeedData();
  });

  const [connected, setConnected] = useState(false);

  const refreshFromDb = useCallback(async () => {
    try {
      const res = await fetch("/api/data");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.meetings) && Array.isArray(json.questions)) {
          setData(json);
          localStorage.setItem(STORE_KEY, JSON.stringify(json));
          setConnected(true);
        }
      }
    } catch (e) {
      console.warn("Using offline/cached Notula data:", e);
    }
  }, []);

  useEffect(() => {
    refreshFromDb();
  }, [refreshFromDb]);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch (e) {}
  }, [data]);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  // Meetings CRUD
  const addMeeting = async (m) => {
    const newM = {
      id: uid("m-"),
      status: "draf",
      agenda: "",
      catatan: "",
      keputusan: "",
      is_finalized: false,
      ...m,
    };
    setData((prev) => ({
      ...prev,
      meetings: [newM, ...prev.meetings],
    }));

    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(newM),
      });
      if (!res.ok) {
        const err = await res.json();
        refreshFromDb();
        throw new Error(err.error || "Gagal membuat rapat baru.");
      }
    } catch (err) {
      console.error("API error adding meeting:", err);
      throw err;
    }
    return newM;
  };

  const updateMeeting = async (id, fields) => {
    setData((prev) => ({
      ...prev,
      meetings: prev.meetings.map((m) =>
        m.id === id ? { ...m, ...fields } : m
      ),
    }));

    try {
      const res = await fetch(`/api/meetings/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(fields),
      });
      if (!res.ok) {
        const err = await res.json();
        refreshFromDb();
        throw new Error(err.error || "Gagal memperbarui rapat.");
      }
    } catch (err) {
      console.error("API error updating meeting:", err);
      throw err;
    }
  };

  const finalizeMeeting = async (id, isFinalized = true) => {
    try {
      const res = await fetch(`/api/meetings/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ is_finalized: isFinalized }),
      });
      const resData = await res.json();
      if (!res.ok) {
        refreshFromDb();
        throw new Error(resData.error || "Gagal mengubah status finalisasi rapat.");
      }
      setData((prev) => ({
        ...prev,
        meetings: prev.meetings.map((m) =>
          m.id === id ? { ...m, ...resData } : m
        ),
      }));
      return resData;
    } catch (err) {
      console.error("API error finalizing meeting:", err);
      throw err;
    }
  };

  const deleteMeeting = async (id) => {
    setData((prev) => ({
      ...prev,
      meetings: prev.meetings.filter((m) => m.id !== id),
      questions: prev.questions.filter((q) => q.mid !== id),
    }));

    try {
      const res = await fetch(`/api/meetings/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        refreshFromDb();
        throw new Error(err.error || "Gagal menghapus rapat.");
      }
    } catch (err) {
      console.error("API error deleting meeting:", err);
      throw err;
    }
  };

  // Questions CRUD
  const addQuestion = async (q) => {
    const penanyaName = (user && user.role === "guru") ? user.nama : (q.penanya || "Anonim");
    const unitName = (user && user.role === "guru") ? (user.unit || "") : (q.unit || "");
    const qUserId = user ? user.id : (q.user_id || null);

    const newQ = {
      id: uid("q-"),
      user_id: qUserId,
      penanya: penanyaName,
      unit: unitName,
      teks: "",
      kategori: "Lainnya",
      prioritas: "Sedang",
      status: "baru",
      dibacakan: false,
      rencana: "",
      output: "Belum ditentukan",
      pic: "",
      tenggat: "",
      progres: 0,
      keterangan: "",
      lampiran: [],
      createdAt: Date.now(),
      log: [
        {
          ts: Date.now(),
          teks: user ? `Pertanyaan dicatat oleh ${user.nama} (${user.role}).` : "Pertanyaan dicatat ke dalam sistem Notula SMK Hassina.",
        },
      ],
      ...q,
    };

    setData((prev) => ({
      ...prev,
      questions: [newQ, ...prev.questions],
    }));

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(newQ),
      });
      if (!res.ok) {
        const err = await res.json();
        refreshFromDb();
        throw new Error(err.error || "Gagal mengajukan pertanyaan.");
      }
      const saved = await res.json();
      setData((prev) => ({
        ...prev,
        questions: prev.questions.map((item) => (item.id === newQ.id ? saved : item)),
      }));
      return saved;
    } catch (err) {
      console.error("API error adding question:", err);
      throw err;
    }
  };

  const updateQuestion = async (id, fields, logTeks) => {
    setData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => {
        if (q.id !== id) return q;
        const newLog = [...q.log];
        if (logTeks) {
          const author = user ? `${user.nama} (${user.role}): ` : "";
          newLog.unshift({ ts: Date.now(), teks: `${author}${logTeks}` });
        }
        return { ...q, ...fields, log: newLog };
      }),
    }));

    try {
      const res = await fetch(`/api/questions/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ ...fields, logTeks }),
      });
      if (!res.ok) {
        const err = await res.json();
        refreshFromDb();
        throw new Error(err.error || "Gagal memperbarui pertanyaan.");
      }
    } catch (err) {
      console.error("API error updating question:", err);
      throw err;
    }
  };

  const deleteQuestion = async (id) => {
    setData((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));

    try {
      const res = await fetch(`/api/questions/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        refreshFromDb();
        throw new Error(err.error || "Gagal menghapus pertanyaan.");
      }
    } catch (err) {
      console.error("API error deleting question:", err);
      throw err;
    }
  };

  const resetSample = () => {
    const fresh = getSeedData();
    setData(fresh);
    localStorage.setItem(STORE_KEY, JSON.stringify(fresh));
    fetch("/api/reset", { method: "POST", headers: authHeaders() })
      .then((res) => res.json())
      .then((json) => {
        if (json.meetings && json.questions) {
          setData(json);
        }
      })
      .catch((err) => console.error("API error resetting sample:", err));
  };

  const importJSON = (importedData) => {
    if (
      importedData &&
      Array.isArray(importedData.meetings) &&
      Array.isArray(importedData.questions)
    ) {
      setData(importedData);
      localStorage.setItem(STORE_KEY, JSON.stringify(importedData));
      fetch("/api/import", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(importedData),
      }).catch((err) => console.error("API error importing JSON:", err));
      return true;
    }
    return false;
  };

  return (
    <NotulaContext.Provider
      value={{
        meetings: data.meetings,
        questions: data.questions,
        connected,
        refreshFromDb,
        addMeeting,
        updateMeeting,
        finalizeMeeting,
        deleteMeeting,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        resetSample,
        importJSON,
      }}
    >
      {children}
    </NotulaContext.Provider>
  );
};

export const useNotula = () => useContext(NotulaContext);

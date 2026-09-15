import React, { createContext, useContext, useState, useEffect } from "react";

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

function getSeedData() {
  const now = Date.now();
  const day = 86400000;

  const m1 = {
    id: "m-dinas",
    judul: "Rapat Dinas Awal Tahun Pelajaran 2026/2027",
    jenis: "Rapat Dinas",
    tanggal: "2026-07-13",
    waktu: "08.00 – 11.00 WIB",
    tempat: "Aula SMK Hassina",
    pemimpin: "Kepala Sekolah — Sumarno, M.Pd.",
    notulis: "Aryani — Staf Tata Usaha",
    peserta: "42 guru dan tenaga kependidikan SMK Hassina",
    status: "selesai",
    agenda:
      "1. Sambutan dan arahan kepala sekolah\n2. Pembagian tugas mengajar semester ganjil\n3. Kalender pendidikan 2026/2027\n4. Tata tertib guru dan siswa\n5. Tanya jawab & RTL",
    catatan:
      "Kepala sekolah menyampaikan hasil evaluasi tahun pelajaran sebelumnya: rata-rata kehadiran guru 96%, capaian literasi siswa naik 7 poin.\n\nWakil kurikulum memaparkan struktur jam mengajar dan meminta setiap guru menyerahkan modul ajar paling lambat 25 Juli 2026.\n\nWakil kesiswaan mengingatkan penguatan disiplin masuk pukul 07.00 dan penertiban penggunaan gawai di kelas.",
    keputusan:
      "1. Modul ajar dikumpulkan paling lambat 25 Juli 2026.\n2. Jam masuk tetap 07.00; gerbang ditutup 07.10 WIB.\n3. Dibentuk tim penyusun tata tertib penggunaan gawai.",
  };

  const m2 = {
    id: "m-kur",
    judul: "Rapat Koordinasi Kurikulum — Persiapan PTS Ganjil",
    jenis: "Rapat Kurikulum",
    tanggal: "2026-09-08",
    waktu: "13.00 – 14.30 WIB",
    tempat: "Ruang Rapat Guru SMK Hassina",
    pemimpin: "Wakil Kurikulum — Dewi Lestari, S.Pd.",
    notulis: "Aryani — Staf Tata Usaha",
    peserta: "12 ketua rumpun mata pelajaran & Kaprog",
    status: "selesai",
    agenda:
      "1. Jadwal PTS ganjil\n2. Penyusunan dan penggandaan naskah\n3. Pengawasan dan remedial\n4. Tanya jawab",
    catatan:
      "Jadwal PTS disepakati 29 September – 3 Oktober 2026. Naskah dikumpulkan ke kurikulum maksimal 19 September 2026 dalam format digital.\n\nDisepakati satu ruang cadangan untuk siswa yang mengikuti lomba.",
    keputusan:
      "1. PTS dilaksanakan 29 September – 3 Oktober 2026.\n2. Naskah masuk maksimal 19 September 2026.\n3. Remedial paling lambat dua pekan setelah PTS.",
  };

  const m3 = {
    id: "m-sis",
    judul: "Rapat Kesiswaan — Kedisiplinan & Ekstrakurikuler",
    jenis: "Rapat Kesiswaan",
    tanggal: "2026-09-14",
    waktu: "09.30 – 11.00 WIB",
    tempat: "Ruang Guru SMK Hassina",
    pemimpin: "Wakil Kesiswaan — Bagus Prakoso, S.Pd.",
    notulis: "Aryani — Staf Tata Usaha",
    peserta: "Wali kelas, pembina ekstrakurikuler, guru BK",
    status: "draf",
    agenda:
      "1. Evaluasi keterlambatan siswa bulan Agustus\n2. Pembinaan ekstrakurikuler\n3. Persiapan Bulan Bahasa\n4. Tanya jawab",
    catatan:
      "Sedang berlangsung pemaparan data absensi siswa dan keterlambatan selama Agustus.",
    keputusan: "",
  };

  const qs = [
    {
      id: "q-1",
      mid: "m-dinas",
      penanya: "Rina Marlina, S.Pd.",
      unit: "Guru Bahasa Indonesia",
      teks: "Bagaimana aturan penggunaan HP siswa di kelas? Banyak guru menegur dengan standar yang berbeda sehingga siswa bingung.",
      kategori: "Kedisiplinan",
      prioritas: "Tinggi",
      status: "selesai",
      dibacakan: true,
      rencana:
        "Tim kesiswaan + BK menyusun tata tertib penggunaan gawai, disosialisasikan ke siswa dan orang tua, lalu ditetapkan lewat SK kepala sekolah.",
      output: "Aturan / Kebijakan",
      pic: "Wakil Kesiswaan",
      tenggat: "2026-08-15",
      progres: 100,
      keterangan:
        "SK No. 421/SMK/2026 terbit 12 Agustus 2026 dan sudah disosialisasikan di semua kelas.",
      createdAt: now - 63 * day,
      log: [
        {
          ts: now - 33 * day,
          teks: "Selesai: SK penggunaan gawai ditetapkan dan disosialisasikan.",
        },
        {
          ts: now - 45 * day,
          teks: "Progres 60%: draf tata tertib dibahas bersama guru BK.",
        },
        {
          ts: now - 62 * day,
          teks: "Status menjadi Perlu Tindak Lanjut; PIC Wakil Kesiswaan.",
        },
        {
          ts: now - 63 * day,
          teks: "Pertanyaan dicatat pada Rapat Dinas Awal Tahun.",
        },
      ],
    },
    {
      id: "q-2",
      mid: "m-dinas",
      penanya: "Hendra Saputra, S.Kom.",
      unit: "Guru Informatika / TJKT",
      teks: "Apakah sekolah dapat menambah daya listrik dan titik wifi di laboratorium komputer? Koneksi sering putus saat praktik.",
      kategori: "Sarana & Prasarana",
      prioritas: "Tinggi",
      status: "proses",
      dibacakan: true,
      rencana:
        "Survei kebutuhan daya dan titik akses oleh tim sarana, ajukan penambahan daya ke PLN dan pengadaan 3 access point pada anggaran perubahan.",
      output: "Anggaran",
      pic: "Wakil Sarana & Prasarana",
      tenggat: "2026-09-30",
      progres: 55,
      keterangan: "Survei selesai; menunggu persetujuan revisi anggaran oleh komite.",
      createdAt: now - 62 * day,
      log: [
        {
          ts: now - 9 * day,
          teks: "Progres 55%: hasil survei masuk, RAB disusun Rp 18,4 juta.",
        },
        {
          ts: now - 40 * day,
          teks: "Status menjadi Proses; survei teknis dijadwalkan.",
        },
        {
          ts: now - 62 * day,
          teks: "Pertanyaan dicatat pada Rapat Dinas Awal Tahun.",
        },
      ],
    },
    {
      id: "q-3",
      mid: "m-dinas",
      penanya: "Siti Aminah, S.Pd.",
      unit: "Wali Kelas X-TJKT",
      teks: "Bagaimana mekanisme pendampingan siswa yang sering terlambat? Apakah ada program khusus, bukan hanya sanksi?",
      kategori: "Kesiswaan",
      prioritas: "Sedang",
      status: "perlu",
      dibacakan: true,
      rencana:
        "Menyusun program “Gerakan Tepat Waktu”: pendampingan BK, kunjungan rumah untuk kasus berulang, dan penghargaan kelas paling disiplin per bulan.",
      output: "Program",
      pic: "Koordinator BK",
      tenggat: "2026-09-20",
      progres: 25,
      keterangan:
        "Menunggu data keterlambatan Agustus dari tata usaha untuk menetapkan sasaran program.",
      createdAt: now - 61 * day,
      log: [
        {
          ts: now - 20 * day,
          teks: "Progres 25%: kerangka program disusun bersama guru BK.",
        },
        {
          ts: now - 61 * day,
          teks: "Pertanyaan dicatat pada Rapat Dinas Awal Tahun.",
        },
      ],
    },
    {
      id: "q-4",
      mid: "m-dinas",
      penanya: "Yusuf Hidayat, S.Ag.",
      unit: "Guru PAI",
      teks: "Apakah kegiatan pembiasaan pagi bisa dijadwalkan ulang agar tidak mengurangi jam pelajaran pertama?",
      kategori: "Kurikulum",
      prioritas: "Rendah",
      status: "batal",
      dibacakan: true,
      rencana: "",
      output: "Belum ditentukan",
      pic: "",
      tenggat: "",
      progres: 0,
      keterangan:
        "Tidak dilanjutkan tahun ini karena jadwal pembiasaan mengikuti ketentuan dinas; akan ditinjau pada evaluasi semester.",
      createdAt: now - 60 * day,
      log: [
        {
          ts: now - 58 * day,
          teks: "Tidak dilanjutkan: mengikuti ketentuan dinas, ditinjau ulang akhir semester.",
        },
        {
          ts: now - 60 * day,
          teks: "Pertanyaan dicatat pada Rapat Dinas Awal Tahun.",
        },
      ],
    },
    {
      id: "q-5",
      mid: "m-kur",
      penanya: "Dwi Kurniawan, S.Pd.",
      unit: "Ketua Rumpun MIPA",
      teks: "Apakah naskah PTS boleh memuat soal berbasis proyek (PjBL)? Jika ya, bagaimana pedoman penilaiannya?",
      kategori: "Kurikulum",
      prioritas: "Sedang",
      status: "proses",
      dibacakan: true,
      rencana:
        "Kurikulum menyusun panduan singkat soal berbasis proyek beserta rubrik penilaian, dibagikan ke semua rumpun sebelum penyusunan naskah.",
      output: "SOP",
      pic: "Wakil Kurikulum",
      tenggat: "2026-09-19",
      progres: 70,
      keterangan: "Draf panduan dan rubrik sudah jadi, menunggu review kepala sekolah.",
      createdAt: now - 6 * day,
      log: [
        {
          ts: now - 2 * day,
          teks: "Progres 70%: draf rubrik selesai, review dijadwalkan.",
        },
        {
          ts: now - 6 * day,
          teks: "Pertanyaan dicatat pada Rapat Koordinasi Kurikulum.",
        },
      ],
    },
    {
      id: "q-6",
      mid: "m-kur",
      penanya: "Nurul Fadhilah, S.Pd.",
      unit: "Ketua Rumpun Bahasa",
      teks: "Bagaimana pengaturan pengawas PTS bagi guru yang sedang mengikuti diklat pekan kedua?",
      kategori: "Kepegawaian",
      prioritas: "Sedang",
      status: "perlu",
      dibacakan: true,
      rencana:
        "Tata usaha menyusun daftar guru yang berhalangan dan menetapkan pengawas pengganti, dituangkan dalam jadwal pengawas final.",
      output: "Informasi",
      pic: "Kepala Tata Usaha",
      tenggat: "2026-09-22",
      progres: 10,
      keterangan: "Menunggu surat tugas diklat dari dinas sebagai dasar penggantian.",
      createdAt: now - 6 * day,
      log: [
        {
          ts: now - 6 * day,
          teks: "Pertanyaan dicatat pada Rapat Koordinasi Kurikulum.",
        },
      ],
    },
    {
      id: "q-7",
      mid: "m-kur",
      penanya: "Agus Riyanto, S.Pd.",
      unit: "Guru PJOK",
      teks: "Apakah remedial PTS dapat dilakukan pada jam ekstrakurikuler agar tidak mengganggu pembelajaran?",
      kategori: "Kurikulum",
      prioritas: "Rendah",
      status: "baru",
      dibacakan: false,
      rencana: "",
      output: "Belum ditentukan",
      pic: "",
      tenggat: "",
      progres: 0,
      keterangan: "",
      createdAt: now - 5 * day,
      log: [
        {
          ts: now - 5 * day,
          teks: "Pertanyaan dicatat pada Rapat Koordinasi Kurikulum.",
        },
      ],
    },
    {
      id: "q-8",
      mid: "m-sis",
      penanya: "Ratna Dewi, S.Pd.",
      unit: "Pembina OSIS",
      teks: "Bisakah anggaran Bulan Bahasa ditambah untuk lomba antarkelas dan pentas literasi SMK Hassina?",
      kategori: "Keuangan",
      prioritas: "Tinggi",
      status: "baru",
      dibacakan: false,
      rencana: "",
      output: "Belum ditentukan",
      pic: "",
      tenggat: "",
      progres: 0,
      keterangan: "",
      createdAt: now - 1 * day,
      log: [
        {
          ts: now - 1 * day,
          teks: "Pertanyaan diajukan sebelum rapat kesiswaan.",
        },
      ],
    },
    {
      id: "q-9",
      mid: "m-sis",
      penanya: "Bambang Setyo, S.Pd.",
      unit: "Wali Kelas XII-TKJ",
      teks: "Perlukah dibuat aturan tertulis tentang keterlibatan siswa dalam lomba di luar sekolah agar tidak berbenturan dengan jadwal PTS?",
      kategori: "Kesiswaan",
      prioritas: "Sedang",
      status: "baru",
      dibacakan: false,
      rencana: "",
      output: "Belum ditentukan",
      pic: "",
      tenggat: "",
      progres: 0,
      keterangan: "",
      createdAt: now - 6 * 3600000,
      log: [
        {
          ts: now - 6 * 3600000,
          teks: "Pertanyaan diajukan sebelum rapat kesiswaan.",
        },
      ],
    },
  ];

  return { meetings: [m1, m2, m3], questions: qs };
}

export const NotulaProvider = ({ children }) => {
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

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch (e) {}
  }, [data]);

  // Meetings CRUD
  const addMeeting = (m) => {
    const newM = {
      id: uid("m-"),
      status: "draf",
      agenda: "",
      catatan: "",
      keputusan: "",
      ...m,
    };
    setData((prev) => ({
      ...prev,
      meetings: [newM, ...prev.meetings],
    }));
    return newM;
  };

  const updateMeeting = (id, fields) => {
    setData((prev) => ({
      ...prev,
      meetings: prev.meetings.map((m) =>
        m.id === id ? { ...m, ...fields } : m
      ),
    }));
  };

  const deleteMeeting = (id) => {
    setData((prev) => ({
      ...prev,
      meetings: prev.meetings.filter((m) => m.id !== id),
      questions: prev.questions.filter((q) => q.mid !== id),
    }));
  };

  // Questions CRUD
  const addQuestion = (q) => {
    const newQ = {
      id: uid("q-"),
      penanya: "",
      unit: "",
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
      createdAt: Date.now(),
      log: [
        {
          ts: Date.now(),
          teks: "Pertanyaan dicatat ke dalam sistem Notula SMK Hassina.",
        },
      ],
      ...q,
    };
    setData((prev) => ({
      ...prev,
      questions: [newQ, ...prev.questions],
    }));
    return newQ;
  };

  const updateQuestion = (id, fields, logTeks) => {
    setData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => {
        if (q.id !== id) return q;
        const newLog = [...q.log];
        if (logTeks) {
          newLog.unshift({ ts: Date.now(), teks: logTeks });
        }
        return { ...q, ...fields, log: newLog };
      }),
    }));
  };

  const deleteQuestion = (id) => {
    setData((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
  };

  const resetSample = () => {
    const fresh = getSeedData();
    setData(fresh);
    localStorage.setItem(STORE_KEY, JSON.stringify(fresh));
  };

  const importJSON = (importedData) => {
    if (
      importedData &&
      Array.isArray(importedData.meetings) &&
      Array.isArray(importedData.questions)
    ) {
      setData(importedData);
      localStorage.setItem(STORE_KEY, JSON.stringify(importedData));
      return true;
    }
    return false;
  };

  return (
    <NotulaContext.Provider
      value={{
        meetings: data.meetings,
        questions: data.questions,
        addMeeting,
        updateMeeting,
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

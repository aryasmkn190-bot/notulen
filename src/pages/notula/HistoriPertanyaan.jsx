import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardBody,
  Row,
  Col,
  Badge,
  Button,
  FormGroup,
  Label,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Progress,
  Form,
  Spinner,
} from "reactstrap";
import Content from "@/layout/content/Content";
import Head from "@/layout/head/Head";
import {
  Block,
  BlockBetween,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  Icon,
  UserAvatar,
} from "@/components/Component";
import { findUpper } from "@/utils/Utils";
import {
  useNotula,
  fDate,
  sisaHari,
  KATEGORI_LIST,
  PRIORITAS_LIST,
  STATUS_LIST,
  OUTPUT_LIST,
} from "@/notula-context/NotulaContext";

const AVATAR_THEMES = [
  "primary-dim",
  "azure-dim",
  "info-dim",
  "purple-dim",
  "teal-dim",
  "warning-dim",
  "success-dim",
];

// ponytail: avatar theme hashing; add user photo URLs when backend upload is available.
const getAvatarTheme = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_THEMES[Math.abs(hash) % AVATAR_THEMES.length];
};

const getInitials = (name = "") => {
  if (!name) return "??";
  const up = findUpper(name);
  return up || name.slice(0, 2).toUpperCase();
};

import { useAuth } from "@/notula-context/AuthContext";

const HistoriPertanyaan = () => {
  const { questions, meetings, updateQuestion, deleteQuestion } = useNotula();
  const { user, authFetch, isSuperAdmin, isModerator, isGuru } = useAuth();

  const [guruTab, setGuruTab] = useState("mine"); // 'mine' or 'all' for guru
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterKategori, setFilterKategori] = useState("all");
  const [filterMeeting, setFilterMeeting] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  // Modal Detail / Edit RTL Pertanyaan
  const [activeQ, setActiveQ] = useState(null);
  const [logInput, setLogInput] = useState("");
  const [editingLogId, setEditingLogId] = useState(null);
  const [editingLogText, setEditingLogText] = useState("");
  const [uploadingLampiranQ, setUploadingLampiranQ] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  const handleUploadLampiranQ = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeQ) return;

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert("Ukuran berkas melebihi batas maksimal 10 MB.");
      e.target.value = "";
      return;
    }

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isImage && !isPdf) {
      alert("Format berkas tidak didukung. Harap pilih foto (JPG, PNG, WEBP) atau dokumen PDF.");
      e.target.value = "";
      return;
    }

    setUploadingLampiranQ(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = event.target.result;
          const res = await authFetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: file.name,
              type: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
              size: file.size,
              base64,
            }),
          });
          const resData = await res.json();
          if (!res.ok) {
            throw new Error(resData.error || "Gagal mengunggah berkas lampiran.");
          }
          const updatedLampiran = [...(activeQ.lampiran || []), resData];
          setActiveQ((prev) => ({ ...prev, lampiran: updatedLampiran }));
        } catch (err) {
          alert(err.message || "Gagal mengunggah berkas lampiran output.");
        } finally {
          setUploadingLampiranQ(false);
          e.target.value = "";
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadingLampiranQ(false);
      alert("Gagal membaca berkas: " + err.message);
    }
  };

  const handleDeleteLampiranQ = (docId) => {
    if (!activeQ) return;
    const updated = (activeQ.lampiran || []).filter((d) => d.id !== docId);
    setActiveQ((prev) => ({ ...prev, lampiran: updated }));
  };

  const handleSaveActiveQ = (e) => {
    e.preventDefault();
    if (!activeQ || isGuru) return;
    updateQuestion(activeQ.id, {
      status: activeQ.status,
      prioritas: activeQ.prioritas || "Sedang",
      output: activeQ.output,
      lampiran: activeQ.lampiran || [],
      rencana: activeQ.rencana,
      pic: activeQ.pic,
      tenggat: activeQ.tenggat,
      progres: Number(activeQ.progres || 0),
      keterangan: activeQ.keterangan,
    });
    setActiveQ(null);
  };

  const handleAddLogItem = () => {
    if (!logInput.trim() || !activeQ || isGuru) return;
    const text = logInput.trim();
    const newLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ts: Date.now(),
      teks: text,
      type: "manual",
      author: user?.nama || "Pengguna",
    };
    updateQuestion(activeQ.id, {}, text);
    setLogInput("");
    setActiveQ((prev) =>
      prev
        ? {
            ...prev,
            log: [newLogItem, ...(prev.log || [])],
          }
        : null
    );
  };

  const handleStartEditLog = (item, idx) => {
    if (isGuru || item.type === "system") return;
    setEditingLogId(item.id || `log-${idx}`);
    setEditingLogText(item.teks);
  };

  const handleSaveEditLog = (logId) => {
    if (!activeQ || !editingLogText.trim() || isGuru) return;
    const updatedLog = (activeQ.log || []).map((l, i) => {
      const match = l.id === logId || `log-${i}` === logId;
      return match ? { ...l, teks: editingLogText.trim() } : l;
    });
    setActiveQ((prev) => ({ ...prev, log: updatedLog }));
    updateQuestion(activeQ.id, { log: updatedLog });
    setEditingLogId(null);
    setEditingLogText("");
  };

  const handleDeleteLogItem = (logId) => {
    if (!activeQ || isGuru) return;
    if (window.confirm("Hapus catatan riwayat manual ini?")) {
      const updatedLog = (activeQ.log || []).filter((l, i) => l.id !== logId && `log-${i}` !== logId);
      setActiveQ((prev) => ({ ...prev, log: updatedLog }));
      updateQuestion(activeQ.id, { log: updatedLog });
    }
  };

  const myQuestionsCount = useMemo(() => {
    if (!user) return 0;
    return questions.filter(
      (q) => q.user_id === user.id || (user.nama && q.penanya?.toLowerCase() === user.nama.toLowerCase())
    ).length;
  }, [questions, user]);

  const filteredQuestions = useMemo(() => {
    return [...questions]
      .sort((a, b) => b.createdAt - a.createdAt)
      .filter((q) => {
        // Guru filter: mine vs all
        if (isGuru && guruTab === "mine") {
          const isMine =
            q.user_id === user?.id ||
            (user?.nama && q.penanya?.toLowerCase() === user.nama.toLowerCase());
          if (!isMine) return false;
        }

        const matchesStatus =
          filterStatus === "all" || q.status === filterStatus;
        const matchesKategori =
          filterKategori === "all" || q.kategori === filterKategori;
        const matchesMeeting =
          filterMeeting === "all" || q.mid === filterMeeting;

        const parentM = meetings.find((item) => item.id === q.mid);
        const qDate = q.createdAt ? new Date(q.createdAt).toISOString().slice(0, 10) : "";
        const parentDate = parentM?.tanggal || "";
        const matchesDate = !filterDate || qDate === filterDate || parentDate === filterDate;

        const term = search.toLowerCase();
        const matchesSearch =
          !term ||
          (q.teks || "").toLowerCase().includes(term) ||
          (q.penanya || "").toLowerCase().includes(term) ||
          (q.unit || "").toLowerCase().includes(term) ||
          (q.rencana || "").toLowerCase().includes(term) ||
          (q.pic || "").toLowerCase().includes(term) ||
          (parentM?.judul || "").toLowerCase().includes(term);

        return matchesStatus && matchesKategori && matchesMeeting && matchesDate && matchesSearch;
      });
  }, [questions, meetings, isGuru, guruTab, user, filterStatus, filterKategori, filterMeeting, filterDate, search]);

  return (
    <React.Fragment>
      <Head title="Histori Pertanyaan & RTL - SMK Hassina" />
      <Content>
        {/* Header */}
        <BlockHead size="sm" className="notula-page-header mb-4 mb-md-5">
          <BlockBetween size="md" className="g-3 align-items-md-center">
            <BlockHeadContent>
              <div className="notula-page-meta">
                <span className="meta-school-pill">
                  <Icon name="building" className="me-1" />
                  SMK HASSINA SUKABUMI
                </span>
                {isGuru && (
                  <span className="badge bg-success-dim text-success rounded-pill px-2.5 py-1 fs-11px fw-bold ms-1">
                    <Icon name="user" className="me-1" />
                    Akun Guru: {user?.nama}
                  </span>
                )}
              </div>
              <BlockTitle page tag="h3" className="notula-page-title">
                {isGuru && guruTab === "mine"
                  ? "Pertanyaan & Aspirasi Saya"
                  : "Pertanyaan & Rencana Tindak Lanjut (RTL)"}
              </BlockTitle>
              <BlockDes className="text-soft">
                <p className="mb-0">
                  {isGuru && guruTab === "mine"
                    ? "Daftar pertanyaan dan aspirasi yang pernah Anda sampaikan dalam rapat dinas beserta perkembangan tindak lanjutnya."
                    : "Seluruh aspirasi dewan guru & staf sekolah dari musyawarah dinas serta perkembangan realisasinya."}
                </p>
              </BlockDes>
            </BlockHeadContent>
            <BlockHeadContent className="mt-3 mt-md-0">
              <span className="badge bg-white text-primary border px-3 py-2 fs-13px shadow-sm rounded-pill fw-bold">
                {isGuru && guruTab === "mine"
                  ? `Pertanyaan Saya: ${myQuestionsCount}`
                  : `Total: ${questions.length} Aspirasi Terarsip`}
              </span>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        {/* Tab Switcher Khusus Peran Guru */}
        {isGuru && (
          <div className="mb-3 d-flex gap-2">
            <Button
              size="sm"
              color={guruTab === "mine" ? "primary" : "outline-light"}
              className={guruTab === "mine" ? "fw-bold" : "text-dark bg-white"}
              onClick={() => setGuruTab("mine")}
            >
              <Icon name="user-check" className="me-1" />
              Pertanyaan yang Pernah Saya Ajukan ({myQuestionsCount})
            </Button>
            <Button
              size="sm"
              color={guruTab === "all" ? "primary" : "outline-light"}
              className={guruTab === "all" ? "fw-bold" : "text-dark bg-white"}
              onClick={() => setGuruTab("all")}
            >
              <Icon name="list" className="me-1" />
              Semua Pertanyaan Rapat ({questions.length})
            </Button>
          </div>
        )}

        {/* Status Chips Filter (Scrollable on small devices) */}
        <div className="filter-chips-scroll mb-3">
          <Button
            size="sm"
            color={filterStatus === "all" ? "primary" : "outline-light"}
            className={filterStatus === "all" ? "" : "text-dark bg-white"}
            onClick={() => setFilterStatus("all")}
          >
            Semua ({questions.length})
          </Button>
          {STATUS_LIST.map((s) => {
            const count = questions.filter((q) => q.status === s.id).length;
            const active = filterStatus === s.id;
            return (
              <Button
                key={s.id}
                size="sm"
                color={active ? s.color : "outline-light"}
                className={active ? "" : "text-dark bg-white"}
                onClick={() => setFilterStatus(s.id)}
              >
                {s.label} ({count})
              </Button>
            );
          })}
        </div>

        {/* Search & Select Filter Bar */}
        <Card className="card-bordered mb-4 bg-white">
          <CardBody className="card-inner py-3 px-3 px-md-4">
            <Row className="g-3 align-items-center">
              <Col md="4" sm="12">
                <div className="form-control-wrap">
                  <div className="form-icon form-icon-left">
                    <Icon name="search" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Cari aspirasi, penanya, PIC..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </Col>
              <Col md="2" sm="6">
                <Input
                  type="select"
                  value={filterKategori}
                  onChange={(e) => setFilterKategori(e.target.value)}
                >
                  <option value="all">Semua Kategori</option>
                  {KATEGORI_LIST.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </Input>
              </Col>
              <Col md="3" sm="6">
                <Input
                  type="select"
                  value={filterMeeting}
                  onChange={(e) => setFilterMeeting(e.target.value)}
                >
                  <option value="all">Semua Rapat</option>
                  {meetings.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.judul}
                    </option>
                  ))}
                </Input>
              </Col>
              <Col md="3" sm="12">
                <div className="input-group">
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    title="Filter Berdasarkan Tanggal Rapat / Catat"
                  />
                  {filterDate && (
                    <Button
                      color="light"
                      outline
                      size="sm"
                      onClick={() => setFilterDate("")}
                      title="Hapus filter tanggal"
                    >
                      <Icon name="cross" />
                    </Button>
                  )}
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* List Pertanyaan Table */}
        <Card className="card-bordered">
          <div className="card-inner p-0" style={{ overflowX: "auto" }}>
            {filteredQuestions.length === 0 ? (
              <div className="alert alert-light text-center py-5 m-3 border">
                <Icon name="search" className="text-muted fs-2 mb-2" />
                <p className="text-soft mb-2 fs-13px">
                  Tidak ada data pertanyaan yang sesuai dengan kriteria filter.
                </p>
                {(search || filterStatus !== "all" || filterKategori !== "all" || filterMeeting !== "all" || filterDate) && (
                  <Button
                    size="sm"
                    color="outline-primary"
                    onClick={() => {
                      setSearch("");
                      setFilterStatus("all");
                      setFilterKategori("all");
                      setFilterMeeting("all");
                      setFilterDate("");
                    }}
                  >
                    Reset Filter
                  </Button>
                )}
              </div>
            ) : (
              <div className="nk-tb-list nk-tb-ulist">
                <div className="nk-tb-item nk-tb-head bg-light py-2">
                  <div className="nk-tb-col">
                    <span className="sub-text fw-bold d-none d-md-inline">Pertanyaan</span>
                    <span className="sub-text fw-bold d-md-none">Pertanyaan &amp; Penanya</span>
                  </div>
                  <div className="nk-tb-col tb-col-md">
                    <span className="sub-text fw-bold">Penanya &amp; Unit</span>
                  </div>
                  <div className="nk-tb-col tb-col-lg">
                    <span className="sub-text fw-bold">Dokumen Rapat</span>
                  </div>
                  <div className="nk-tb-col tb-col-sm">
                    <span className="sub-text fw-bold">Status &amp; Tindak Lanjut</span>
                  </div>
                  <div className="nk-tb-col text-end" style={{ width: "1%", whiteSpace: "nowrap" }}>
                    <span className="sub-text fw-bold">Aksi</span>
                  </div>
                </div>

                {filteredQuestions.map((q) => {
                  const m = meetings.find((item) => item.id === q.mid);
                  const statusObj =
                    STATUS_LIST.find((s) => s.id === q.status) || STATUS_LIST[0];
                  const sisa = sisaHari(q.tenggat);

                  return (
                    <div
                      key={q.id}
                      className="nk-tb-item"
                      style={{ cursor: "pointer" }}
                      onClick={() => setActiveQ(q)}
                    >
                      {/* Kolom Pertanyaan */}
                      <div className="nk-tb-col">
                        <div className="d-flex align-items-center mb-1 flex-wrap gap-1">
                          <span className="badge badge-dim bg-primary fs-11px">
                            {q.kategori}
                          </span>
                          <span
                            className={`badge ${
                              q.prioritas === "Tinggi"
                                ? "badge-danger-strong"
                                : q.prioritas === "Sedang"
                                ? "badge-warning-strong"
                                : "bg-light text-muted border"
                            } fs-11px`}
                          >
                            Prioritas {q.prioritas}
                          </span>
                          {q.dibacakan && (
                            <span className="badge badge-dim bg-success fs-11px" title="Dibacakan dalam rapat">
                              <Icon name="mic" className="me-1" />
                              Dibacakan
                            </span>
                          )}
                        </div>

                        <h6 className="title fs-14px mb-1 text-dark fw-bold" style={{ lineHeight: "1.45" }}>
                          {q.teks}
                        </h6>

                        {/* Mobile info Penanya (< md) */}
                        <div className="d-md-none text-muted fs-12px mt-1 d-flex align-items-center gap-1 flex-wrap">
                          <Icon name="user-fill" className="text-primary fs-11px" />
                          <strong className="text-dark">{q.penanya || "Anonim"}</strong>
                          {q.unit && <span className="text-soft">({q.unit})</span>}
                        </div>

                        {/* Mobile info Rapat (< lg) */}
                        {m && (
                          <div className="d-lg-none text-muted fs-11px mt-1 d-flex align-items-center gap-1 flex-wrap">
                            <Icon name="calendar-alt" className="me-1" />
                            <span>{m.judul}</span>
                            <span className="text-soft">· {fDate(m.tanggal, true)}</span>
                          </div>
                        )}

                        {/* Mobile ringkasan status & deadline (< sm) */}
                        <div className="d-sm-none text-muted fs-11px mt-2 d-flex align-items-center gap-2 flex-wrap">
                          <span className={`badge badge-dim bg-${statusObj.color} fs-11px`}>
                            {statusObj.label}
                          </span>
                          {q.pic && (
                            <span>
                              PIC: <strong className="text-dark">{q.pic}</strong>
                            </span>
                          )}
                          {q.tenggat && (
                            <span
                              className={
                                sisa < 0
                                  ? "text-danger fw-bold"
                                  : sisa <= 3
                                  ? "text-warning fw-bold"
                                  : "text-muted"
                              }
                            >
                              Tenggat: {fDate(q.tenggat, true)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Kolom Penanya & Unit (Desktop & Tablet) */}
                      <div className="nk-tb-col tb-col-md">
                        <div className="user-card">
                          <UserAvatar
                            theme={getAvatarTheme(q.penanya || "")}
                            text={getInitials(q.penanya)}
                            size="sm"
                          />
                          <div className="user-info ms-2">
                            <span className="tb-lead fw-bold text-dark fs-13px d-block">
                              {q.penanya || "Anonim"}
                            </span>
                            <span className="sub-text text-muted fs-11px d-block">
                              {q.unit || "Dewan Guru / Staf"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Kolom Rapat (Desktop) */}
                      <div className="nk-tb-col tb-col-lg">
                        {m ? (
                          <div>
                            <Link
                              to={`/rapat/${m.id}`}
                              className="tb-amount text-primary fw-bold fs-13px d-block text-truncate"
                              style={{ maxWidth: "220px" }}
                              title={m.judul}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {m.judul}
                            </Link>
                            <div className="d-flex align-items-center gap-1.5 flex-wrap fs-11px text-soft mt-1">
                              {m.jenis && (
                                <span className="badge bg-light text-muted border px-1.5 py-0 fs-10px">
                                  {m.jenis}
                                </span>
                              )}
                              <span>
                                <Icon name="calendar" className="me-1" />
                                {fDate(m.tanggal, true)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted fs-12px">—</span>
                        )}
                      </div>

                      {/* Kolom Status & Tindak Lanjut (Tablet ke atas) */}
                      <div className="nk-tb-col tb-col-sm">
                        <div className="mb-1 d-flex align-items-center gap-1 flex-wrap">
                          <span
                            className={`badge badge-dim bg-${statusObj.color} fs-11px fw-bold`}
                          >
                            {statusObj.label}
                          </span>
                          {q.output && q.output !== "Belum ditentukan" && (
                            <span className="badge badge-subtle-primary fs-10px">
                              {q.output}
                            </span>
                          )}
                        </div>

                        <div className="fs-11px text-muted mb-1">
                          PIC: <strong className="text-dark">{q.pic || "Belum ada"}</strong>
                        </div>

                        {/* Progres realisasi */}
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="progress flex-grow-1"
                            style={{ height: "5px", width: "65px", borderRadius: "10px", background: "#e2e8f0" }}
                            title={`Progres realisasi: ${q.progres || 0}%`}
                          >
                            <div
                              className={`progress-bar ${
                                (q.progres || 0) >= 100
                                  ? "bg-success"
                                  : (q.progres || 0) >= 50
                                  ? "bg-info"
                                  : "bg-warning"
                              }`}
                              style={{ width: `${q.progres || 0}%`, borderRadius: "10px" }}
                            />
                          </div>
                          <span className="fs-10px text-muted fw-bold">{q.progres || 0}%</span>
                        </div>

                        {q.tenggat && (
                          <div className="mt-1">
                            <span
                              className={`badge ${
                                sisa < 0
                                  ? "badge-danger-strong"
                                  : sisa <= 3
                                  ? "badge-warning-strong"
                                  : "bg-light text-muted border"
                              } fs-10px`}
                            >
                              <Icon name="clock" className="me-1" />
                              {fDate(q.tenggat, true)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Kolom Tombol Aksi */}
                      <div className="nk-tb-col text-end" style={{ width: "1%", whiteSpace: "nowrap" }}>
                        <Button
                          color="primary"
                          outline
                          size="sm"
                          className="btn-dim"
                          style={{ whiteSpace: "nowrap" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveQ(q);
                          }}
                          title={isGuru ? "Lihat Respon & RTL" : "Kelola Tindak Lanjut"}
                        >
                          <Icon name={isGuru ? "eye" : "edit-alt"} className="me-sm-1" />
                          <span className="d-none d-sm-inline">{isGuru ? "Detail" : "RTL"}</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="card-inner-sm border-top py-2 px-3 text-soft fs-11px">
            Menampilkan {filteredQuestions.length} dari total {questions.length} pertanyaan
          </div>
        </Card>

        {/* MODAL DETAIL / EDIT RTL */}
        <Modal
          isOpen={!!activeQ}
          toggle={() => setActiveQ(null)}
          className="modal-dialog-centered modal-lg"
        >
          {activeQ && (
            <>
              <ModalHeader toggle={() => setActiveQ(null)}>
                {isGuru ? "Detail Pertanyaan & Respon RTL" : "Kelola Tindak Lanjut Pertanyaan"}
              </ModalHeader>
              {isGuru ? (
                <>
                  <ModalBody>
                    <div className="bg-light p-3 rounded mb-3 border">
                      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-1">
                        <span className="badge badge-dim bg-primary">
                          {activeQ.kategori}
                        </span>
                        <span className="badge badge-dim bg-light border text-muted">
                          Prioritas {activeQ.prioritas}
                        </span>
                      </div>
                      <h5 className="fs-15px text-dark mb-2 fw-bold">{activeQ.teks}</h5>
                      <div className="d-flex align-items-center mt-2">
                        <UserAvatar
                          theme={getAvatarTheme(activeQ.penanya || "")}
                          text={getInitials(activeQ.penanya)}
                          size="sm"
                        />
                        <div className="user-info ms-2">
                          <span className="tb-lead fw-bold text-dark fs-12px d-block">
                            {activeQ.penanya || "Anonim"}
                          </span>
                          <span className="sub-text text-muted fs-11px d-block">
                            {activeQ.unit || "Dewan Guru / Staf"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded p-3 mb-3 bg-white">
                      <h6 className="title fs-13px mb-2 text-dark">Status Tindak Lanjut &amp; Realisasi Sekolah</h6>
                      <Row className="g-2 mb-2">
                        <Col sm="6">
                          <span className="text-muted fs-11px d-block">Status RTL:</span>
                          <span className="badge badge-dim bg-primary fs-11px fw-bold">
                            {activeQ.status?.toUpperCase()}
                          </span>
                        </Col>
                        <Col sm="6">
                          <span className="text-muted fs-11px d-block">Output:</span>
                          <span className="badge bg-light text-dark border fs-11px">
                            {activeQ.output || "Belum ditentukan"}
                          </span>
                        </Col>
                        <Col sm="6">
                          <span className="text-muted fs-11px d-block">Penanggung Jawab (PIC):</span>
                          <strong className="text-dark fs-12px">{activeQ.pic || "Belum ditentukan"}</strong>
                        </Col>
                        <Col sm="6">
                          <span className="text-muted fs-11px d-block">Tenggat Waktu:</span>
                          <span className="text-dark fs-12px">{activeQ.tenggat ? fDate(activeQ.tenggat) : "Belum ditentukan"}</span>
                        </Col>
                        <Col sm="6">
                          <span className="text-muted fs-11px d-block">Prioritas:</span>
                          <span className={`badge ${activeQ.prioritas === "Tinggi" ? "badge-danger-strong" : activeQ.prioritas === "Sedang" ? "badge-warning-strong" : "bg-light text-muted border"} fs-11px`}>
                            Prioritas {activeQ.prioritas || "Sedang"}
                          </span>
                        </Col>
                      </Row>

                      {/* Lampiran Output untuk Guru */}
                      <div className="mb-2.5 pt-2 border-top">
                        <span className="text-muted fs-11px d-block mb-1.5 fw-bold">Lampiran Berkas Output:</span>
                        {activeQ.lampiran && activeQ.lampiran.length > 0 ? (
                          <div className="d-flex flex-wrap gap-2">
                            {activeQ.lampiran.map((doc, idx) => {
                              const isPdf = doc.type === "application/pdf" || doc.name?.toLowerCase().endsWith(".pdf");
                              return (
                                <div key={doc.id || idx} className="d-flex align-items-center bg-light border rounded px-2.5 py-1.5 gap-2 fs-11px shadow-xs">
                                  <Icon name={isPdf ? "file-pdf" : "img"} className={isPdf ? "text-danger fs-5" : "text-primary fs-5"} />
                                  <span className="text-dark fw-medium text-truncate" style={{ maxWidth: "180px" }}>{doc.name}</span>
                                  <Button size="xs" color="outline-primary" type="button" onClick={() => setPreviewItem(doc)}>
                                    Pratinjau
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-muted fs-11px">Belum ada berkas lampiran output yang diunggah.</span>
                        )}
                      </div>

                      <div className="mb-2">
                        <span className="text-muted fs-11px d-block mb-1">Rencana Penyelesaian:</span>
                        <p className="text-dark fs-12px mb-0 bg-light p-2 rounded">
                          {activeQ.rencana || "Belum ada rencana tindak lanjut yang dicatat."}
                        </p>
                      </div>

                      <div className="mb-2">
                        <div className="d-flex justify-content-between fs-11px mb-1">
                          <span className="text-muted">Progres Realisasi:</span>
                          <strong className="text-primary">{activeQ.progres || 0}%</strong>
                        </div>
                        <Progress value={activeQ.progres || 0} color="primary" className="progress-sm" />
                      </div>

                      {activeQ.keterangan && (
                        <div className="mt-2">
                          <span className="text-muted fs-11px d-block mb-1">Keterangan Tambahan:</span>
                          <p className="text-soft fs-11px mb-0">{activeQ.keterangan}</p>
                        </div>
                      )}
                    </div>

                    <div className="border rounded p-3 bg-white">
                      <h6 className="title fs-12px mb-2">Riwayat Catatan Log</h6>
                      {activeQ.log && activeQ.log.length > 0 ? (
                        <ul className="list-unstyled mb-0" style={{ maxHeight: "150px", overflowY: "auto" }}>
                          {activeQ.log.map((item, idx) => {
                            const isSystem = item.type === "system" || item.teks?.includes("[Sistem]") || item.teks?.includes("Status diubah");
                            return (
                              <li key={item.id || idx} className="d-flex align-items-start py-1.5 border-bottom fs-11px gap-1.5">
                                <Icon name={isSystem ? "activity" : "edit-alt"} className={`mt-0.5 flex-shrink-0 ${isSystem ? "text-primary" : "text-info"}`} />
                                <div className="flex-grow-1">
                                  <div className="d-flex align-items-center gap-1.5 flex-wrap mb-0.5">
                                    <span className={`badge badge-dim ${isSystem ? "bg-light text-muted" : "bg-info-dim text-info"} fs-9px py-0 px-1`}>
                                      {isSystem ? "Sistem" : "Manual"}
                                    </span>
                                    <span className="text-muted fs-10px">
                                      {new Date(item.ts).toLocaleString("id-ID")}
                                    </span>
                                    {item.author && !isSystem && (
                                      <span className="text-soft fs-10px">oleh {item.author}</span>
                                    )}
                                  </div>
                                  <span className="text-dark d-block lh-sm">{item.teks}</span>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <span className="text-muted fs-11px">Belum ada riwayat tercatat.</span>
                      )}
                    </div>
                  </ModalBody>
                  <ModalFooter className="bg-light">
                    <Button color="primary" size="sm" onClick={() => setActiveQ(null)}>
                      Tutup
                    </Button>
                  </ModalFooter>
                </>
              ) : (
                <Form onSubmit={handleSaveActiveQ}>
                  <ModalBody>
                    <div className="bg-light p-3 rounded mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge badge-dim bg-primary">
                          {activeQ.kategori}
                        </span>
                        <span
                          className={`badge ${
                            activeQ.prioritas === "Tinggi"
                              ? "badge-danger-strong"
                              : activeQ.prioritas === "Sedang"
                              ? "badge-warning-strong"
                              : "bg-light text-muted border"
                          } fs-11px`}
                        >
                          Prioritas {activeQ.prioritas}
                        </span>
                      </div>
                      <h5 className="fs-15px text-dark mb-2 fw-bold">{activeQ.teks}</h5>
                      <div className="d-flex align-items-center mt-2">
                        <UserAvatar
                          theme={getAvatarTheme(activeQ.penanya || "")}
                          text={getInitials(activeQ.penanya)}
                          size="sm"
                        />
                        <div className="user-info ms-2">
                          <span className="tb-lead fw-bold text-dark fs-12px d-block">
                            {activeQ.penanya || "Anonim"}
                          </span>
                          <span className="sub-text text-muted fs-11px d-block">
                            {activeQ.unit || "Dewan Guru / Staf"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Row className="g-3">
                      <Col sm="4">
                        <FormGroup>
                          <Label className="form-label" htmlFor="hq-status">
                            Status Tindak Lanjut
                          </Label>
                          <Input
                            type="select"
                            id="hq-status"
                            value={activeQ.status}
                            onChange={(e) =>
                              setActiveQ({ ...activeQ, status: e.target.value })
                            }
                          >
                            {STATUS_LIST.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </Input>
                        </FormGroup>
                      </Col>
                      <Col sm="4">
                        <FormGroup>
                          <Label className="form-label" htmlFor="hq-output">
                            Output
                          </Label>
                          <Input
                            type="select"
                            id="hq-output"
                            value={activeQ.output}
                            onChange={(e) =>
                              setActiveQ({ ...activeQ, output: e.target.value })
                            }
                          >
                            {OUTPUT_LIST.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </Input>
                        </FormGroup>
                      </Col>
                      <Col sm="4">
                        <FormGroup>
                          <Label className="form-label" htmlFor="hq-prioritas">
                            Prioritas
                          </Label>
                          <Input
                            type="select"
                            id="hq-prioritas"
                            value={activeQ.prioritas || "Sedang"}
                            onChange={(e) =>
                              setActiveQ({ ...activeQ, prioritas: e.target.value })
                            }
                          >
                            {PRIORITAS_LIST.map((p) => (
                              <option key={p} value={p}>
                                Prioritas {p}
                              </option>
                            ))}
                          </Input>
                        </FormGroup>
                      </Col>

                      {/* Lampiran Berkas Output (Dokumen PDF / Foto) */}
                      <Col sm="12">
                        <FormGroup>
                          <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-1">
                            <Label className="form-label mb-0" htmlFor="hq-lampiran">
                              Lampiran Berkas Output (Dokumen PDF / Foto)
                            </Label>
                            <label
                              className={`btn btn-xs btn-outline-primary mb-0 ${uploadingLampiranQ ? "disabled" : ""}`}
                              style={{ cursor: "pointer" }}
                            >
                              {uploadingLampiranQ ? (
                                <>
                                  <Spinner size="sm" color="primary" className="me-1" />
                                  <span>Mengunggah...</span>
                                </>
                              ) : (
                                <>
                                  <Icon name="upload-cloud" className="me-1" />
                                  <span>+ Unggah Lampiran</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                className="d-none"
                                disabled={uploadingLampiranQ}
                                onChange={handleUploadLampiranQ}
                              />
                            </label>
                          </div>
                          <span className="text-soft fs-11px d-block mb-2">
                            Unggah berkas bukti penyelesaian atau dokumen pendukung output (SK, SOP, Foto kegiatan, dll. Maks. 10 MB).
                          </span>

                          {activeQ.lampiran && activeQ.lampiran.length > 0 ? (
                            <div className="d-flex flex-wrap gap-2">
                              {activeQ.lampiran.map((doc, idx) => {
                                const isPdf = doc.type === "application/pdf" || doc.name?.toLowerCase().endsWith(".pdf");
                                const fileSizeText = doc.size
                                  ? doc.size > 1024 * 1024
                                    ? `${(doc.size / (1024 * 1024)).toFixed(1)} MB`
                                    : `${Math.round(doc.size / 1024)} KB`
                                  : "";
                                return (
                                  <div
                                    key={doc.id || idx}
                                    className="d-flex align-items-center bg-light border rounded px-2 py-1.5 gap-2 fs-12px shadow-xs"
                                  >
                                    <Icon
                                      name={isPdf ? "file-pdf" : "img"}
                                      className={isPdf ? "text-danger fs-5" : "text-primary fs-5"}
                                    />
                                    <div className="text-truncate" style={{ maxWidth: "200px" }}>
                                      <strong className="d-block text-dark text-truncate fs-11px" title={doc.name}>
                                        {doc.name}
                                      </strong>
                                      <span className="text-muted fs-10px">{fileSizeText}</span>
                                    </div>
                                    <Button
                                      size="xs"
                                      color="outline-primary"
                                      className="ms-1"
                                      type="button"
                                      onClick={() => setPreviewItem(doc)}
                                    >
                                      Pratinjau
                                    </Button>
                                    <Button
                                      size="xs"
                                      color="outline-danger"
                                      className="btn-icon"
                                      type="button"
                                      onClick={() => handleDeleteLampiranQ(doc.id)}
                                      title="Hapus lampiran"
                                    >
                                      <Icon name="trash" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="bg-light border rounded p-2 text-center text-muted fs-11px">
                              Belum ada lampiran berkas output. Klik <strong>+ Unggah Lampiran</strong> untuk melampirkan berkas bukti.
                            </div>
                          )}
                        </FormGroup>
                      </Col>

                      <Col sm="12">
                        <FormGroup>
                          <Label className="form-label" htmlFor="hq-rencana">
                            Rencana Tindak Lanjut
                          </Label>
                          <Input
                            type="textarea"
                            id="hq-rencana"
                            rows="3"
                            placeholder="Langkah penyelesaian..."
                            value={activeQ.rencana || ""}
                            onChange={(e) =>
                              setActiveQ({ ...activeQ, rencana: e.target.value })
                            }
                          />
                        </FormGroup>
                      </Col>

                      <Col sm="6">
                        <FormGroup>
                          <Label className="form-label" htmlFor="hq-pic">
                            Penanggung Jawab (PIC)
                          </Label>
                          <Input
                            type="text"
                            id="hq-pic"
                            placeholder="Contoh: Wakasek Kesiswaan / Kaprog TJKT"
                            value={activeQ.pic || ""}
                            onChange={(e) =>
                              setActiveQ({ ...activeQ, pic: e.target.value })
                            }
                          />
                        </FormGroup>
                      </Col>

                      <Col sm="6">
                        <FormGroup>
                          <Label className="form-label" htmlFor="hq-tenggat">
                            Tenggat Waktu Selesai (Deadline)
                          </Label>
                          <Input
                            type="date"
                            id="hq-tenggat"
                            value={activeQ.tenggat || ""}
                            onChange={(e) =>
                              setActiveQ({ ...activeQ, tenggat: e.target.value })
                            }
                          />
                        </FormGroup>
                      </Col>

                      <Col sm="12">
                        <FormGroup>
                          <div className="d-flex justify-content-between mb-1">
                            <Label className="form-label mb-0" htmlFor="hq-progres">
                              Progres Realisasi
                            </Label>
                            <span className="fw-bold text-primary">
                              {activeQ.progres || 0}%
                            </span>
                          </div>
                          <input
                            type="range"
                            className="form-range w-100"
                            min="0"
                            max="100"
                            step="5"
                            id="hq-progres"
                            value={activeQ.progres || 0}
                            onChange={(e) =>
                              setActiveQ({
                                ...activeQ,
                                progres: Number(e.target.value),
                              })
                            }
                          />
                        </FormGroup>
                      </Col>

                      <Col sm="12">
                        <FormGroup>
                          <Label className="form-label" htmlFor="hq-keterangan">
                            Keterangan / Catatan Tambahan
                          </Label>
                          <Input
                            type="textarea"
                            id="hq-keterangan"
                            rows="2"
                            placeholder="Catatan progres..."
                            value={activeQ.keterangan || ""}
                            onChange={(e) =>
                              setActiveQ({
                                ...activeQ,
                                keterangan: e.target.value,
                              })
                            }
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    {/* Log Catatan */}
                    <div className="mt-3 pt-2 border-top">
                      <h6 className="title fs-13px mb-2">Riwayat Catatan Log</h6>
                      <div className="input-group mb-2">
                        <Input
                          type="text"
                          placeholder="Ketik catatan progres manual..."
                          value={logInput}
                          onChange={(e) => setLogInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddLogItem();
                            }
                          }}
                        />
                        <Button
                          color="primary"
                          type="button"
                          onClick={handleAddLogItem}
                        >
                          Simpan
                        </Button>
                      </div>

                      <div style={{ maxHeight: "170px", overflowY: "auto" }}>
                        {activeQ.log && activeQ.log.length > 0 ? (
                          <ul className="list-unstyled mb-0">
                            {activeQ.log.map((item, idx) => {
                              const isSystem = item.type === "system" || item.teks?.includes("[Sistem]") || item.teks?.includes("Status diubah");
                              const logKey = item.id || `log-${idx}`;
                              const isEditing = editingLogId === logKey;
                              return (
                                <li
                                  key={logKey}
                                  className="d-flex align-items-start justify-content-between py-1.5 border-bottom fs-11px gap-2"
                                >
                                  <div className="d-flex align-items-start gap-1.5 flex-grow-1">
                                    <Icon
                                      name={isSystem ? "activity" : "edit-alt"}
                                      className={`mt-1 me-1 flex-shrink-0 ${isSystem ? "text-primary" : "text-info"}`}
                                    />
                                    <div className="flex-grow-1">
                                      <div className="d-flex align-items-center gap-1.5 flex-wrap mb-0.5">
                                        <span className={`badge badge-dim ${isSystem ? "bg-light text-muted" : "bg-info-dim text-info"} fs-9px py-0 px-1`}>
                                          {isSystem ? "Sistem (Otomatis)" : "Manual"}
                                        </span>
                                        <span className="text-muted fs-10px">
                                          {new Date(item.ts).toLocaleString("id-ID")}
                                        </span>
                                        {item.author && !isSystem && (
                                          <span className="text-soft fs-10px">oleh {item.author}</span>
                                        )}
                                      </div>

                                      {isEditing ? (
                                        <div className="d-flex gap-1 mt-1">
                                          <Input
                                            size="sm"
                                            className="fs-11px py-0.5"
                                            value={editingLogText}
                                            onChange={(e) => setEditingLogText(e.target.value)}
                                          />
                                          <Button size="xs" color="primary" onClick={() => handleSaveEditLog(logKey)}>
                                            Simpan
                                          </Button>
                                          <Button size="xs" color="light" onClick={() => setEditingLogId(null)}>
                                            Batal
                                          </Button>
                                        </div>
                                      ) : (
                                        <span className="text-dark d-block lh-sm">{item.teks}</span>
                                      )}
                                    </div>
                                  </div>

                                  {!isSystem && !isEditing && (
                                    <div className="d-flex gap-1 flex-shrink-0">
                                      <Button
                                        size="xs"
                                        color="light"
                                        outline
                                        className="btn-icon p-0"
                                        style={{ width: "22px", height: "22px" }}
                                        onClick={() => handleStartEditLog(item, idx)}
                                        title="Edit catatan manual"
                                      >
                                        <Icon name="edit" className="fs-11px text-muted" />
                                      </Button>
                                      <Button
                                        size="xs"
                                        color="light"
                                        outline
                                        className="btn-icon p-0"
                                        style={{ width: "22px", height: "22px" }}
                                        onClick={() => handleDeleteLogItem(logKey)}
                                        title="Hapus catatan manual"
                                      >
                                        <Icon name="trash" className="fs-11px text-danger" />
                                      </Button>
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <span className="text-muted fs-12px">
                            Belum ada riwayat tercatat.
                          </span>
                        )}
                      </div>
                    </div>
                  </ModalBody>
                  <ModalFooter className="bg-light d-flex justify-content-between">
                    <Button
                      color="danger"
                      outline
                      size="sm"
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Yakin ingin menghapus pertanyaan ini dari notulensi?"
                          )
                        ) {
                          deleteQuestion(activeQ.id);
                          setActiveQ(null);
                        }
                      }}
                    >
                      <Icon name="trash" className="me-1" />
                      <span>Hapus</span>
                    </Button>
                    <div>
                      <Button
                        color="secondary"
                        size="sm"
                        type="button"
                        onClick={() => setActiveQ(null)}
                        className="me-2"
                      >
                        Tutup
                      </Button>
                      <Button color="primary" size="sm" type="submit">
                        Simpan Perubahan
                      </Button>
                    </div>
                  </ModalFooter>
                </Form>
              )}
            </>
          )}
        </Modal>

        {/* MODAL PREVIEW LAMPIRAN (FOTO & PDF) */}
        <Modal
          isOpen={!!previewItem}
          toggle={() => setPreviewItem(null)}
          className={`modal-dialog-centered ${
            previewItem?.type === "application/pdf" ||
            previewItem?.name?.toLowerCase().endsWith(".pdf")
              ? "modal-xl"
              : "modal-lg"
          }`}
        >
          {previewItem && (
            <>
              <ModalHeader toggle={() => setPreviewItem(null)}>
                <div className="d-flex align-items-center gap-2 text-truncate">
                  <Icon
                    name={
                      previewItem.type === "application/pdf" ||
                      previewItem.name?.toLowerCase().endsWith(".pdf")
                        ? "file-pdf"
                        : "img"
                    }
                    className={
                      previewItem.type === "application/pdf" ||
                      previewItem.name?.toLowerCase().endsWith(".pdf")
                        ? "text-danger fs-4"
                        : "text-primary fs-4"
                    }
                  />
                  <span className="text-truncate fs-14px fw-bold">
                    {previewItem.name}
                  </span>
                </div>
              </ModalHeader>
              <ModalBody className="p-2 p-md-3 bg-light text-center">
                {previewItem.type === "application/pdf" ||
                previewItem.name?.toLowerCase().endsWith(".pdf") ? (
                  <div
                    className="w-100 rounded overflow-hidden shadow-sm"
                    style={{ height: "72vh", minHeight: "480px" }}
                  >
                    <iframe
                      src={`${previewItem.url}#toolbar=1&navpanes=0`}
                      title={previewItem.name}
                      className="w-100 h-100 border-0"
                    />
                  </div>
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center p-2"
                    style={{ maxHeight: "78vh", overflow: "auto" }}
                  >
                    <img
                      src={previewItem.url}
                      alt={previewItem.name}
                      className="img-fluid rounded shadow-sm"
                      style={{ maxHeight: "74vh", objectFit: "contain" }}
                    />
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="bg-light d-flex justify-content-between align-items-center">
                <a
                  href={previewItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={previewItem.name}
                  className="btn btn-sm btn-outline-primary"
                >
                  <Icon name="download" className="me-1" />
                  <span>Unduh / Buka di Tab Baru</span>
                </a>
                <Button
                  color="secondary"
                  size="sm"
                  onClick={() => setPreviewItem(null)}
                >
                  Tutup
                </Button>
              </ModalFooter>
            </>
          )}
        </Modal>
      </Content>
    </React.Fragment>
  );
};

export default HistoriPertanyaan;

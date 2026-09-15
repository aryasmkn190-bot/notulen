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

const HistoriPertanyaan = () => {
  const { questions, meetings, updateQuestion, deleteQuestion } = useNotula();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterKategori, setFilterKategori] = useState("all");
  const [filterMeeting, setFilterMeeting] = useState("all");

  // Modal Detail / Edit RTL Pertanyaan
  const [activeQ, setActiveQ] = useState(null);
  const [logInput, setLogInput] = useState("");

  const handleSaveActiveQ = (e) => {
    e.preventDefault();
    if (!activeQ) return;
    updateQuestion(activeQ.id, {
      status: activeQ.status,
      output: activeQ.output,
      rencana: activeQ.rencana,
      pic: activeQ.pic,
      tenggat: activeQ.tenggat,
      progres: Number(activeQ.progres || 0),
      keterangan: activeQ.keterangan,
    });
    setActiveQ(null);
  };

  const handleAddLogItem = () => {
    if (!logInput.trim() || !activeQ) return;
    const text = logInput.trim();
    const newLogItem = { ts: Date.now(), teks: text };
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

  const filteredQuestions = useMemo(() => {
    return [...questions]
      .sort((a, b) => b.createdAt - a.createdAt)
      .filter((q) => {
        const matchesStatus =
          filterStatus === "all" || q.status === filterStatus;
        const matchesKategori =
          filterKategori === "all" || q.kategori === filterKategori;
        const matchesMeeting =
          filterMeeting === "all" || q.mid === filterMeeting;

        const parentM = meetings.find((item) => item.id === q.mid);
        const term = search.toLowerCase();
        const matchesSearch =
          !term ||
          (q.teks || "").toLowerCase().includes(term) ||
          (q.penanya || "").toLowerCase().includes(term) ||
          (q.unit || "").toLowerCase().includes(term) ||
          (q.rencana || "").toLowerCase().includes(term) ||
          (q.pic || "").toLowerCase().includes(term) ||
          (parentM?.judul || "").toLowerCase().includes(term);

        return matchesStatus && matchesKategori && matchesMeeting && matchesSearch;
      });
  }, [questions, meetings, filterStatus, filterKategori, filterMeeting, search]);

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
              </div>
              <BlockTitle page tag="h3" className="notula-page-title">
                Pertanyaan &amp; Rencana Tindak Lanjut (RTL)
              </BlockTitle>
              <BlockDes className="text-soft">
                <p className="mb-0">Seluruh aspirasi dewan guru &amp; staf sekolah dari musyawarah dinas serta perkembangan realisasinya.</p>
              </BlockDes>
            </BlockHeadContent>
            <BlockHeadContent className="mt-3 mt-md-0">
              <span className="badge bg-white text-primary border px-3 py-2 fs-13px shadow-sm rounded-pill fw-bold">
                Total: {questions.length} Aspirasi Terarsip
              </span>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

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
              <Col md="5" sm="12">
                <div className="form-control-wrap">
                  <div className="form-icon form-icon-left">
                    <Icon name="search" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Cari aspirasi, penanya, PIC, rencana..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </Col>
              <Col md="3" sm="6">
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
              <Col md="4" sm="6">
                <Input
                  type="select"
                  value={filterMeeting}
                  onChange={(e) => setFilterMeeting(e.target.value)}
                >
                  <option value="all">Semua Dokumen Rapat</option>
                  {meetings.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.judul}
                    </option>
                  ))}
                </Input>
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
                {(search || filterStatus !== "all" || filterKategori !== "all" || filterMeeting !== "all") && (
                  <Button
                    size="sm"
                    color="outline-primary"
                    onClick={() => {
                      setSearch("");
                      setFilterStatus("all");
                      setFilterKategori("all");
                      setFilterMeeting("all");
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
                          title="Kelola Tindak Lanjut"
                        >
                          <Icon name="edit-alt" className="me-sm-1" />
                          <span className="d-none d-sm-inline">RTL</span>
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
                Kelola Tindak Lanjut Pertanyaan
              </ModalHeader>
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
                    <Col sm="6">
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
                    <Col sm="6">
                      <FormGroup>
                        <Label className="form-label" htmlFor="hq-output">
                          Output Nyata
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
                        placeholder="Ketik progres terbaru..."
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

                    <div style={{ maxHeight: "140px", overflowY: "auto" }}>
                      {activeQ.log && activeQ.log.length > 0 ? (
                        <ul className="list-unstyled mb-0">
                          {activeQ.log.map((item, idx) => (
                            <li
                              key={idx}
                              className="d-flex align-items-start py-1 border-bottom fs-11px"
                            >
                              <Icon
                                name="dot"
                                className="text-primary mt-1 me-2"
                              />
                              <div>
                                <span className="text-muted d-block">
                                  {new Date(item.ts).toLocaleString("id-ID")}
                                </span>
                                <span className="text-dark">{item.teks}</span>
                              </div>
                            </li>
                          ))}
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
            </>
          )}
        </Modal>
      </Content>
    </React.Fragment>
  );
};

export default HistoriPertanyaan;

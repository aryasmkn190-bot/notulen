import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  Row,
  Col,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Badge,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Progress,
  Spinner,
} from "reactstrap";
import classnames from "classnames";
import LogoHassina from "@/images/logo-hassina.png";
import Head from "@/layout/head/Head";
import { Icon } from "@/components/Component";
import { fDate, sisaHari, STATUS_LIST } from "@/notula-context/NotulaContext";

const PublicNotula = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meeting, setMeeting] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState("notulensi");
  const [selectedQ, setSelectedQ] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const fetchPublicData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/public/notula/${encodeURIComponent(token)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Notulensi tidak ditemukan atau tautan tidak valid.");
      }
      setMeeting(data.meeting);
      setQuestions(data.questions || []);
      setLastSync(new Date());
      setError("");
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPublicData(false);
    const interval = setInterval(() => {
      fetchPublicData(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchPublicData]);

  // Keep selectedQ in sync when questions refresh
  useEffect(() => {
    if (selectedQ) {
      const updated = questions.find((q) => q.id === selectedQ.id);
      if (updated) setSelectedQ(updated);
    }
  }, [questions, selectedQ]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-light">
        <Spinner color="primary" />
        <p className="mt-2 text-muted fs-13px">Memuat dokumen notulensi rapat...</p>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-light px-3">
        <Head title="Tautan Tidak Valid — Notula SMK Hassina" />
        <Card className="border-0 shadow-sm rounded-4" style={{ maxWidth: "440px", width: "100%" }}>
          <CardBody className="p-4 p-sm-5 text-center">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger-dim text-danger mb-3"
              style={{ width: "56px", height: "56px" }}
            >
              <Icon name="alert-circle" className="fs-2" />
            </div>
            <h5 className="fw-bold text-dark mb-2">Dokumen Tidak Ditemukan</h5>
            <p className="text-muted fs-13px mb-4">
              {error || "Tautan publik tidak valid atau telah diperbarui oleh pengelola rapat."}
            </p>
            <Button color="primary" outline size="sm" onClick={() => fetchPublicData(false)}>
              <Icon name="reload" className="me-1" /> Coba Muat Ulang
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const rtlQuestions = questions.filter((q) => q.status !== "baru");
  const isFinalized = Boolean(meeting.is_finalized);

  return (
    <React.Fragment>
      <Head title={`${meeting.judul} — Notula Publik SMK Hassina`} />
      <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: "#f8fafc" }}>
        {/* Top Header */}
        <header className="bg-white border-bottom sticky-top shadow-xs d-print-none">
          <div className="container-xl py-2.5 px-3 px-md-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2.5">
              <img
                src={LogoHassina}
                alt="SMK Hassina"
                style={{ width: "34px", height: "34px", objectFit: "contain" }}
              />
              <div>
                <div className="fw-bold text-dark fs-14px lh-sm">Notula Rapat Publik</div>
                <div className="text-muted fs-11px">SMK Hassina Sukabumi · Mode Baca &amp; Pantau RTL</div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              {lastSync && (
                <span className="badge bg-light text-muted border fw-normal fs-11px d-none d-sm-inline-flex align-items-center">
                  <span
                    className="rounded-circle bg-success me-1.5"
                    style={{ width: "6px", height: "6px", display: "inline-block" }}
                  />
                  Sinkron otomatis ({lastSync.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })})
                </span>
              )}
              <Button color="light" outline size="sm" className="bg-white" onClick={() => window.print()}>
                <Icon name="printer" className="me-1" />
                <span>Cetak</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Container */}
        <main className="flex-grow-1 container-xl py-4 px-3 px-md-4 d-print-none">
          {/* Meeting Title & Status Header */}
          <Card className="border bg-white rounded-4 shadow-xs mb-3">
            <CardBody className="p-3 p-md-4">
              <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                <span className="badge badge-dim bg-primary">{meeting.jenis}</span>
                {isFinalized ? (
                  <Badge color="info" className="badge-dim fw-bold">
                    <Icon name="shield-check" className="me-1" />
                    Resmi &amp; Terfinalisasi ({meeting.finalized_by || "Kepala Sekolah"})
                  </Badge>
                ) : (
                  <Badge color="warning" className="badge-dim">
                    Catatan Berjalan / Draf
                  </Badge>
                )}
                {meeting.status === "selesai" && (
                  <Badge color="success" className="badge-dim">
                    Rapat Selesai
                  </Badge>
                )}
              </div>

              <h3 className="fw-bold text-dark mb-2" style={{ fontSize: "21px", letterSpacing: "-0.01em" }}>
                {meeting.judul}
              </h3>

              <div className="text-muted fs-12px d-flex flex-wrap gap-3 mb-3">
                <span>
                  <Icon name="calendar" className="me-1 text-primary" />
                  {fDate(meeting.tanggal)}
                </span>
                <span>
                  <Icon name="clock" className="me-1 text-primary" />
                  {meeting.waktu || "-"}
                </span>
                <span>
                  <Icon name="map-pin" className="me-1 text-primary" />
                  {meeting.tempat || "-"}
                </span>
              </div>

              <Row className="g-2 pt-3 border-top">
                <Col md="4" sm="6">
                  <div className="p-2.5 rounded-3 bg-light border">
                    <span className="text-muted fs-10px text-uppercase fw-bold d-block">Pemimpin Rapat</span>
                    <strong className="text-dark fs-12px">{meeting.pemimpin || "-"}</strong>
                  </div>
                </Col>
                <Col md="4" sm="6">
                  <div className="p-2.5 rounded-3 bg-light border">
                    <span className="text-muted fs-10px text-uppercase fw-bold d-block">Notulis</span>
                    <strong className="text-dark fs-12px">{meeting.notulis || "-"}</strong>
                  </div>
                </Col>
                <Col md="4" sm="12">
                  <div className="p-2.5 rounded-3 bg-light border">
                    <span className="text-muted fs-10px text-uppercase fw-bold d-block">Peserta Rapat</span>
                    <strong className="text-dark fs-12px">{meeting.peserta || "-"}</strong>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>

          {/* Navigation Tabs */}
          <Nav tabs className="mb-3 bg-white px-3 pt-2 rounded-top-3 border-top border-start border-end">
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === "notulensi" })}
                onClick={() => setActiveTab("notulensi")}
                style={{ cursor: "pointer" }}
              >
                <Icon name="file-docs" className="me-1" />
                <span>Catatan Notulensi</span>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === "pertanyaan" })}
                onClick={() => setActiveTab("pertanyaan")}
                style={{ cursor: "pointer" }}
              >
                <Icon name="help" className="me-1" />
                <span>Pertanyaan &amp; Keputusan ({questions.length})</span>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === "rtl" })}
                onClick={() => setActiveTab("rtl")}
                style={{ cursor: "pointer" }}
              >
                <Icon name="task" className="me-1" />
                <span>Pantau Tindak Lanjut / RTL ({rtlQuestions.length})</span>
              </NavLink>
            </NavItem>
          </Nav>

          <TabContent activeTab={activeTab}>
            {/* TAB 1: CATATAN NOTULENSI */}
            <TabPane tabId="notulensi">
              <Card className="border bg-white rounded-4 shadow-xs">
                <CardBody className="p-3 p-md-4">
                  <div className="mb-4">
                    <h6 className="fw-bold text-dark fs-14px mb-2 d-flex align-items-center">
                      <Icon name="list-check" className="text-primary me-1.5" />
                      1. Agenda Rapat
                    </h6>
                    <div
                      className="p-3 rounded-3 bg-light border fs-13px text-dark"
                      style={{ whiteSpace: "pre-wrap", lineHeight: "1.65" }}
                    >
                      {meeting.agenda || <em className="text-muted">Belum ada agenda yang dicatat.</em>}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h6 className="fw-bold text-dark fs-14px mb-2 d-flex align-items-center">
                      <Icon name="notes-alt" className="text-primary me-1.5" />
                      2. Jalannya Diskusi &amp; Pemaparan Materi
                    </h6>
                    <div
                      className="p-3 rounded-3 bg-light border fs-13px text-dark"
                      style={{ whiteSpace: "pre-wrap", lineHeight: "1.65", minHeight: "120px" }}
                    >
                      {meeting.catatan || <em className="text-muted">Belum ada catatan diskusi rapat.</em>}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h6 className="fw-bold text-dark fs-14px mb-2 d-flex align-items-center">
                      <Icon name="check-circle-cut" className="text-success me-1.5" />
                      3. Kesepakatan &amp; Keputusan Resmi
                    </h6>
                    <div
                      className="p-3 rounded-3 bg-success-dim border border-success border-opacity-25 fs-13px text-dark"
                      style={{ whiteSpace: "pre-wrap", lineHeight: "1.65" }}
                    >
                      {meeting.keputusan || <em className="text-muted">Belum ada keputusan resmi yang ditetapkan.</em>}
                    </div>
                  </div>

                  {/* Dokumentasi Rapat */}
                  {meeting.dokumentasi && meeting.dokumentasi.length > 0 && (
                    <div className="pt-3 border-top">
                      <h6 className="fw-bold text-dark fs-14px mb-2 d-flex align-items-center">
                        <Icon name="img" className="text-primary me-1.5" />
                        4. Dokumentasi &amp; Lampiran Rapat ({meeting.dokumentasi.length})
                      </h6>
                      <Row className="g-3 mt-1">
                        {meeting.dokumentasi.map((doc, idx) => {
                          const isPdf = doc.type === "application/pdf" || doc.name?.toLowerCase().endsWith(".pdf");
                          return (
                            <Col md="4" sm="6" key={doc.id || idx}>
                              <div className="card card-bordered h-100 bg-white rounded-3 overflow-hidden border">
                                {isPdf ? (
                                  <div
                                    className="d-flex flex-column align-items-center justify-content-center p-3 bg-light border-bottom text-center"
                                    style={{ height: "120px", cursor: "pointer" }}
                                    onClick={() => setPreviewItem(doc)}
                                  >
                                    <Icon name="file-pdf" className="text-danger fs-1 mb-1" />
                                    <span className="badge bg-danger fs-10px">DOKUMEN PDF</span>
                                  </div>
                                ) : (
                                  <div
                                    className="bg-dark d-flex align-items-center justify-content-center overflow-hidden"
                                    style={{ height: "120px", cursor: "pointer" }}
                                    onClick={() => setPreviewItem(doc)}
                                  >
                                    <img
                                      src={doc.url}
                                      alt={doc.name}
                                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                  </div>
                                )}
                                <div className="p-2.5 d-flex justify-content-between align-items-center">
                                  <strong className="text-dark fs-12px text-truncate me-2" title={doc.name}>
                                    {doc.name}
                                  </strong>
                                  <Button size="xs" color="primary" outline onClick={() => setPreviewItem(doc)}>
                                    Buka
                                  </Button>
                                </div>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  )}
                </CardBody>
              </Card>
            </TabPane>

            {/* TAB 2: PERTANYAAN & KEPUTUSAN */}
            <TabPane tabId="pertanyaan">
              {questions.length === 0 ? (
                <Card className="border bg-white rounded-4 text-center py-5">
                  <CardBody>
                    <Icon name="help" className="text-muted fs-1 mb-2" />
                    <h6 className="fw-bold text-dark">Belum Ada Pertanyaan Tercatat</h6>
                    <p className="text-muted fs-13px mb-0">
                      Pertanyaan atau aspirasi yang diajukan pada rapat ini akan tampil di sini.
                    </p>
                  </CardBody>
                </Card>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {questions.map((q) => {
                    const statusObj = STATUS_LIST.find((s) => s.id === q.status) || STATUS_LIST[0];
                    const hasDocs = Array.isArray(q.lampiran) && q.lampiran.length > 0;
                    return (
                      <Card key={q.id} className="border bg-white rounded-4 shadow-xs">
                        <CardBody className="p-3 p-md-4">
                          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                            <div className="d-flex align-items-center gap-1.5 flex-wrap">
                              <span className={`badge bg-${statusObj.color} fs-11px`}>{statusObj.label}</span>
                              <span className="badge bg-light text-dark border fs-11px">{q.kategori}</span>
                              {q.output && q.output !== "Belum ditentukan" && (
                                <span className="badge badge-dim bg-primary fs-11px">Output: {q.output}</span>
                              )}
                              {hasDocs && (
                                <span className="badge badge-dim bg-success fs-11px">
                                  <Icon name="clip" className="me-1" />
                                  {q.lampiran.length} Dokumen Bukti
                                </span>
                              )}
                            </div>
                            <Button size="xs" color="primary" outline onClick={() => setSelectedQ(q)}>
                              <Icon name="eye" className="me-1" />
                              Detail &amp; Riwayat RTL
                            </Button>
                          </div>

                          <h6 className="fw-bold text-dark fs-14px mb-1.5" style={{ lineHeight: "1.45" }}>
                            {q.teks}
                          </h6>

                          <div className="text-muted fs-12px mb-2">
                            Penanya: <strong className="text-dark">{q.penanya || "Anonim"}</strong>
                            {q.unit ? ` (${q.unit})` : ""} · PIC:{" "}
                            <strong className="text-dark">{q.pic || "Belum ditugaskan"}</strong>
                            {q.tenggat ? ` · Target: ${fDate(q.tenggat, true)}` : ""}
                          </div>

                          <div className="p-2.5 rounded-3 bg-light border fs-12px">
                            <div className="fw-bold text-dark mb-0.5">Keputusan / Rencana Tindak Lanjut:</div>
                            <div className="text-dark">
                              {q.rencana || (
                                <em className="text-muted">Belum ada keputusan atau tindak lanjut tertulis.</em>
                              )}
                            </div>
                            {q.keterangan && (
                              <div className="mt-1.5 pt-1.5 border-top text-muted">
                                <strong>Hasil Realisasi:</strong> {q.keterangan}
                              </div>
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabPane>

            {/* TAB 3: PANTAU RTL */}
            <TabPane tabId="rtl">
              {rtlQuestions.length === 0 ? (
                <Card className="border bg-white rounded-4 text-center py-5">
                  <CardBody>
                    <Icon name="task" className="text-muted fs-1 mb-2" />
                    <h6 className="fw-bold text-dark">Belum Ada Rencana Tindak Lanjut (RTL)</h6>
                    <p className="text-muted fs-13px mb-0">
                      Daftar rencana tindak lanjut dari pertanyaan rapat akan tampil di sini.
                    </p>
                  </CardBody>
                </Card>
              ) : (
                <Row className="g-3">
                  {rtlQuestions.map((q) => {
                    const statusObj = STATUS_LIST.find((s) => s.id === q.status) || STATUS_LIST[0];
                    const sisa = sisaHari(q.tenggat);
                    const hasDocs = Array.isArray(q.lampiran) && q.lampiran.length > 0;
                    return (
                      <Col md="6" key={q.id}>
                        <Card className="border bg-white rounded-4 h-100 shadow-xs">
                          <CardBody className="p-3 p-md-4 d-flex flex-column justify-content-between">
                            <div>
                              <div className="d-flex justify-content-between align-items-start gap-2 mb-2 flex-wrap">
                                <span className={`badge bg-${statusObj.color} fs-11px`}>{statusObj.label}</span>
                                {q.tenggat && (
                                  <span
                                    className={`badge ${
                                      q.status === "selesai"
                                        ? "bg-success-dim text-success"
                                        : sisa < 0
                                        ? "bg-danger text-white"
                                        : "bg-light text-dark border"
                                    } fs-11px`}
                                  >
                                    Target: {fDate(q.tenggat, true)}
                                  </span>
                                )}
                              </div>

                              <h6 className="fw-bold text-dark fs-14px mb-1">{q.teks}</h6>
                              <div className="text-muted fs-11px mb-2">
                                Oleh: <strong>{q.penanya}</strong> {q.unit ? `(${q.unit})` : ""}
                              </div>

                              <div className="p-2.5 rounded-3 bg-light border mb-2.5 fs-12px">
                                <span className="fw-bold text-dark d-block mb-0.5">Rencana Tindak Lanjut:</span>
                                <p className="mb-0 text-dark">
                                  {q.rencana || <em className="text-muted">Rencana belum dirumuskan.</em>}
                                </p>
                              </div>

                              <div className="d-flex justify-content-between fs-12px text-muted mb-1">
                                <span>
                                  PIC: <strong className="text-dark">{q.pic || "Belum ditugaskan"}</strong>
                                </span>
                                <span>
                                  Progres: <strong className="text-dark">{q.progres || 0}%</strong>
                                </span>
                              </div>
                              <Progress
                                value={q.progres || 0}
                                color={q.progres >= 80 ? "success" : q.progres >= 40 ? "info" : "warning"}
                                className="progress-sm mb-3"
                              />
                            </div>

                            <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                              <span className="fs-11px text-muted">
                                Output: <strong className="text-dark">{q.output || "Belum ditentukan"}</strong>
                                {hasDocs ? ` · ${q.lampiran.length} berkas` : ""}
                              </span>
                              <Button size="xs" color="primary" outline onClick={() => setSelectedQ(q)}>
                                Lihat Detail &amp; Bukti
                              </Button>
                            </div>
                          </CardBody>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              )}
            </TabPane>
          </TabContent>
        </main>

        {/* Modal Detail Pertanyaan & Bukti RTL */}
        <Modal isOpen={Boolean(selectedQ)} toggle={() => setSelectedQ(null)} size="lg">
          {selectedQ && (
            <>
              <ModalHeader toggle={() => setSelectedQ(null)}>
                Detail Pertanyaan &amp; Pantauan Tindak Lanjut
              </ModalHeader>
              <ModalBody>
                <div className="p-3 rounded-3 bg-light border mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-1">
                    <span className="badge bg-primary-dim text-primary">{selectedQ.kategori}</span>
                    <span className="fs-12px text-muted">
                      Penanya: <strong className="text-dark">{selectedQ.penanya}</strong>{" "}
                      {selectedQ.unit ? `(${selectedQ.unit})` : ""}
                    </span>
                  </div>
                  <h6 className="fw-bold text-dark fs-15px mb-0 mt-1">{selectedQ.teks}</h6>
                </div>

                <Row className="g-3 mb-3">
                  <Col sm="6">
                    <div className="p-2.5 rounded-3 border bg-white">
                      <span className="text-muted fs-11px d-block">Status Tindak Lanjut</span>
                      <strong className="text-primary fs-13px text-uppercase">{selectedQ.status}</strong>
                    </div>
                  </Col>
                  <Col sm="6">
                    <div className="p-2.5 rounded-3 border bg-white">
                      <span className="text-muted fs-11px d-block">Wujud Output Keputusan</span>
                      <strong className="text-dark fs-13px">{selectedQ.output || "Belum ditentukan"}</strong>
                    </div>
                  </Col>
                  <Col sm="6">
                    <div className="p-2.5 rounded-3 border bg-white">
                      <span className="text-muted fs-11px d-block">Penanggung Jawab (PIC)</span>
                      <strong className="text-dark fs-13px">{selectedQ.pic || "Belum ditugaskan"}</strong>
                    </div>
                  </Col>
                  <Col sm="6">
                    <div className="p-2.5 rounded-3 border bg-white">
                      <span className="text-muted fs-11px d-block">Tenggat Waktu &amp; Progres</span>
                      <strong className="text-dark fs-13px">
                        {selectedQ.tenggat ? fDate(selectedQ.tenggat, true) : "Belum ditentukan"} ({selectedQ.progres || 0}%)
                      </strong>
                    </div>
                  </Col>
                </Row>

                <div className="mb-3">
                  <h6 className="fw-bold text-dark fs-13px mb-1">Rencana Tindak Lanjut (RTL):</h6>
                  <div className="p-2.5 rounded-3 bg-light border fs-13px">
                    {selectedQ.rencana || <em className="text-muted">Belum ada rencana tertulis.</em>}
                  </div>
                </div>

                {selectedQ.keterangan && (
                  <div className="mb-3">
                    <h6 className="fw-bold text-dark fs-13px mb-1">Keterangan / Hasil Realisasi:</h6>
                    <div className="p-2.5 rounded-3 bg-success-dim border fs-13px text-dark">
                      {selectedQ.keterangan}
                    </div>
                  </div>
                )}

                {/* Lampiran Bukti Dokumen */}
                <div className="mb-3">
                  <h6 className="fw-bold text-dark fs-13px mb-2">
                    Dokumen Keputusan / Bukti Tindak Lanjut ({selectedQ.lampiran?.length || 0}):
                  </h6>
                  {!selectedQ.lampiran || selectedQ.lampiran.length === 0 ? (
                    <div className="p-3 rounded-3 bg-light border text-muted fs-12px">
                      Belum ada dokumen bukti atau SK yang diunggah untuk tindak lanjut ini.
                    </div>
                  ) : (
                    <Row className="g-2">
                      {selectedQ.lampiran.map((doc, idx) => (
                        <Col sm="6" key={doc.id || idx}>
                          <div className="p-2.5 rounded-3 border bg-white d-flex align-items-center justify-content-between">
                            <div className="text-truncate me-2">
                              <Icon
                                name={doc.name?.toLowerCase().endsWith(".pdf") ? "file-pdf" : "img"}
                                className="me-1.5 text-primary"
                              />
                              <strong className="fs-12px text-dark">{doc.name}</strong>
                            </div>
                            <Button size="xs" color="primary" outline onClick={() => setPreviewItem(doc)}>
                              Lihat
                            </Button>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  )}
                </div>

                {/* Riwayat Log */}
                <div>
                  <h6 className="fw-bold text-dark fs-13px mb-2">Riwayat Progres &amp; Pembaruan:</h6>
                  <div className="border rounded-3 p-2.5 bg-light" style={{ maxHeight: "220px", overflowY: "auto" }}>
                    {(selectedQ.log || []).length === 0 ? (
                      <span className="text-muted fs-12px">Belum ada catatan riwayat.</span>
                    ) : (
                      (selectedQ.log || []).map((item, i) => (
                        <div key={item.id || i} className="pb-2 mb-2 border-bottom last-border-0 fs-12px">
                          <div className="text-muted fs-11px">
                            {item.ts ? new Date(Number(item.ts)).toLocaleString("id-ID") : "-"}
                          </div>
                          <div className="text-dark">{item.teks}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="secondary" size="sm" onClick={() => setSelectedQ(null)}>
                  Tutup
                </Button>
              </ModalFooter>
            </>
          )}
        </Modal>

        {/* Modal Pratinjau Berkas */}
        <Modal isOpen={Boolean(previewItem)} toggle={() => setPreviewItem(null)} size="lg">
          {previewItem && (
            <>
              <ModalHeader toggle={() => setPreviewItem(null)}>{previewItem.name}</ModalHeader>
              <ModalBody className="text-center p-0 bg-dark">
                {previewItem.type === "application/pdf" || previewItem.name?.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    src={previewItem.url}
                    title={previewItem.name}
                    style={{ width: "100%", height: "75vh", border: "none" }}
                  />
                ) : (
                  <img
                    src={previewItem.url}
                    alt={previewItem.name}
                    style={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain" }}
                  />
                )}
              </ModalBody>
              <ModalFooter>
                <a
                  href={previewItem.url}
                  target="_blank"
                  rel="noreferrer"
                  download={previewItem.name}
                  className="btn btn-primary btn-sm"
                >
                  <Icon name="download" className="me-1" /> Unduh Berkas
                </a>
                <Button color="secondary" size="sm" onClick={() => setPreviewItem(null)}>
                  Tutup
                </Button>
              </ModalFooter>
            </>
          )}
        </Modal>

        <footer className="py-3 text-center border-top bg-white fs-12px text-muted d-print-none">
          &copy; {new Date().getFullYear()} SMK Hassina Sukabumi · Dokumen Notulensi Publik
        </footer>
      </div>
    </React.Fragment>
  );
};

export default PublicNotula;

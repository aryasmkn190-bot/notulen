import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Row,
  Col,
  Badge,
  Button,
  Progress,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
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
} from "@/components/Component";
import {
  useNotula,
  fDate,
  todayISO,
  sisaHari,
  JENIS_LIST,
  STATUS_LIST,
} from "@/notula-context/NotulaContext";

// Helper badge jenis rapat
const getJenisBadgeColor = (jenis) => {
  switch (jenis) {
    case "Rapat Dinas":
      return "badge-subtle-primary";
    case "Rapat Kurikulum":
      return "badge-subtle-info";
    case "Rapat Kesiswaan":
      return "badge-subtle-warning";
    case "Rapat Guru":
      return "badge-subtle-success";
    default:
      return "badge-subtle-secondary";
  }
};

const DashboardNotula = () => {
  const { meetings, questions, addMeeting } = useNotula();
  const navigate = useNavigate();

  // Modal Buat Rapat Baru
  const [modalNewMeeting, setModalNewMeeting] = useState(false);
  const [newMeetingForm, setNewMeetingForm] = useState({
    judul: "",
    jenis: "Rapat Dinas",
    tanggal: todayISO(),
    waktu: "08.00 – 11.00 WIB",
    tempat: "Aula SMK Hassina",
    pemimpin: "Kepala Sekolah — Sumarno, M.Pd.",
    notulis: "Arya Putra Perdana, S.Kom.",
    peserta: "Semua Guru & Tenaga Kependidikan SMK Hassina",
  });

  // Filter tab untuk Prioritas RTL
  const [rtlFilter, setRtlFilter] = useState("all");

  const handleCreateMeeting = (e) => {
    e.preventDefault();
    if (!newMeetingForm.judul.trim()) return;
    const created = addMeeting(newMeetingForm);
    setModalNewMeeting(false);
    navigate(`/rapat/${created.id}`);
  };

  // Kalkulasi metrik statistik
  const totalMeetings = meetings.length;
  const finishedMeetings = meetings.filter((m) => m.status === "selesai").length;
  const draftMeetings = meetings.filter((m) => m.status !== "selesai").length;

  const totalQuestions = questions.length;
  const newQuestions = questions.filter((q) => q.status === "baru").length;
  const activeQuestions = questions.filter(
    (q) => q.status === "perlu" || q.status === "proses"
  );
  const finishedQuestions = questions.filter((q) => q.status === "selesai");
  const overdueQuestions = activeQuestions.filter(
    (q) => q.tenggat && sisaHari(q.tenggat) < 0
  );
  const urgentQuestions = activeQuestions.filter(
    (q) => q.tenggat && sisaHari(q.tenggat) >= 0 && sisaHari(q.tenggat) <= 3
  );

  // Daftar prioritas RTL dengan filter interaktif
  const filteredPriorityList = useMemo(() => {
    let list = [...activeQuestions].sort((a, b) =>
      (a.tenggat || "9999").localeCompare(b.tenggat || "9999")
    );
    if (rtlFilter === "urgent") {
      list = list.filter((q) => q.tenggat && sisaHari(q.tenggat) <= 3);
    } else if (rtlFilter === "proses") {
      list = list.filter((q) => q.status === "proses");
    } else if (rtlFilter === "perlu") {
      list = list.filter((q) => q.status === "perlu");
    }
    return list;
  }, [activeQuestions, rtlFilter]);

  // Rapat terbaru (diurutkan berdasarkan tanggal terbaru)
  const recentMeetings = [...meetings]
    .sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""))
    .slice(0, 6);

  return (
    <React.Fragment>
      <Head title="Beranda Notula - SMK Hassina Sukabumi" />
      <Content>
        {/* Native DashLite BlockHead (Spacious, Executive & Non-Cramped) */}
        <BlockHead size="lg" className="mb-4 pb-2">
          <BlockBetween size="md" className="g-3 align-items-md-center">
            <BlockHeadContent>
              <div className="notula-page-meta">
                <span className="meta-school-pill">
                  <Icon name="building" className="me-1" />
                  SMK HASSINA SUKABUMI
                </span>
                <span className="meta-date-pill">
                  <span className="live-indicator-dot me-1"></span>
                  Tahun Ajaran 2026/2027 • Semester Ganjil
                </span>
                <span className="meta-date-pill">
                  <Icon name="clock" className="me-1 text-primary" />
                  {fDate(todayISO())}
                </span>
              </div>
              <BlockTitle
                page
                tag="h2"
                className="fw-bolder text-dark notula-page-title notula-dashboard-title"
              >
                Manajemen Rapat &amp; Notulensi Sekolah
              </BlockTitle>
              <BlockDes>
                <p className="fs-15px mb-0" style={{ maxWidth: "780px", lineHeight: "1.75", color: "#526484" }}>
                  Dokumentasi resmi risalah musyawarah guru & tenaga kependidikan, arsip keputusan dinas, serta pemantauan terpusat realisasi rencana tindak lanjut (RTL).
                </p>
              </BlockDes>
            </BlockHeadContent>
            <BlockHeadContent className="mt-3 mt-md-0">
              <div className="toggle-wrap nk-block-tools-toggle">
                <ul className="nk-block-tools g-2 flex-wrap">
                  <li>
                    <Link to="/rapat" className="btn btn-white btn-outline-light shadow-sm px-3 py-2 fw-semibold">
                      <Icon name="list-thumb" className="me-1.5 text-primary fs-15px" />
                      <span>Daftar Rapat</span>
                    </Link>
                  </li>
                  <li className="nk-block-tools-opt">
                    <Button
                      color="primary"
                      className="btn-gradient-primary fw-bold shadow-sm px-3.5 py-2"
                      onClick={() => setModalNewMeeting(true)}
                    >
                      <Icon name="plus" className="me-1.5 fs-15px" />
                      <span>Catat Rapat Baru</span>
                    </Button>
                  </li>
                </ul>
              </div>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        {/* 4 Stat Cards Utama (Elevated & Executive) */}
        <Block className="mb-4">
          <Row className="g-3 g-md-4">
            {/* Card 1: Rapat Tercatat */}
            <Col sm="6" xl="3">
              <Card className="stat-card-executive stat-primary h-100 p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <span className="text-muted fw-bold fs-12px text-uppercase" style={{ letterSpacing: "0.6px" }}>
                      Rapat Tercatat
                    </span>
                    <div className="stat-amount text-dark">{totalMeetings}</div>
                  </div>
                  <div
                    className="stat-icon-wrap"
                    style={{
                      background: "rgba(9, 113, 254, 0.1)",
                      color: "#0971fe",
                    }}
                  >
                    <Icon name="calendar-booking" />
                  </div>
                </div>
                <div className="mt-auto pt-2 border-top border-light d-flex align-items-center justify-content-between">
                  <span className="stat-subtext">
                    <strong className="text-dark">{finishedMeetings}</strong> selesai
                  </span>
                  <span className="badge bg-light text-muted fs-11px">
                    {draftMeetings} draf
                  </span>
                </div>
              </Card>
            </Col>

            {/* Card 2: Aspirasi / Pertanyaan */}
            <Col sm="6" xl="3">
              <Card className="stat-card-executive stat-info h-100 p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <span className="text-muted fw-bold fs-12px text-uppercase" style={{ letterSpacing: "0.6px" }}>
                      Aspirasi & Masukan
                    </span>
                    <div className="stat-amount text-dark">{totalQuestions}</div>
                  </div>
                  <div
                    className="stat-icon-wrap"
                    style={{
                      background: "rgba(2, 132, 199, 0.1)",
                      color: "#0284c7",
                    }}
                  >
                    <Icon name="help" />
                  </div>
                </div>
                <div className="mt-auto pt-2 border-top border-light d-flex align-items-center justify-content-between">
                  <span className="stat-subtext">
                    <strong className="text-dark">{newQuestions}</strong> perlu dibahas
                  </span>
                  <span className="badge bg-info-dim text-info fs-11px">
                    Semua Unit
                  </span>
                </div>
              </Card>
            </Col>

            {/* Card 3: Tindak Lanjut Aktif */}
            <Col sm="6" xl="3">
              <Card className="stat-card-executive stat-warning h-100 p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <span className="text-muted fw-bold fs-12px text-uppercase" style={{ letterSpacing: "0.6px" }}>
                      Tindak Lanjut Aktif
                    </span>
                    <div className="stat-amount text-dark">{activeQuestions.length}</div>
                  </div>
                  <div
                    className="stat-icon-wrap"
                    style={{
                      background: "rgba(217, 119, 6, 0.1)",
                      color: "#d97706",
                    }}
                  >
                    <Icon name="task" />
                  </div>
                </div>
                <div className="mt-auto pt-2 border-top border-light d-flex align-items-center justify-content-between">
                  {overdueQuestions.length > 0 ? (
                    <span className="stat-subtext text-danger fw-bold">
                      <Icon name="alert-circle" className="me-1" />
                      {overdueQuestions.length} lewat tenggat
                    </span>
                  ) : urgentQuestions.length > 0 ? (
                    <span className="stat-subtext text-warning fw-bold">
                      <Icon name="clock" className="me-1" />
                      {urgentQuestions.length} tenggat dekat
                    </span>
                  ) : (
                    <span className="stat-subtext text-success fw-semibold">
                      <Icon name="check" className="me-1" />
                      Sesuai jadwal dinas
                    </span>
                  )}
                  <span className="badge bg-warning-dim text-warning fs-11px">
                    RTL
                  </span>
                </div>
              </Card>
            </Col>

            {/* Card 4: Capaian Selesai */}
            <Col sm="6" xl="3">
              <Card className="stat-card-executive stat-success h-100 p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <span className="text-muted fw-bold fs-12px text-uppercase" style={{ letterSpacing: "0.6px" }}>
                      Capaian Selesai
                    </span>
                    <div className="stat-amount text-success">{finishedQuestions.length}</div>
                  </div>
                  <div
                    className="stat-icon-wrap"
                    style={{
                      background: "rgba(5, 150, 105, 0.1)",
                      color: "#059669",
                    }}
                  >
                    <Icon name="check-circle" />
                  </div>
                </div>
                <div className="mt-auto pt-2 border-top border-light d-flex align-items-center justify-content-between">
                  <span className="stat-subtext">
                    <strong className="text-dark">
                      {finishedQuestions.filter((q) => q.output !== "Belum ditentukan").length}
                    </strong>{" "}
                    SK, SOP & regulasi terbit
                  </span>
                  <span className="badge bg-success-dim text-success fs-11px">
                    Tuntas
                  </span>
                </div>
              </Card>
            </Col>
          </Row>
        </Block>

        {/* Dua Kolom Utama: Agenda Rapat & Prioritas RTL (DashLite Native System) */}
        <Block>
          <Row className="g-gs">
            {/* Kolom Kiri: Agenda Rapat Terbaru */}
            <Col lg="7">
              <Card className="card-bordered card-full">
                <div className="card-inner border-bottom py-3">
                  <div className="card-title-group">
                    <div className="card-title">
                      <h6 className="title fs-15px text-dark fw-bold">
                        <Icon name="calendar" className="me-2 text-primary fs-16px" />
                        Agenda & Rapat Terbaru
                      </h6>
                    </div>
                    <div className="card-tools">
                      <Link to="/rapat" className="link text-primary fw-semibold fs-13px">
                        <span>Lihat Semua ({totalMeetings})</span>
                        <Icon name="arrow-right" className="ms-1" />
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="card-inner p-0">
                  <div className="nk-tb-list nk-tb-ulist">
                    <div className="nk-tb-item nk-tb-head bg-light py-2">
                      <div className="nk-tb-col">
                        <span className="sub-text fw-bold">Topik Rapat</span>
                      </div>
                      <div className="nk-tb-col tb-col-md">
                        <span className="sub-text fw-bold">Waktu & Lokasi</span>
                      </div>
                      <div className="nk-tb-col tb-col-sm">
                        <span className="sub-text fw-bold">Status</span>
                      </div>
                      <div className="nk-tb-col nk-tb-col-tools text-end">
                        <span className="sub-text fw-bold">Aksi</span>
                      </div>
                    </div>

                    {recentMeetings.slice(0, 3).map((m) => {
                      const mQs = questions.filter((q) => q.mid === m.id);
                      const mActive = mQs.filter(
                        (q) => q.status === "perlu" || q.status === "proses"
                      ).length;

                      return (
                        <div key={m.id} className="nk-tb-item py-3">
                          <div className="nk-tb-col">
                            <Link to={`/rapat/${m.id}`} className="project-title text-decoration-none">
                              <h6 className="title fs-14px mb-1 text-dark fw-bold">
                                {m.judul}
                              </h6>
                            </Link>
                            <div className="d-flex align-items-center gap-2 flex-wrap text-muted fs-12px">
                              <span className={`badge ${getJenisBadgeColor(m.jenis)} rounded-pill fs-11px fw-bold px-2 py-0.5`}>
                                {m.jenis}
                              </span>
                              <span>• {mQs.length} Pertanyaan</span>
                              {mActive > 0 && (
                                <span className="badge badge-warning-strong rounded-pill fs-11px px-2 py-0.5">
                                  <Icon name="task" className="me-1" />
                                  {mActive} RTL Aktif
                                </span>
                              )}
                            </div>
                            <div className="d-md-none text-muted fs-11px mt-1">
                              <Icon name="calendar" className="me-1" />
                              {fDate(m.tanggal, true)} • {m.tempat}
                            </div>
                          </div>

                          <div className="nk-tb-col tb-col-md">
                            <span className="text-dark fw-bold fs-13px d-block">
                              <Icon name="calendar-alt" className="text-muted me-1" />
                              {fDate(m.tanggal, true)}
                            </span>
                            <span className="text-muted fs-12px d-block">
                              <Icon name="clock" className="text-muted me-1" />
                              {m.waktu}
                            </span>
                            <span className="text-muted fs-12px d-block">
                              <Icon name="map-pin" className="text-muted me-1" />
                              {m.tempat}
                            </span>
                          </div>

                          <div className="nk-tb-col tb-col-sm">
                            {m.status === "selesai" ? (
                              <span className="badge badge-selesai px-2.5 py-1">
                                <Icon name="check" className="me-1" />
                                Selesai
                              </span>
                            ) : (
                              <span className="badge badge-draf px-2.5 py-1">
                                <Icon name="edit" className="me-1" />
                                Draf
                              </span>
                            )}
                          </div>

                          <div className="nk-tb-col nk-tb-col-tools text-end">
                            <Link
                              to={`/rapat/${m.id}`}
                              className="btn btn-sm btn-icon btn-outline-light text-primary"
                              title="Buka Notulensi"
                            >
                              <Icon name="chevron-right" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </Col>

            {/* Kolom Kanan: Prioritas Tindak Lanjut (DashLite Native Table) */}
            <Col lg="5">
              <Card className="card-bordered card-full">
                <div className="card-inner border-bottom py-3">
                  <div className="card-title-group">
                    <div className="card-title">
                      <h6 className="title fs-15px text-dark fw-bold">
                        <Icon name="task" className="me-2 text-warning fs-16px" />
                        Prioritas Tindak Lanjut
                      </h6>
                    </div>
                    <div className="card-tools">
                      <ul className="card-tools-nav">
                        <li className={rtlFilter === "all" ? "active" : ""}>
                          <a
                            href="#all"
                            onClick={(e) => {
                              e.preventDefault();
                              setRtlFilter("all");
                            }}
                          >
                            <span>Semua ({activeQuestions.length})</span>
                          </a>
                        </li>
                        <li className={rtlFilter === "proses" ? "active" : ""}>
                          <a
                            href="#proses"
                            onClick={(e) => {
                              e.preventDefault();
                              setRtlFilter("proses");
                            }}
                          >
                            <span>Proses</span>
                          </a>
                        </li>
                        <li className={rtlFilter === "perlu" ? "active" : ""}>
                          <a
                            href="#perlu"
                            onClick={(e) => {
                              e.preventDefault();
                              setRtlFilter("perlu");
                            }}
                          >
                            <span>Perlu RTL</span>
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="card-inner p-0">
                  {filteredPriorityList.length === 0 ? (
                    <div className="text-center py-5 text-muted px-3">
                      <Icon name="check-circle" className="text-success fs-1 mb-2" />
                      <h6 className="fs-15px text-dark fw-bold">Semua Tugas Terkendali</h6>
                      <p className="mb-0 fs-13px text-muted">
                        Tidak ada rencana tindak lanjut yang tertunda pada kategori ini.
                      </p>
                    </div>
                  ) : (
                    <div className="nk-tb-list nk-tb-ulist">
                      <div className="nk-tb-item nk-tb-head bg-light py-2">
                        <div className="nk-tb-col">
                          <span className="sub-text fw-bold">Tindak Lanjut & PIC</span>
                        </div>
                        <div className="nk-tb-col tb-col-sm">
                          <span className="sub-text fw-bold">Tenggat & Progres</span>
                        </div>
                        <div className="nk-tb-col text-end">
                          <span className="sub-text fw-bold">Status</span>
                        </div>
                      </div>

                      {filteredPriorityList.slice(0, 3).map((q) => {
                        const sisa = sisaHari(q.tenggat);
                        const statusObj =
                          STATUS_LIST.find((s) => s.id === q.status) || STATUS_LIST[0];
                        const isOverdue = q.tenggat && sisa < 0;
                        const isUrgent = q.tenggat && sisa >= 0 && sisa <= 3;
                        const parentM = meetings.find((m) => m.id === q.mid);

                        return (
                          <div key={q.id} className="nk-tb-item py-3">
                            <div className="nk-tb-col">
                              <Link to={`/rapat/${q.mid}`} className="project-title text-decoration-none">
                                <h6
                                  className="title fs-13px mb-1 text-dark fw-bold text-clamp-2"
                                  title={q.teks}
                                  style={{ lineHeight: "1.4" }}
                                >
                                  {q.teks || "Tindak lanjut belum memiliki deskripsi"}
                                </h6>
                              </Link>
                              <div className="d-flex align-items-center gap-1.5 flex-wrap fs-11px text-muted">
                                <span>
                                  PIC: <strong className="text-dark">{q.pic || "Belum ada"}</strong>
                                </span>
                                {parentM && (
                                  <>
                                    <span>•</span>
                                    <span className="badge bg-light text-muted border px-1.5 py-0">
                                      {parentM.jenis}
                                    </span>
                                  </>
                                )}
                                {q.output && (
                                  <>
                                    <span>•</span>
                                    <span className="badge badge-subtle-primary px-1.5 py-0">
                                      {q.output}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="nk-tb-col tb-col-sm">
                              <div className="mb-1">
                                {q.tenggat ? (
                                  isOverdue ? (
                                    <span className="badge badge-danger-strong fs-11px px-2 py-0.5">
                                      <Icon name="alert-circle" className="me-1" />
                                      Lewat {Math.abs(sisa)} hari
                                    </span>
                                  ) : isUrgent ? (
                                    <span className="badge badge-warning-strong fs-11px px-2 py-0.5">
                                      <Icon name="clock" className="me-1" />
                                      {sisa === 0 ? "Hari ini" : `${sisa} hr lagi`}
                                    </span>
                                  ) : (
                                    <span className="text-muted fs-12px">
                                      <Icon name="calendar" className="me-1" />
                                      {fDate(q.tenggat, true)}
                                    </span>
                                  )
                                ) : (
                                  <span className="text-muted fs-12px">Tanpa batas</span>
                                )}
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="progress flex-grow-1"
                                  style={{ height: "5px", borderRadius: "10px", background: "#e2e8f0" }}
                                >
                                  <div
                                    className={`progress-bar ${
                                      (q.progres || 0) >= 75
                                        ? "bg-success"
                                        : (q.progres || 0) >= 40
                                        ? "bg-info"
                                        : "bg-warning"
                                    }`}
                                    style={{ width: `${q.progres || 0}%`, borderRadius: "10px" }}
                                  />
                                </div>
                                <span className="fs-11px fw-bold text-dark" style={{ minWidth: "26px" }}>
                                  {q.progres || 0}%
                                </span>
                              </div>
                            </div>

                            <div className="nk-tb-col text-end">
                              <span className={`badge badge-dim bg-${statusObj.color} fs-11px fw-bold px-2 py-1 mb-1 d-inline-block`}>
                                {statusObj.label === "Perlu Tindak Lanjut" ? "Perlu RTL" : statusObj.label}
                              </span>
                              <div>
                                <Link
                                  to={`/rapat/${q.mid}`}
                                  className="btn btn-sm btn-icon btn-outline-light text-primary"
                                  title="Buka Dokumen Rapat"
                                >
                                  <Icon name="chevron-right" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </Block>

        {/* Modal Catat Rapat Baru */}
        <Modal
          isOpen={modalNewMeeting}
          toggle={() => setModalNewMeeting(!modalNewMeeting)}
          className="modal-dialog-centered modal-lg"
        >
          <ModalHeader toggle={() => setModalNewMeeting(!modalNewMeeting)}>
            <div className="d-flex align-items-center gap-2">
              <div
                className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle"
                style={{ width: "32px", height: "32px" }}
              >
                <Icon name="plus" />
              </div>
              <span className="fw-bold fs-16px text-dark">Catat Dokumen Rapat Baru</span>
            </div>
          </ModalHeader>
          <Form onSubmit={handleCreateMeeting}>
            <ModalBody className="p-4">
              <Row className="g-3">
                <Col md="12">
                  <FormGroup>
                    <Label className="form-label fw-bold fs-13px" htmlFor="m-judul">
                      Judul / Topik Rapat <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="m-judul"
                      required
                      placeholder="Contoh: Rapat Koordinasi Kurikulum & Pembagian Beban Ajar"
                      value={newMeetingForm.judul}
                      onChange={(e) =>
                        setNewMeetingForm({
                          ...newMeetingForm,
                          judul: e.target.value,
                        })
                      }
                    />
                  </FormGroup>
                </Col>

                <Col sm="6">
                  <FormGroup>
                    <Label className="form-label fw-bold fs-13px" htmlFor="m-jenis">
                      Jenis Rapat
                    </Label>
                    <Input
                      type="select"
                      id="m-jenis"
                      value={newMeetingForm.jenis}
                      onChange={(e) =>
                        setNewMeetingForm({
                          ...newMeetingForm,
                          jenis: e.target.value,
                        })
                      }
                    >
                      {JENIS_LIST.map((j) => (
                        <option key={j} value={j}>
                          {j}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>

                <Col sm="6">
                  <FormGroup>
                    <Label className="form-label fw-bold fs-13px" htmlFor="m-tanggal">
                      Tanggal Pelaksanaan
                    </Label>
                    <Input
                      type="date"
                      id="m-tanggal"
                      value={newMeetingForm.tanggal}
                      onChange={(e) =>
                        setNewMeetingForm({
                          ...newMeetingForm,
                          tanggal: e.target.value,
                        })
                      }
                    />
                  </FormGroup>
                </Col>

                <Col sm="6">
                  <FormGroup>
                    <Label className="form-label fw-bold fs-13px" htmlFor="m-waktu">
                      Waktu
                    </Label>
                    <Input
                      type="text"
                      id="m-waktu"
                      placeholder="Contoh: 08.00 – 11.00 WIB"
                      value={newMeetingForm.waktu}
                      onChange={(e) =>
                        setNewMeetingForm({
                          ...newMeetingForm,
                          waktu: e.target.value,
                        })
                      }
                    />
                  </FormGroup>
                </Col>

                <Col sm="6">
                  <FormGroup>
                    <Label className="form-label fw-bold fs-13px" htmlFor="m-tempat">
                      Tempat / Ruangan
                    </Label>
                    <Input
                      type="text"
                      id="m-tempat"
                      placeholder="Contoh: Aula SMK Hassina"
                      value={newMeetingForm.tempat}
                      onChange={(e) =>
                        setNewMeetingForm({
                          ...newMeetingForm,
                          tempat: e.target.value,
                        })
                      }
                    />
                  </FormGroup>
                </Col>

                <Col sm="6">
                  <FormGroup>
                    <Label className="form-label fw-bold fs-13px" htmlFor="m-pemimpin">
                      Pemimpin Rapat
                    </Label>
                    <Input
                      type="text"
                      id="m-pemimpin"
                      placeholder="Nama pimpinan rapat"
                      value={newMeetingForm.pemimpin}
                      onChange={(e) =>
                        setNewMeetingForm({
                          ...newMeetingForm,
                          pemimpin: e.target.value,
                        })
                      }
                    />
                  </FormGroup>
                </Col>

                <Col sm="6">
                  <FormGroup>
                    <Label className="form-label fw-bold fs-13px" htmlFor="m-notulis">
                      Notulis (Pencatat Risalah)
                    </Label>
                    <Input
                      type="text"
                      id="m-notulis"
                      placeholder="Nama pencatat notula"
                      value={newMeetingForm.notulis}
                      onChange={(e) =>
                        setNewMeetingForm({
                          ...newMeetingForm,
                          notulis: e.target.value,
                        })
                      }
                    />
                  </FormGroup>
                </Col>

                <Col md="12">
                  <FormGroup>
                    <Label className="form-label fw-bold fs-13px" htmlFor="m-peserta">
                      Peserta Hadir
                    </Label>
                    <Input
                      type="text"
                      id="m-peserta"
                      placeholder="Contoh: Dewan Guru, Staf TU, Kepala Lab, Pembina OSIS"
                      value={newMeetingForm.peserta}
                      onChange={(e) =>
                        setNewMeetingForm({
                          ...newMeetingForm,
                          peserta: e.target.value,
                        })
                      }
                    />
                  </FormGroup>
                </Col>
              </Row>
            </ModalBody>
            <ModalFooter className="bg-light border-top py-3 px-4">
              <Button
                color="white"
                className="btn-outline-light rounded-pill px-3"
                type="button"
                onClick={() => setModalNewMeeting(false)}
              >
                Batal
              </Button>
              <Button
                color="primary"
                className="btn-gradient-primary rounded-pill px-4 fw-bold"
                type="submit"
              >
                <Icon name="check" className="me-1" />
                <span>Mulai Notulensi</span>
              </Button>
            </ModalFooter>
          </Form>
        </Modal>
      </Content>
    </React.Fragment>
  );
};

export default DashboardNotula;

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
  Form,
  FormGroup,
  Label,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert,
  Progress,
  Spinner,
} from "reactstrap";
import classnames from "classnames";
import LogoHassina from "@/images/logo-hassina.png";
import Head from "@/layout/head/Head";
import { Icon } from "@/components/Component";
import { fDate, STATUS_LIST, KATEGORI_LIST } from "@/notula-context/NotulaContext";

const JABATAN_LIST = [
  "Wali Kelas",
  "Guru Mata Pelajaran (Mapel)",
  "Guru Produktif / Kejuruan",
  "Ketua Program Keahlian (Kaprog)",
  "Guru BK (Bimbingan Konseling)",
  "Wakil Kepala Sekolah",
  "Pembina Ekstrakurikuler",
  "Staf Tata Usaha / Tendik",
  "Kepala Laboratorium / Bengkel",
  "Lainnya",
];

const LiveSessionRapat = () => {
  const { token } = useParams();
  const storageKey = `notula_live_participant_${token}`;

  const [participant, setParticipant] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [joinForm, setJoinForm] = useState({
    nama: "",
    jabatan: "Guru Mata Pelajaran (Mapel)",
    jabatanDetail: "",
  });
  const [joinError, setJoinError] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meeting, setMeeting] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState("tanya");
  const [qFilter, setQFilter] = useState("all"); // 'all' | 'mine'
  const [selectedQ, setSelectedQ] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  // Submit question form state
  const [qTeks, setQTeks] = useState("");
  const [qKategori, setQKategori] = useState("Kurikulum");
  const [submitting, setSubmitting] = useState(false);
  const [submitAlert, setSubmitAlert] = useState(null);

  const fetchLiveData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await fetch(`/api/public/live/${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Sesi rapat tidak ditemukan atau tautan telah diperbarui.");
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
    },
    [token]
  );

  useEffect(() => {
    fetchLiveData(false);
    const interval = setInterval(() => {
      fetchLiveData(true);
    }, 3500);
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  // Keep modal question synced with live updates
  useEffect(() => {
    if (selectedQ) {
      const updated = questions.find((q) => q.id === selectedQ.id);
      if (updated) setSelectedQ(updated);
    }
  }, [questions, selectedQ]);

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    const cleanNama = joinForm.nama.trim();
    if (!cleanNama || cleanNama.length < 3) {
      setJoinError("Silakan isi nama lengkap Anda (minimal 3 karakter).");
      return;
    }
    const detail = joinForm.jabatanDetail.trim();
    const unitFinal = detail ? `${joinForm.jabatan} (${detail})` : joinForm.jabatan;

    const pData = {
      id: participant?.id || `live-usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      nama: cleanNama,
      jabatan: joinForm.jabatan,
      jabatanDetail: detail,
      unit: unitFinal,
      joinedAt: Date.now(),
    };
    localStorage.setItem(storageKey, JSON.stringify(pData));
    setParticipant(pData);
    setJoinError("");
  };

  const handleEditIdentity = () => {
    if (participant) {
      setJoinForm({
        nama: participant.nama || "",
        jabatan: participant.jabatan || "Guru Mata Pelajaran (Mapel)",
        jabatanDetail: participant.jabatanDetail || "",
      });
    }
    setParticipant(null);
  };

  const handleSendQuestion = async (e) => {
    e.preventDefault();
    if (!participant) return;
    const cleanTeks = qTeks.trim();
    if (cleanTeks.length < 5) {
      setSubmitAlert({ type: "danger", text: "Pertanyaan atau masukan minimal 5 karakter." });
      return;
    }

    setSubmitting(true);
    setSubmitAlert(null);
    try {
      const res = await fetch(`/api/public/live/${encodeURIComponent(token)}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participant.id,
          penanya: participant.nama,
          unit: participant.unit,
          teks: cleanTeks,
          kategori: qKategori,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim pertanyaan.");
      }
      setQuestions((prev) => [data, ...prev.filter((x) => x.id !== data.id)]);
      setQTeks("");
      setSubmitAlert({
        type: "success",
        text: "Pertanyaan berhasil dikirim ke meja pimpinan & notulen rapat!",
      });
    } catch (err) {
      setSubmitAlert({ type: "danger", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-light">
        <Spinner color="primary" />
        <p className="mt-2 text-muted fs-13px">Menghubungkan ke Sesi Rapat Langsung...</p>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-light px-3">
        <Head title="Sesi Rapat Tidak Ditemukan — SMK Hassina" />
        <Card className="border-0 shadow-sm rounded-4" style={{ maxWidth: "430px", width: "100%" }}>
          <CardBody className="p-4 p-sm-5 text-center">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger-dim text-danger mb-3"
              style={{ width: "56px", height: "56px" }}
            >
              <Icon name="alert-circle" className="fs-2" />
            </div>
            <h5 className="fw-bold text-dark mb-2">Tautan Sesi Tidak Ditemukan</h5>
            <p className="text-muted fs-13px mb-4">
              {error || "Tautan sesi rapat tidak valid atau telah diganti oleh notulen rapat."}
            </p>
            <Button color="primary" outline size="sm" onClick={() => fetchLiveData(false)}>
              <Icon name="reload" className="me-1" /> Coba Lagi
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // GATE: Require Nama & Jabatan before entering live room
  if (!participant) {
    return (
      <React.Fragment>
        <Head title={`Gabung Rapat: ${meeting.judul} | SMK Hassina`} />
        <div
          className="min-vh-100 d-flex flex-column justify-content-center align-items-center px-3 py-4"
          style={{ backgroundColor: "#f8fafc" }}
        >
          <div style={{ width: "100%", maxWidth: "430px" }}>
            <Card
              className="border bg-white rounded-4 overflow-hidden"
              style={{
                borderColor: "#e2e8f0",
                boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.06)",
              }}
            >
              <div style={{ height: "4px", backgroundColor: meeting.is_live_active ? "#10b981" : "#64748b" }} />
              <CardBody className="p-4 p-sm-5">
                <div className="text-center mb-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center mb-3 bg-light rounded-3 border"
                    style={{ width: "54px", height: "54px", borderColor: "#e2e8f0" }}
                  >
                    <img
                      src={LogoHassina}
                      alt="SMK Hassina"
                      style={{ width: "36px", height: "36px", objectFit: "contain" }}
                    />
                  </div>
                  <div className="mb-1">
                    {meeting.is_live_active ? (
                      <span className="badge bg-success-dim text-success fw-bold fs-11px px-2.5 py-1 rounded-pill">
                        ● SESI RAPAT AKTIF
                      </span>
                    ) : (
                      <span className="badge bg-light text-muted border fs-11px px-2.5 py-1 rounded-pill">
                        SESI TERTUTUP / ARSIP
                      </span>
                    )}
                  </div>
                  <h5 className="fw-bold text-dark mb-1 mt-2" style={{ fontSize: "17px", lineHeight: "1.35" }}>
                    {meeting.judul}
                  </h5>
                  <p className="text-muted mb-0" style={{ fontSize: "12px" }}>
                    {fDate(meeting.tanggal)} · {meeting.tempat || "SMK Hassina"}
                  </p>
                </div>

                <div className="p-2.5 rounded-3 bg-light border mb-3 fs-12px text-muted">
                  Silakan isi <strong>Nama Lengkap</strong> dan <strong>Jabatan</strong> Anda terlebih dahulu untuk bergabung ke ruang rapat, memantau notulensi *real-time*, dan menyampaikan pertanyaan.
                </div>

                {joinError && (
                  <Alert color="danger" className="py-2 px-3 fs-12px mb-3 border-0 rounded-3">
                    <Icon name="alert-circle" className="me-1.5" />
                    {joinError}
                  </Alert>
                )}

                <Form onSubmit={handleJoinSubmit}>
                  <FormGroup className="mb-3">
                    <Label className="form-label fs-12px fw-semibold text-dark mb-1" htmlFor="join-nama">
                      Nama Lengkap &amp; Gelar <span className="text-danger">*</span>
                    </Label>
                    <Input
                      id="join-nama"
                      type="text"
                      autoFocus
                      placeholder="Contoh: Rina Marlina, S.Pd."
                      value={joinForm.nama}
                      onChange={(e) => setJoinForm({ ...joinForm, nama: e.target.value })}
                      className="rounded-3"
                      style={{ height: "42px", fontSize: "13.5px" }}
                    />
                  </FormGroup>

                  <FormGroup className="mb-3">
                    <Label className="form-label fs-12px fw-semibold text-dark mb-1" htmlFor="join-jabatan">
                      Jabatan / Peran di Sekolah <span className="text-danger">*</span>
                    </Label>
                    <Input
                      id="join-jabatan"
                      type="select"
                      value={joinForm.jabatan}
                      onChange={(e) => setJoinForm({ ...joinForm, jabatan: e.target.value })}
                      className="rounded-3"
                      style={{ height: "42px", fontSize: "13.5px" }}
                    >
                      {JABATAN_LIST.map((j) => (
                        <option key={j} value={j}>
                          {j}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>

                  <FormGroup className="mb-4">
                    <Label className="form-label fs-12px fw-semibold text-dark mb-1" htmlFor="join-detail">
                      Keterangan Kelas / Mata Pelajaran <span className="text-muted fw-normal">(Opsional)</span>
                    </Label>
                    <Input
                      id="join-detail"
                      type="text"
                      placeholder="Contoh: Wali Kelas XI TJKT 1 / Guru Matematika"
                      value={joinForm.jabatanDetail}
                      onChange={(e) => setJoinForm({ ...joinForm, jabatanDetail: e.target.value })}
                      className="rounded-3"
                      style={{ height: "42px", fontSize: "13.5px" }}
                    />
                  </FormGroup>

                  <Button
                    type="submit"
                    color="primary"
                    className="w-100 py-2.5 rounded-3 fw-semibold fs-13px d-flex align-items-center justify-content-center"
                    style={{ height: "42px", backgroundColor: "#2563eb", borderColor: "#2563eb" }}
                  >
                    <span>Masuk ke Ruang Rapat</span>
                    <Icon name="arrow-right" className="ms-1.5" />
                  </Button>
                </Form>
              </CardBody>
            </Card>
          </div>
        </div>
      </React.Fragment>
    );
  }

  const isMyQuestion = (q) =>
    (participant.id && q.user_id === participant.id) ||
    (participant.nama && (q.penanya || "").toLowerCase() === participant.nama.toLowerCase());

  const myQuestions = questions.filter(isMyQuestion);
  const displayedQuestions = qFilter === "mine" ? myQuestions : questions;

  return (
    <React.Fragment>
      <Head title={`Live Rapat: ${meeting.judul} | SMK Hassina`} />
      <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: "#f8fafc" }}>
        {/* Sticky Live Topbar */}
        <header className="bg-white border-bottom sticky-top shadow-xs">
          <div className="container-xl py-2.5 px-3 px-md-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <img
                src={LogoHassina}
                alt="SMK Hassina"
                style={{ width: "32px", height: "32px", objectFit: "contain" }}
              />
              <div>
                <div className="d-flex align-items-center gap-1.5">
                  <span className="fw-bold text-dark fs-13px">Sesi Rapat Interaktif</span>
                  {meeting.is_live_active ? (
                    <span className="badge bg-success text-white fs-10px px-2 py-0.5 rounded-pill">
                      ● LIVE
                    </span>
                  ) : (
                    <span className="badge bg-secondary text-white fs-10px px-2 py-0.5 rounded-pill">
                      SESI DITUTUP
                    </span>
                  )}
                </div>
                <div className="text-muted fs-11px">
                  Sinkron otomatis tiap 3 detik
                  {lastSync ? ` · ${lastSync.toLocaleTimeString("id-ID")}` : ""}
                </div>
              </div>
            </div>

            {/* Participant Identity Pill */}
            <div className="d-flex align-items-center gap-2 bg-light border rounded-pill px-3 py-1">
              <Icon name="user-check" className="text-primary fs-14px" />
              <div className="lh-sm">
                <strong className="text-dark fs-12px d-block">{participant.nama}</strong>
                <span className="text-muted fs-10px d-block">{participant.unit}</span>
              </div>
              <button
                type="button"
                onClick={handleEditIdentity}
                className="btn btn-xs btn-icon text-muted border-0 p-0 ms-1"
                title="Ubah nama atau jabatan"
              >
                <Icon name="edit" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-grow-1 container-xl py-3 py-md-4 px-3 px-md-4">
          {/* Compact Meeting Banner */}
          <Card className="border bg-white rounded-4 shadow-xs mb-3">
            <CardBody className="p-3 p-md-4">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                    <span className="badge badge-dim bg-primary fs-11px">{meeting.jenis}</span>
                    <span className="text-muted fs-12px">
                      <Icon name="calendar" className="me-1" />
                      {fDate(meeting.tanggal)} · {meeting.waktu || "-"} · {meeting.tempat || "-"}
                    </span>
                  </div>
                  <h4 className="fw-bold text-dark mb-1" style={{ fontSize: "18px" }}>
                    {meeting.judul}
                  </h4>
                  <div className="text-muted fs-12px">
                    Pemimpin: <strong className="text-dark">{meeting.pemimpin || "-"}</strong> · Notulis:{" "}
                    <strong className="text-dark">{meeting.notulis || "-"}</strong>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {!meeting.is_live_active && (
            <Alert color="warning" className="rounded-3 border-0 shadow-xs fs-12px mb-3 d-flex align-items-center">
              <Icon name="info" className="fs-4 me-2 flex-shrink-0" />
              <div>
                <strong>Sesi tanya-jawab langsung telah ditutup oleh pimpinan/notulen rapat.</strong> Anda tetap dapat membaca catatan notulensi dan memantau status tindak lanjut (RTL) pertanyaan di halaman ini.
              </div>
            </Alert>
          )}

          {/* Mobile/Tablet Tabs & Desktop Split View */}
          <Nav tabs className="mb-3 bg-white px-3 pt-2 rounded-top-3 border-top border-start border-end">
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === "tanya" })}
                onClick={() => setActiveTab("tanya")}
                style={{ cursor: "pointer" }}
              >
                <Icon name="chat-fill" className="me-1 text-primary" />
                <span>Tanya Jawab &amp; Pantau RTL ({questions.length})</span>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === "notulensi" })}
                onClick={() => setActiveTab("notulensi")}
                style={{ cursor: "pointer" }}
              >
                <Icon name="file-docs" className="me-1 text-info" />
                <span>Catatan Notulen Realtime</span>
              </NavLink>
            </NavItem>
          </Nav>

          <TabContent activeTab={activeTab}>
            {/* TAB 1: TANYA JAWAB & PANTAU PERTANYAAN */}
            <TabPane tabId="tanya">
              <Row className="g-3">
                {/* Left Column: Form Ajukan Pertanyaan */}
                <Col lg="5">
                  <Card className="border bg-white rounded-4 shadow-xs sticky-lg-top" style={{ top: "76px" }}>
                    <CardBody className="p-3 p-md-4">
                      <h6 className="fw-bold text-dark fs-15px mb-1 d-flex align-items-center">
                        <Icon name="send" className="text-primary me-1.5" />
                        Ajukan Pertanyaan / Aspirasi
                      </h6>
                      <p className="text-muted fs-12px mb-3">
                        Pertanyaan Anda langsung muncul di layar Notulen &amp; Pimpinan Rapat.
                      </p>

                      {submitAlert && (
                        <Alert
                          color={submitAlert.type}
                          className="py-2 px-3 fs-12px mb-3 border-0 rounded-3"
                          toggle={() => setSubmitAlert(null)}
                        >
                          {submitAlert.text}
                        </Alert>
                      )}

                      <Form onSubmit={handleSendQuestion}>
                        <FormGroup className="mb-2.5">
                          <Label className="form-label fs-12px fw-semibold text-dark mb-1">
                            Identitas Penanya
                          </Label>
                          <div className="p-2 rounded-3 bg-light border fs-12px text-dark d-flex justify-content-between align-items-center">
                            <span>
                              <strong>{participant.nama}</strong> · {participant.unit}
                            </span>
                            <button
                              type="button"
                              onClick={handleEditIdentity}
                              className="btn btn-link btn-xs p-0 text-primary text-decoration-none"
                            >
                              Ubah
                            </button>
                          </div>
                        </FormGroup>

                        <FormGroup className="mb-2.5">
                          <Label className="form-label fs-12px fw-semibold text-dark mb-1" htmlFor="live-kat">
                            Kategori Topik
                          </Label>
                          <Input
                            id="live-kat"
                            type="select"
                            disabled={!meeting.is_live_active || submitting}
                            value={qKategori}
                            onChange={(e) => setQKategori(e.target.value)}
                            className="rounded-3 fs-13px"
                          >
                            {KATEGORI_LIST.map((k) => (
                              <option key={k} value={k}>
                                {k}
                              </option>
                            ))}
                          </Input>
                        </FormGroup>

                        <FormGroup className="mb-3">
                          <Label className="form-label fs-12px fw-semibold text-dark mb-1" htmlFor="live-teks">
                            Pertanyaan / Usulan <span className="text-danger">*</span>
                          </Label>
                          <Input
                            id="live-teks"
                            type="textarea"
                            rows="4"
                            disabled={!meeting.is_live_active || submitting}
                            placeholder={
                              meeting.is_live_active
                                ? "Tuliskan pertanyaan, kendala, atau usulan Anda secara jelas..."
                                : "Sesi tanya-jawab sedang ditutup."
                            }
                            value={qTeks}
                            onChange={(e) => setQTeks(e.target.value)}
                            className="rounded-3 fs-13px"
                          />
                        </FormGroup>

                        <Button
                          type="submit"
                          color="primary"
                          disabled={!meeting.is_live_active || submitting}
                          className="w-100 py-2 rounded-3 fw-semibold fs-13px d-flex align-items-center justify-content-center"
                        >
                          {submitting ? (
                            <>
                              <Spinner size="sm" color="light" className="me-2" />
                              <span>Mengirim...</span>
                            </>
                          ) : (
                            <>
                              <Icon name="send" className="me-1.5" />
                              <span>Kirim Pertanyaan</span>
                            </>
                          )}
                        </Button>
                      </Form>
                    </CardBody>
                  </Card>
                </Col>

                {/* Right Column: Live Feed Pertanyaan & Status RTL */}
                <Col lg="7">
                  <Card className="border bg-white rounded-4 shadow-xs">
                    <CardBody className="p-3 p-md-4">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                        <h6 className="fw-bold text-dark fs-15px mb-0">
                          Daftar Pertanyaan Masuk &amp; Status Tindak Lanjut
                        </h6>
                        <div className="btn-group btn-group-sm">
                          <Button
                            color={qFilter === "all" ? "primary" : "light"}
                            onClick={() => setQFilter("all")}
                          >
                            Semua ({questions.length})
                          </Button>
                          <Button
                            color={qFilter === "mine" ? "primary" : "light"}
                            onClick={() => setQFilter("mine")}
                          >
                            Pertanyaan Saya ({myQuestions.length})
                          </Button>
                        </div>
                      </div>

                      {displayedQuestions.length === 0 ? (
                        <div className="text-center py-5 bg-light rounded-3 border">
                          <Icon name="chat" className="text-muted fs-1 mb-2" />
                          <h6 className="fw-bold text-dark fs-14px">Belum Ada Pertanyaan</h6>
                          <p className="text-muted fs-12px mb-0">
                            {qFilter === "mine"
                              ? "Anda belum mengajukan pertanyaan pada sesi rapat ini."
                              : "Jadilah yang pertama menyampaikan pertanyaan atau aspirasi pada rapat ini."}
                          </p>
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-2.5">
                          {displayedQuestions.map((q) => {
                            const statusObj = STATUS_LIST.find((s) => s.id === q.status) || STATUS_LIST[0];
                            const mine = isMyQuestion(q);
                            const hasDocs = Array.isArray(q.lampiran) && q.lampiran.length > 0;
                            return (
                              <div
                                key={q.id}
                                className={`p-3 rounded-3 border transition-all ${
                                  mine ? "border-primary bg-primary-dim bg-opacity-10" : "bg-white"
                                }`}
                              >
                                <div className="d-flex justify-content-between align-items-start gap-2 mb-1.5 flex-wrap">
                                  <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                    {mine && (
                                      <span className="badge bg-primary text-white fs-10px">
                                        Pertanyaan Saya
                                      </span>
                                    )}
                                    <span className={`badge bg-${statusObj.color} fs-10px`}>
                                      {statusObj.label}
                                    </span>
                                    <span className="badge bg-light text-dark border fs-10px">
                                      {q.kategori}
                                    </span>
                                    {q.dibacakan && (
                                      <span className="badge bg-info-dim text-info fs-10px">
                                        <Icon name="check" className="me-0.5" /> Sudah Dibahas Forum
                                      </span>
                                    )}
                                  </div>
                                  <Button
                                    size="xs"
                                    color="light"
                                    className="border fs-11px"
                                    onClick={() => setSelectedQ(q)}
                                  >
                                    Detail RTL
                                  </Button>
                                </div>

                                <p className="fw-semibold text-dark fs-13.5px mb-1.5" style={{ lineHeight: "1.45" }}>
                                  {q.teks}
                                </p>

                                <div className="text-muted fs-11px mb-2">
                                  Oleh: <strong className="text-dark">{q.penanya}</strong>
                                  {q.unit ? ` (${q.unit})` : ""}
                                  {q.pic ? (
                                    <>
                                      {" "}
                                      · PIC: <strong className="text-dark">{q.pic}</strong>
                                    </>
                                  ) : null}
                                </div>

                                {(q.rencana || (q.output && q.output !== "Belum ditentukan") || hasDocs) && (
                                  <div className="p-2 rounded-2 bg-light border fs-12px mt-1">
                                    {q.rencana && (
                                      <div>
                                        <strong className="text-dark">Tanggapan / RTL:</strong> {q.rencana}
                                      </div>
                                    )}
                                    <div className="d-flex align-items-center gap-2 flex-wrap mt-1">
                                      {q.output && q.output !== "Belum ditentukan" && (
                                        <span className="badge bg-white text-dark border fs-10px">
                                          Output: {q.output}
                                        </span>
                                      )}
                                      {q.progres > 0 && (
                                        <span className="badge bg-success-dim text-success fs-10px">
                                          Progres: {q.progres}%
                                        </span>
                                      )}
                                      {hasDocs && (
                                        <span className="badge bg-primary-dim text-primary fs-10px">
                                          <Icon name="clip" className="me-0.5" /> {q.lampiran.length} Dokumen
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </TabPane>

            {/* TAB 2: CATATAN NOTULEN REALTIME */}
            <TabPane tabId="notulensi">
              <Card className="border bg-white rounded-4 shadow-xs">
                <CardBody className="p-3 p-md-4">
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <div>
                      <h6 className="fw-bold text-dark fs-15px mb-0">
                        Catatan Notulensi Rapat (Live View)
                      </h6>
                      <span className="text-muted fs-12px">
                        Catatan yang diketik oleh Notulen ({meeting.notulis || "Notulis"}) otomatis diperbarui di layar Anda.
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <Label className="fw-bold text-dark fs-13px mb-1">1. Agenda Rapat</Label>
                    <div
                      className="p-3 rounded-3 bg-light border fs-13px text-dark"
                      style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}
                    >
                      {meeting.agenda || <em className="text-muted">Agenda belum ditulis...</em>}
                    </div>
                  </div>

                  <div className="mb-3">
                    <Label className="fw-bold text-dark fs-13px mb-1">
                      2. Jalannya Diskusi &amp; Pemaparan Materi
                    </Label>
                    <div
                      className="p-3 rounded-3 bg-light border fs-13px text-dark"
                      style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", minHeight: "140px" }}
                    >
                      {meeting.catatan || <em className="text-muted">Notulen sedang mencatat jalannya diskusi...</em>}
                    </div>
                  </div>

                  <div>
                    <Label className="fw-bold text-dark fs-13px mb-1">
                      3. Kesepakatan &amp; Keputusan Resmi
                    </Label>
                    <div
                      className="p-3 rounded-3 bg-success-dim border fs-13px text-dark"
                      style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}
                    >
                      {meeting.keputusan || <em className="text-muted">Keputusan rapat belum dirumuskan...</em>}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </TabPane>
          </TabContent>
        </main>

        {/* Modal Detail RTL */}
        <Modal isOpen={Boolean(selectedQ)} toggle={() => setSelectedQ(null)} size="lg">
          {selectedQ && (
            <>
              <ModalHeader toggle={() => setSelectedQ(null)}>
                Detail Pertanyaan &amp; Pantauan Tindak Lanjut
              </ModalHeader>
              <ModalBody>
                <div className="p-3 rounded-3 bg-light border mb-3">
                  <div className="text-muted fs-12px mb-1">
                    Oleh: <strong className="text-dark">{selectedQ.penanya}</strong> ({selectedQ.unit}) · Kategori:{" "}
                    <strong>{selectedQ.kategori}</strong>
                  </div>
                  <h6 className="fw-bold text-dark fs-15px mb-0">{selectedQ.teks}</h6>
                </div>

                <Row className="g-2 mb-3">
                  <Col sm="6">
                    <div className="p-2.5 rounded-3 border">
                      <span className="text-muted fs-11px d-block">Status RTL</span>
                      <strong className="text-primary fs-13px text-uppercase">{selectedQ.status}</strong>
                    </div>
                  </Col>
                  <Col sm="6">
                    <div className="p-2.5 rounded-3 border">
                      <span className="text-muted fs-11px d-block">Wujud Output</span>
                      <strong className="text-dark fs-13px">{selectedQ.output || "Belum ditentukan"}</strong>
                    </div>
                  </Col>
                  <Col sm="6">
                    <div className="p-2.5 rounded-3 border">
                      <span className="text-muted fs-11px d-block">Penanggung Jawab (PIC)</span>
                      <strong className="text-dark fs-13px">{selectedQ.pic || "Belum ditugaskan"}</strong>
                    </div>
                  </Col>
                  <Col sm="6">
                    <div className="p-2.5 rounded-3 border">
                      <span className="text-muted fs-11px d-block">Tenggat &amp; Progres</span>
                      <strong className="text-dark fs-13px">
                        {selectedQ.tenggat ? fDate(selectedQ.tenggat, true) : "Belum ditentukan"} ({selectedQ.progres || 0}%)
                      </strong>
                    </div>
                  </Col>
                </Row>

                <div className="mb-3">
                  <h6 className="fw-bold text-dark fs-13px mb-1">Keputusan / Rencana Tindak Lanjut:</h6>
                  <div className="p-2.5 rounded-3 bg-light border fs-13px">
                    {selectedQ.rencana || <em className="text-muted">Belum ada rencana tindak lanjut tertulis.</em>}
                  </div>
                </div>

                {selectedQ.lampiran && selectedQ.lampiran.length > 0 && (
                  <div className="mb-3">
                    <h6 className="fw-bold text-dark fs-13px mb-2">
                      Dokumen Bukti / Keputusan ({selectedQ.lampiran.length}):
                    </h6>
                    <Row className="g-2">
                      {selectedQ.lampiran.map((doc, idx) => (
                        <Col sm="6" key={doc.id || idx}>
                          <div className="p-2 rounded-3 border d-flex justify-content-between align-items-center">
                            <span className="fs-12px text-truncate me-2">{doc.name}</span>
                            <Button size="xs" color="primary" outline onClick={() => setPreviewItem(doc)}>
                              Buka
                            </Button>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="secondary" size="sm" onClick={() => setSelectedQ(null)}>
                  Tutup
                </Button>
              </ModalFooter>
            </>
          )}
        </Modal>

        {/* Modal Pratinjau Lampiran */}
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
            </>
          )}
        </Modal>
      </div>
    </React.Fragment>
  );
};

export default LiveSessionRapat;

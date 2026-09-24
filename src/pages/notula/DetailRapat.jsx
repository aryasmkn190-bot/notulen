import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
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
  Progress,
  Spinner,
} from "reactstrap";
import classnames from "classnames";
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
  sisaHari,
  KATEGORI_LIST,
  PRIORITAS_LIST,
  OUTPUT_LIST,
  STATUS_LIST,
  JENIS_LIST,
} from "@/notula-context/NotulaContext";
import { useAuth } from "@/notula-context/AuthContext";

const DetailRapat = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, authFetch, isSuperAdmin, isModerator, isGuru } = useAuth();

  const {
    meetings,
    questions,
    updateMeeting,
    finalizeMeeting,
    deleteMeeting,
    addQuestion,
    updateQuestion,
    deleteQuestion,
  } = useNotula();

  const meeting = meetings.find((m) => m.id === id);
  const isFinalized = Boolean(meeting?.is_finalized);
  const canEditNotes = isSuperAdmin || (isModerator && !isFinalized);

  // Tab State
  const currentTab = searchParams.get("tab") || "notulensi";
  const setTab = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  // State for Dokumentasi Upload & Preview
  const [uploading, setUploading] = useState(false);
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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 10MB
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

    setUploading(true);

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
            throw new Error(resData.error || "Gagal mengunggah berkas.");
          }

          // Add to meeting dokumentasi
          const updatedDocs = [...(meeting.dokumentasi || []), resData];
          await updateMeeting(id, { dokumentasi: updatedDocs });
        } catch (err) {
          alert(err.message || "Gagal mengunggah berkas.");
        } finally {
          setUploading(false);
          e.target.value = "";
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploading(false);
      alert("Gagal membaca berkas: " + err.message);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!canEditNotes) return;
    if (window.confirm("Hapus lampiran berkas ini dari dokumentasi notula?")) {
      const updatedDocs = (meeting.dokumentasi || []).filter((d) => d.id !== docId);
      await updateMeeting(id, { dokumentasi: updatedDocs });
    }
  };

  // Local state for meeting notes (auto-save)
  const [notes, setNotes] = useState({
    agenda: "",
    catatan: "",
    keputusan: "",
  });
  const [saveStatus, setSaveStatus] = useState("Tersimpan otomatis");

  useEffect(() => {
    if (meeting) {
      setNotes({
        agenda: meeting.agenda || "",
        catatan: meeting.catatan || "",
        keputusan: meeting.keputusan || "",
      });
    }
  }, [meeting]);

  const handleNoteChange = (field, val) => {
    setNotes((prev) => ({ ...prev, [field]: val }));
    setSaveStatus("Menyimpan perubahan...");
    updateMeeting(id, { [field]: val });
    setTimeout(() => {
      setSaveStatus("Tersimpan di perangkat");
    }, 400);
  };

  // Modal Edit Rapat Info
  const [modalEditMeeting, setModalEditMeeting] = useState(false);
  const [editMeetingForm, setEditMeetingForm] = useState({});

  const openEditMeeting = () => {
    setEditMeetingForm({
      judul: meeting.judul || "",
      jenis: meeting.jenis || "Rapat Dinas",
      tanggal: meeting.tanggal || "",
      waktu: meeting.waktu || "",
      tempat: meeting.tempat || "",
      pemimpin: meeting.pemimpin || "",
      notulis: meeting.notulis || "",
      peserta: meeting.peserta || "",
    });
    setModalEditMeeting(true);
  };

  const handleSaveMeetingInfo = (e) => {
    e.preventDefault();
    updateMeeting(id, editMeetingForm);
    setModalEditMeeting(false);
  };

  // Validasi & Finalisasi oleh Super Admin
  const handleToggleFinalize = async () => {
    if (!isSuperAdmin) return;
    const nextVal = !isFinalized;
    const confirmMsg = nextVal
      ? `Validasi & Finalisasi notula rapat "${meeting.judul}"?\n\nSetelah difinalisasi, catatan notulensi rapat akan dikunci dan tidak dapat diubah lagi oleh notulen (pertanyaan peserta tetap dapat dikelola).`
      : `Buka kunci finalisasi notula rapat "${meeting.judul}"?\n\nNotulen akan dapat kembali menyunting catatan notulensi rapat.`;
    if (window.confirm(confirmMsg)) {
      try {
        await finalizeMeeting(id, nextVal);
      } catch (err) {
        alert(err.message || "Gagal mengubah status finalisasi rapat.");
      }
    }
  };

  // Modal Tambah Pertanyaan (bisa dibuka di mobile via tombol header)
  const [modalAddQ, setModalAddQ] = useState(false);
  const [newQForm, setNewQForm] = useState({
    penanya: "",
    unit: "",
    teks: "",
    kategori: "Kurikulum",
    prioritas: "Sedang",
  });

  const handleAddQ = (e) => {
    e.preventDefault();
    if (!newQForm.teks.trim()) return;
    addQuestion({
      mid: id,
      penanya: isGuru ? user?.nama : (newQForm.penanya || user?.nama || "Anonim"),
      unit: isGuru ? user?.unit : (newQForm.unit || user?.unit || ""),
      user_id: isGuru ? user?.id : null,
      teks: newQForm.teks,
      kategori: newQForm.kategori,
      prioritas: newQForm.prioritas,
    });
    setNewQForm({
      penanya: "",
      unit: "",
      teks: "",
      kategori: "Kurikulum",
      prioritas: "Sedang",
    });
    setModalAddQ(false);
  };

  // Modal Detail / Edit RTL Pertanyaan
  const [activeQ, setActiveQ] = useState(null);
  const [logInput, setLogInput] = useState("");

  const handleSaveActiveQ = (e) => {
    e.preventDefault();
    if (!activeQ) return;
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

  const [editingLogId, setEditingLogId] = useState(null);
  const [editingLogText, setEditingLogText] = useState("");

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

  // Reader Mode (Mode Bacakan)
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerIdx, setReaderIdx] = useState(0);

  useEffect(() => {
    if (searchParams.get("reader") === "true") {
      setReaderOpen(true);
    }
  }, [searchParams]);

  if (!meeting) {
    return (
      <React.Fragment>
        <Head title="Rapat Tidak Ditemukan" />
        <Content>
          <div className="alert alert-warning py-4 text-center">
            <h5>Rapat tidak ditemukan atau telah dihapus.</h5>
            <Link to="/rapat" className="btn btn-primary mt-2">
              ← Kembali ke Daftar Rapat
            </Link>
          </div>
        </Content>
      </React.Fragment>
    );
  }

  const meetingQuestions = questions.filter((q) => q.mid === id);
  const rtlQuestions = meetingQuestions.filter((q) => q.status !== "baru");

  const openReader = () => {
    if (meetingQuestions.length === 0) {
      alert("Belum ada pertanyaan pada rapat ini untuk dibacakan.");
      return;
    }
    setReaderIdx(0);
    setReaderOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <React.Fragment>
      <Head title={`${meeting.judul} - Notula SMK Hassina`} />
      <Content>
        {/* Header Rapat */}
        <BlockHead size="sm" className="notula-page-header mb-4 mb-md-5">
          <div className="mb-2.5">
            <Link to="/rapat" className="notula-back-btn">
              <span className="back-icon-circle">
                <Icon name="arrow-left" />
              </span>
              <span className="back-text">Kembali ke Daftar Rapat</span>
            </Link>
          </div>
          <BlockBetween size="md" className="g-3 align-items-start">
            <BlockHeadContent style={{ maxWidth: "700px" }}>
              <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                <span className="badge badge-dim bg-primary">{meeting.jenis}</span>
                {isFinalized ? (
                  <Badge color="info" className="badge-dim fw-bold" title={`Difinalisasi oleh ${meeting.finalized_by || "Super Admin"}`}>
                    <Icon name="shield-check" className="me-1" />
                    Terfinalisasi (Super Admin)
                  </Badge>
                ) : (
                  <Badge color="secondary" className="badge-dim">
                    Belum Difinalisasi
                  </Badge>
                )}
                {meeting.status === "selesai" ? (
                  <Badge color="success" className="badge-dim">
                    Notula Selesai
                  </Badge>
                ) : (
                  <Badge color="warning" className="badge-dim">
                    Draf Notula
                  </Badge>
                )}
              </div>
              <BlockTitle page tag="h3" className="mb-1 text-dark">
                {meeting.judul}
              </BlockTitle>
              <BlockDes className="text-soft fs-12px">
                <p>
                  <Icon name="calendar" className="me-1" />
                  {fDate(meeting.tanggal)} · {meeting.waktu || "-"} ·{" "}
                  <Icon name="map-pin" className="ms-1 me-1" />
                  {meeting.tempat || "-"}
                </p>
              </BlockDes>
            </BlockHeadContent>

            <BlockHeadContent className="mt-3 mt-md-0">
              <div className="d-flex flex-wrap gap-2">
                {canEditNotes ? (
                  <Button
                    color="light"
                    outline
                    size="sm"
                    onClick={openEditMeeting}
                    className="bg-white"
                  >
                    <Icon name="edit" className="me-1" />
                    <span>Edit Info</span>
                  </Button>
                ) : isModerator && isFinalized ? (
                  <Button
                    color="light"
                    outline
                    size="sm"
                    disabled
                    className="bg-white text-muted"
                    title="Rapat telah difinalisasi oleh Super Admin (Terkunci)"
                  >
                    <Icon name="lock" className="me-1" />
                    <span>Info Terkunci</span>
                  </Button>
                ) : null}
                <Button
                  color="light"
                  outline
                  size="sm"
                  onClick={handlePrint}
                  className="bg-white"
                >
                  <Icon name="printer" className="me-1" />
                  <span>Cetak</span>
                </Button>
                <Button color="primary" size="sm" onClick={openReader}>
                  <Icon name="mic" className="me-1" />
                  <span>Bacakan Pertanyaan</span>
                </Button>
              </div>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        {/* Info Meta Card */}
        <Block>
          <Card className="card-bordered mb-4 bg-white">
            <CardBody className="card-inner p-3 p-md-4">
              <Row className="g-3">
                <Col md="4" sm="6">
                  <div className="d-flex align-items-center">
                    <div className="user-avatar bg-primary-dim text-primary me-3 flex-shrink-0">
                      <Icon name="user-check" />
                    </div>
                    <div>
                      <span className="text-muted fs-11px text-uppercase fw-bold d-block">Pemimpin Rapat</span>
                      <strong className="text-dark fs-13px d-block">
                        {meeting.pemimpin || "-"}
                      </strong>
                    </div>
                  </div>
                </Col>
                <Col md="4" sm="6">
                  <div className="d-flex align-items-center">
                    <div className="user-avatar bg-info-dim text-info me-3 flex-shrink-0">
                      <Icon name="edit-alt" />
                    </div>
                    <div>
                      <span className="text-muted fs-11px text-uppercase fw-bold d-block">Notulis</span>
                      <strong className="text-dark fs-13px d-block">
                        {meeting.notulis || "-"}
                      </strong>
                    </div>
                  </div>
                </Col>
                <Col md="4" sm="12">
                  <div className="d-flex align-items-center">
                    <div className="user-avatar bg-success-dim text-success me-3 flex-shrink-0">
                      <Icon name="users" />
                    </div>
                    <div>
                      <span className="text-muted fs-11px text-uppercase fw-bold d-block">Peserta Rapat</span>
                      <strong className="text-dark fs-13px d-block">
                        {meeting.peserta || "-"}
                      </strong>
                    </div>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>

          {/* Navigation Tabs */}
          <Nav tabs className="mb-3">
            <NavItem>
              <NavLink
                className={classnames({ active: currentTab === "notulensi" })}
                onClick={() => setTab("notulensi")}
                style={{ cursor: "pointer" }}
              >
                <Icon name="file-docs" className="me-1" />
                <span>Catatan Notulensi</span>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: currentTab === "pertanyaan" })}
                onClick={() => setTab("pertanyaan")}
                style={{ cursor: "pointer" }}
              >
                <Icon name="help" className="me-1" />
                <span>Pertanyaan ({meetingQuestions.length})</span>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: currentTab === "rtl" })}
                onClick={() => setTab("rtl")}
                style={{ cursor: "pointer" }}
              >
                <Icon name="task" className="me-1" />
                <span>Tindak Lanjut ({rtlQuestions.length})</span>
              </NavLink>
            </NavItem>
          </Nav>

          <TabContent activeTab={currentTab}>
            {/* TAB 1: NOTULENSI */}
            <TabPane tabId="notulensi">
              <Card className="card-bordered">
                <CardBody className="card-inner p-3 p-md-4">
                  {/* Banner Status Finalisasi */}
                  {isFinalized ? (
                    <div className="alert alert-primary d-flex align-items-center mb-3 py-2.5 px-3 border rounded-3">
                      <Icon name="shield-check" className="fs-2 me-2 text-primary flex-shrink-0" />
                      <div className="flex-grow-1">
                        <div className="fw-bold text-dark fs-13px">Catatan Notulensi Rapat Telah Divalidasi &amp; Difinalisasi</div>
                        <div className="fs-12px text-soft">
                          Divalidasi oleh <strong>{meeting.finalized_by || "Super Admin / Kepala Sekolah"}</strong>
                          {meeting.finalized_at && ` pada ${new Date(Number(meeting.finalized_at)).toLocaleString("id-ID")}`}.
                          {isModerator && " Sesuai peran notulen, catatan notulensi terkunci (pertanyaan peserta tetap dapat dikelola pada tab Pertanyaan)."}
                          {isGuru && " Dokumen ini telah berstatus resmi untuk acuan dewan guru."}
                        </div>
                      </div>
                      {isSuperAdmin && (
                        <Button
                          size="xs"
                          color="outline-danger"
                          className="ms-2 flex-shrink-0 bg-white"
                          onClick={handleToggleFinalize}
                        >
                          <Icon name="unlock" className="me-1" />
                          Buka Kunci
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                      <h6 className="title mb-0 fs-16px">Catatan Notulensi</h6>
                      <span className="text-soft fs-12px">
                        <Icon name="check-circle" className="text-success me-1" />
                        {canEditNotes ? saveStatus : "Hanya dapat dibaca (Read-only)"}
                      </span>
                    </div>
                  )}

                  <FormGroup className="mb-3">
                    <Label className="form-label fw-bold text-dark fs-13px" htmlFor="agenda">
                      1. Agenda Rapat
                    </Label>
                    <Input
                      type="textarea"
                      id="agenda"
                      rows="3"
                      disabled={!canEditNotes}
                      readOnly={!canEditNotes}
                      placeholder={canEditNotes ? "Tuliskan poin-poin agenda pembahasan rapat..." : "Tidak ada agenda tercatat"}
                      value={notes.agenda}
                      onChange={(e) => handleNoteChange("agenda", e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup className="mb-3">
                    <Label className="form-label fw-bold text-dark fs-13px" htmlFor="catatan">
                      2. Jalannya Diskusi &amp; Pemaparan Materi
                    </Label>
                    <Input
                      type="textarea"
                      id="catatan"
                      rows="7"
                      disabled={!canEditNotes}
                      readOnly={!canEditNotes}
                      placeholder={canEditNotes ? "Catat seluruh jalannya diskusi, dinamika forum, dan arahan pimpinan..." : "Belum ada catatan diskusi"}
                      value={notes.catatan}
                      onChange={(e) => handleNoteChange("catatan", e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup className="mb-4">
                    <Label className="form-label fw-bold text-dark fs-13px" htmlFor="keputusan">
                      3. Kesepakatan &amp; Keputusan Resmi
                    </Label>
                    <Input
                      type="textarea"
                      id="keputusan"
                      rows="4"
                      disabled={!canEditNotes}
                      readOnly={!canEditNotes}
                      placeholder={canEditNotes ? "Tuliskan keputusan resmi yang disepakati bersama..." : "Belum ada keputusan dicatat"}
                      value={notes.keputusan}
                      onChange={(e) => handleNoteChange("keputusan", e.target.value)}
                    />
                  </FormGroup>

                  {/* 4. DOKUMENTASI RAPAT (FOTO & DOKUMEN PDF) */}
                  <div className="mb-4 pt-2 border-top">
                    <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                      <div>
                        <Label className="form-label fw-bold text-dark fs-13px mb-0">
                          4. Dokumentasi Rapat (Foto Kegiatan &amp; Dokumen PDF)
                        </Label>
                        <span className="text-soft fs-12px d-block">
                          Unggah foto dokumentasi kegiatan atau lampiran berkas resmi (Maks. 10 MB per berkas).
                        </span>
                      </div>

                      {canEditNotes && (
                        <div>
                          <label
                            className={`btn btn-sm btn-outline-primary mb-0 ${uploading ? "disabled" : ""}`}
                            style={{ cursor: "pointer" }}
                          >
                            {uploading ? (
                              <>
                                <Spinner size="sm" color="primary" className="me-1" />
                                <span>Mengunggah...</span>
                              </>
                            ) : (
                              <>
                                <Icon name="upload-cloud" className="me-1" />
                                <span>+ Unggah Berkas</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,application/pdf"
                              className="d-none"
                              disabled={uploading}
                              onChange={handleFileUpload}
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Document & Photo Cards Grid */}
                    {meeting.dokumentasi && meeting.dokumentasi.length > 0 ? (
                      <Row className="g-3 mt-1">
                        {meeting.dokumentasi.map((doc, idx) => {
                          const isPdf =
                            doc.type === "application/pdf" ||
                            doc.name?.toLowerCase().endsWith(".pdf");
                          const fileSizeText = doc.size
                            ? doc.size > 1024 * 1024
                              ? `${(doc.size / (1024 * 1024)).toFixed(1)} MB`
                              : `${Math.round(doc.size / 1024)} KB`
                            : "";

                          return (
                            <Col md="4" sm="6" key={doc.id || idx}>
                              <div className="card card-bordered h-100 bg-lighter rounded-3 overflow-hidden shadow-xs border">
                                {/* Thumbnail / Header Preview Area */}
                                {isPdf ? (
                                  <div
                                    className="d-flex flex-column align-items-center justify-content-center p-3 bg-light border-bottom text-center"
                                    style={{ height: "120px", cursor: "pointer" }}
                                    onClick={() => setPreviewItem(doc)}
                                    title="Klik untuk pratinjau dokumen PDF"
                                  >
                                    <Icon name="file-pdf" className="text-danger fs-1 mb-1" />
                                    <span className="badge bg-danger fs-10px px-2 py-0.5">DOKUMEN PDF</span>
                                  </div>
                                ) : (
                                  <div
                                    className="position-relative bg-dark d-flex align-items-center justify-content-center overflow-hidden"
                                    style={{ height: "120px", cursor: "pointer" }}
                                    onClick={() => setPreviewItem(doc)}
                                    title="Klik untuk pratinjau foto resolusi penuh"
                                  >
                                    <img
                                      src={doc.url}
                                      alt={doc.name}
                                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                    <div className="position-absolute bottom-0 start-0 end-0 p-1 bg-dark bg-opacity-75 text-white fs-10px text-center">
                                      <Icon name="eye" className="me-1" />
                                      <span>Pratinjau Foto</span>
                                    </div>
                                  </div>
                                )}

                                {/* Card Footer Info & Actions */}
                                <div className="p-2.5 d-flex flex-column justify-content-between flex-grow-1">
                                  <div>
                                    <strong
                                      className="text-dark fs-12px text-truncate d-block mb-0.5"
                                      title={doc.name}
                                    >
                                      {doc.name}
                                    </strong>
                                    <div className="d-flex align-items-center justify-content-between fs-11px text-muted">
                                      <span>{fileSizeText}</span>
                                      <span>
                                        {doc.uploadedAt
                                          ? fDate(new Date(doc.uploadedAt).toISOString().slice(0, 10), true)
                                          : "-"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
                                    <Button
                                      size="xs"
                                      color="primary"
                                      outline
                                      onClick={() => setPreviewItem(doc)}
                                    >
                                      <Icon name="eye" className="me-1" />
                                      <span>Pratinjau</span>
                                    </Button>

                                    {canEditNotes && (
                                      <Button
                                        size="xs"
                                        color="danger"
                                        outline
                                        onClick={() => handleDeleteDoc(doc.id)}
                                        title="Hapus berkas ini"
                                      >
                                        <Icon name="trash" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    ) : (
                      <div className="alert alert-light text-center py-4 border rounded-3 mt-2">
                        <Icon name="file-docs" className="text-muted fs-2 mb-1" />
                        <p className="text-soft fs-12px mb-0">
                          Belum ada berkas dokumentasi atau lampiran foto/PDF yang diunggah.
                        </p>
                        {canEditNotes && (
                          <span className="text-muted fs-11px">
                            Gunakan tombol <strong>+ Unggah Berkas</strong> di atas untuk melampirkan foto atau dokumen.
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="d-flex justify-content-between align-items-center pt-3 border-top flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {/* Status Draf / Selesai (Hanya jika belum difinalisasi dan bukan Guru) */}
                      {canEditNotes && (
                        <Button
                          color={meeting.status === "selesai" ? "warning" : "success"}
                          outline
                          size="sm"
                          onClick={() => {
                            const newStatus =
                              meeting.status === "selesai" ? "draf" : "selesai";
                            updateMeeting(id, { status: newStatus });
                          }}
                        >
                          <Icon
                            name={meeting.status === "selesai" ? "undo" : "check-circle"}
                            className="me-1"
                          />
                          <span>
                            {meeting.status === "selesai"
                              ? "Kembalikan ke Draf"
                              : "Tandai Notula Selesai"}
                          </span>
                        </Button>
                      )}

                      {/* Skema Validasi Finalisasi Rapat (Eksklusif Super Admin) */}
                      {isSuperAdmin && (
                        <Button
                          color={isFinalized ? "outline-danger" : "primary"}
                          size="sm"
                          onClick={handleToggleFinalize}
                        >
                          <Icon name={isFinalized ? "unlock" : "shield-check"} className="me-1" />
                          <span>
                            {isFinalized ? "Buka Kunci Finalisasi" : "Validasi & Finalisasi Rapat"}
                          </span>
                        </Button>
                      )}
                    </div>

                    <Button color="primary" size="sm" onClick={handlePrint}>
                      <Icon name="printer" className="me-1" />
                      <span>Cetak Siap Tanda Tangan</span>
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </TabPane>

            {/* TAB 2: PERTANYAAN */}
            <TabPane tabId="pertanyaan">
              <Row className="g-3">
                <Col lg="7">
                  <Card className="card-bordered">
                    <div className="card-inner border-bottom py-2 px-3 d-flex justify-content-between align-items-center">
                      <h6 className="title mb-0 fs-14px">Daftar Pertanyaan Masuk</h6>
                      <Button
                        color="primary"
                        size="sm"
                        className="d-lg-none"
                        onClick={() => setModalAddQ(true)}
                      >
                        <Icon name="plus" className="me-1" />
                        <span>Catat Baru</span>
                      </Button>
                    </div>
                    <div className="card-inner p-0">
                      {meetingQuestions.length === 0 ? (
                        <div className="text-center py-5 px-3">
                          <Icon name="help" className="text-muted fs-1 mb-2" />
                          <p className="text-soft mb-2 fs-13px">
                            Belum ada pertanyaan dicatat pada rapat ini.
                          </p>
                          <Button
                            color="primary"
                            size="sm"
                            onClick={() => setModalAddQ(true)}
                          >
                            + Catat Pertanyaan Pertama
                          </Button>
                        </div>
                      ) : (
                        <div className="nk-tb-list nk-tb-ulist">
                          {meetingQuestions.map((q) => {
                            const statusObj =
                              STATUS_LIST.find((s) => s.id === q.status) ||
                              STATUS_LIST[0];
                            return (
                              <div
                                key={q.id}
                                className="nk-tb-item"
                                style={{ cursor: "pointer" }}
                                onClick={() => setActiveQ(q)}
                              >
                                <div className="nk-tb-col">
                                  <div className="d-flex align-items-center mb-1 flex-wrap gap-1">
                                    <span
                                      className={`badge badge-dim bg-${statusObj.color} fs-11px`}
                                    >
                                      {statusObj.label}
                                    </span>
                                    <span className="badge badge-dim bg-light fs-11px">
                                      {q.kategori}
                                    </span>
                                  </div>
                                  <h6 className="title fs-14px mb-1 text-dark">
                                    {q.teks}
                                  </h6>
                                  <div className="d-flex align-items-center gap-1 flex-wrap fs-11px text-muted">
                                    <span>
                                      Oleh: <strong className="text-dark">{q.penanya || "Anonim"}</strong>
                                      {q.unit ? ` (${q.unit})` : ""}
                                    </span>
                                    <span>· PIC: <strong className="text-dark">{q.pic || "-"}</strong></span>
                                    {(q.user_id === user?.id || (user?.nama && q.penanya?.toLowerCase() === user.nama.toLowerCase())) && (
                                      <span className="badge badge-dim bg-success fs-10px ms-1">
                                        Pertanyaan Saya
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="nk-tb-col tb-col-sm text-end">
                                  {q.output && q.output !== "Belum ditentukan" && (
                                    <span className="badge bg-light text-dark border d-block mb-1 fs-11px">
                                      {q.output}
                                    </span>
                                  )}
                                  <Button
                                    color="light"
                                    size="sm"
                                    className="btn-icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveQ(q);
                                    }}
                                  >
                                    <Icon name="chevron-right" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>

                {/* Form Cepat Tambah Pertanyaan (Desktop) */}
                <Col lg="5">
                  <Card className="card-bordered d-none d-lg-block">
                    <CardBody className="card-inner p-3">
                      <h6 className="title mb-3 fs-15px">
                        <Icon name="plus-circle" className="me-1 text-primary" />
                        {isGuru ? "Ajukan Pertanyaan ke Rapat Ini" : "Catat Pertanyaan Baru"}
                      </h6>
                      <Form onSubmit={handleAddQ}>
                        {isGuru ? (
                          <div className="bg-light p-2.5 rounded mb-2.5 border">
                            <span className="text-muted fs-11px d-block">Identitas Penanya (Terverifikasi Akun):</span>
                            <strong className="text-dark fs-13px">{user?.nama}</strong>
                            <span className="text-muted fs-12px d-block">{user?.unit || "Dewan Guru SMK Hassina"}</span>
                          </div>
                        ) : (
                          <>
                            <FormGroup className="mb-2">
                              <Label className="form-label fs-12px mb-1" htmlFor="penanya">
                                Nama Penanya <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                id="penanya"
                                required
                                placeholder="Contoh: Rina Marlina, S.Pd."
                                value={newQForm.penanya}
                                onChange={(e) =>
                                  setNewQForm({
                                    ...newQForm,
                                    penanya: e.target.value,
                                  })
                                }
                              />
                            </FormGroup>

                            <FormGroup className="mb-2">
                              <Label className="form-label fs-12px mb-1" htmlFor="unit">
                                Jabatan / Unit Kerja
                              </Label>
                              <Input
                                type="text"
                                id="unit"
                                placeholder="Contoh: Guru Matematika / Kaprog TJKT"
                                value={newQForm.unit}
                                onChange={(e) =>
                                  setNewQForm({ ...newQForm, unit: e.target.value })
                                }
                              />
                            </FormGroup>
                          </>
                        )}

                        <FormGroup className="mb-2">
                          <Label className="form-label fs-12px mb-1" htmlFor="teks">
                            Isi Pertanyaan / Aspirasi <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="textarea"
                            id="teks"
                            rows="3"
                            required
                            placeholder="Tuliskan aspirasi atau pertanyaan persis yang disampaikan..."
                            value={newQForm.teks}
                            onChange={(e) =>
                              setNewQForm({ ...newQForm, teks: e.target.value })
                            }
                          />
                        </FormGroup>

                        <Row className="g-2 mb-3">
                          <Col sm="6">
                            <FormGroup>
                              <Label className="form-label fs-12px mb-1" htmlFor="kategori">
                                Kategori
                              </Label>
                              <Input
                                type="select"
                                id="kategori"
                                value={newQForm.kategori}
                                onChange={(e) =>
                                  setNewQForm({
                                    ...newQForm,
                                    kategori: e.target.value,
                                  })
                                }
                              >
                                {KATEGORI_LIST.map((k) => (
                                  <option key={k} value={k}>
                                    {k}
                                  </option>
                                ))}
                              </Input>
                            </FormGroup>
                          </Col>
                          <Col sm="6">
                            <FormGroup>
                              <Label className="form-label fs-12px mb-1" htmlFor="prioritas">
                                Prioritas
                              </Label>
                              <Input
                                type="select"
                                id="prioritas"
                                value={newQForm.prioritas}
                                onChange={(e) =>
                                  setNewQForm({
                                    ...newQForm,
                                    prioritas: e.target.value,
                                  })
                                }
                              >
                                {PRIORITAS_LIST.map((p) => (
                                  <option key={p} value={p}>
                                    {p}
                                  </option>
                                ))}
                              </Input>
                            </FormGroup>
                          </Col>
                        </Row>

                        <Button color="primary" type="submit" className="w-100" size="sm">
                          <Icon name="check" className="me-1" />
                          <span>{isGuru ? "Ajukan Pertanyaan Saya" : "Tambahkan ke Notulensi"}</span>
                        </Button>
                      </Form>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </TabPane>

            {/* TAB 3: RTL */}
            <TabPane tabId="rtl">
              {rtlQuestions.length === 0 ? (
                <div className="alert alert-light text-center py-5 border">
                  <Icon name="task" className="text-muted fs-1 mb-2" />
                  <h5>Belum Ada Rencana Tindak Lanjut</h5>
                  <p className="text-soft fs-13px">
                    Buka tab <strong>Pertanyaan Peserta</strong>, pilih pertanyaan yang dibahas, lalu tentukan rencana tindak lanjut, PIC, dan tenggat waktunya.
                  </p>
                </div>
              ) : (
                <Row className="g-3">
                  {rtlQuestions.map((q) => {
                    const statusObj =
                      STATUS_LIST.find((s) => s.id === q.status) || STATUS_LIST[0];
                    const sisa = sisaHari(q.tenggat);
                    return (
                      <Col md="6" key={q.id}>
                        <Card className="card-bordered h-100">
                          <CardBody className="card-inner p-3 d-flex flex-column justify-content-between">
                            <div>
                              <div className="d-flex justify-content-between align-items-start mb-2 gap-1 flex-wrap">
                                <div>
                                  <span
                                    className={`badge badge-dim bg-${statusObj.color} me-1 fs-11px`}
                                  >
                                    {statusObj.label}
                                  </span>
                                  {q.output && q.output !== "Belum ditentukan" && (
                                    <span className="badge badge-dim bg-primary fs-11px">
                                      {q.output}
                                    </span>
                                  )}
                                </div>
                                {q.tenggat ? (
                                  sisa < 0 ? (
                                    <span className="badge bg-danger fs-11px">
                                      Lewat {Math.abs(sisa)} hari
                                    </span>
                                  ) : sisa === 0 ? (
                                    <span className="badge bg-warning text-dark fs-11px">Hari ini</span>
                                  ) : (
                                    <span className="badge bg-light text-dark border fs-11px">
                                      {fDate(q.tenggat, true)} ({sisa} hari lagi)
                                    </span>
                                  )
                                ) : (
                                  <span className="badge bg-light text-muted fs-11px">
                                    Tanpa tenggat
                                  </span>
                                )}
                              </div>

                              <h6 className="title fs-14px text-dark mb-1">
                                {q.teks}
                              </h6>
                              <p className="sub-text text-muted fs-11px mb-2">
                                Penanya: <strong>{q.penanya || "Anonim"}</strong>
                                {q.unit ? ` (${q.unit})` : ""}
                              </p>

                              <div className="bg-light p-2 rounded mb-2">
                                <span className="sub-text fw-bold text-dark d-block mb-1 fs-11px">
                                  Rencana Tindak Lanjut:
                                </span>
                                <p className="fs-12px text-dark mb-0">
                                  {q.rencana || (
                                    <em className="text-muted">
                                      Rencana belum dirumuskan.
                                    </em>
                                  )}
                                </p>
                              </div>

                              <div className="d-flex justify-content-between fs-11px text-muted mb-1">
                                <span>
                                  PIC: <strong>{q.pic || "-"}</strong>
                                </span>
                                <span>Progres: <strong>{q.progres}%</strong></span>
                              </div>

                              <Progress
                                value={q.progres}
                                color={
                                  q.progres >= 80
                                    ? "success"
                                    : q.progres >= 40
                                    ? "info"
                                    : "warning"
                                }
                                className="progress-sm mb-3"
                              />
                            </div>

                            <div className="text-end">
                              <Button
                                color="outline-primary"
                                size="sm"
                                onClick={() => setActiveQ(q)}
                              >
                                <Icon name="edit" className="me-1" />
                                <span>Perbarui RTL</span>
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
        </Block>

        {/* MODAL TAMBAH PERTANYAAN (MOBILE / UNIVERSAL) */}
        <Modal
          isOpen={modalAddQ}
          toggle={() => setModalAddQ(!modalAddQ)}
          className="modal-dialog-centered"
        >
          <ModalHeader toggle={() => setModalAddQ(!modalAddQ)}>
            {isGuru ? "Ajukan Pertanyaan ke Rapat Ini" : "Catat Pertanyaan Baru"}
          </ModalHeader>
          <Form onSubmit={handleAddQ}>
            <ModalBody>
              {isGuru ? (
                <div className="bg-light p-2.5 rounded mb-3 border">
                  <span className="text-muted fs-11px d-block">Identitas Penanya (Terverifikasi Akun):</span>
                  <strong className="text-dark fs-13px">{user?.nama}</strong>
                  <span className="text-muted fs-12px d-block">{user?.unit || "Dewan Guru SMK Hassina"}</span>
                </div>
              ) : (
                <>
                  <FormGroup className="mb-3">
                    <Label className="form-label" htmlFor="m-penanya">
                      Nama Penanya <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="m-penanya"
                      required
                      placeholder="Contoh: Rina Marlina, S.Pd."
                      value={newQForm.penanya}
                      onChange={(e) =>
                        setNewQForm({ ...newQForm, penanya: e.target.value })
                      }
                    />
                  </FormGroup>

                  <FormGroup className="mb-3">
                    <Label className="form-label" htmlFor="m-unit">
                      Jabatan / Unit Kerja
                    </Label>
                    <Input
                      type="text"
                      id="m-unit"
                      placeholder="Contoh: Guru BK / Kaprog TJKT"
                      value={newQForm.unit}
                      onChange={(e) =>
                        setNewQForm({ ...newQForm, unit: e.target.value })
                      }
                    />
                  </FormGroup>
                </>
              )}

              <FormGroup className="mb-3">
                <Label className="form-label" htmlFor="m-teks">
                  Isi Pertanyaan / Aspirasi <span className="text-danger">*</span>
                </Label>
                <Input
                  type="textarea"
                  id="m-teks"
                  rows="3"
                  required
                  placeholder="Tuliskan isi pertanyaan..."
                  value={newQForm.teks}
                  onChange={(e) =>
                    setNewQForm({ ...newQForm, teks: e.target.value })
                  }
                />
              </FormGroup>

              <Row className="g-2">
                <Col sm="6">
                  <FormGroup>
                    <Label className="form-label" htmlFor="m-kategori">
                      Kategori
                    </Label>
                    <Input
                      type="select"
                      id="m-kategori"
                      value={newQForm.kategori}
                      onChange={(e) =>
                        setNewQForm({ ...newQForm, kategori: e.target.value })
                      }
                    >
                      {KATEGORI_LIST.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>
                <Col sm="6">
                  <FormGroup>
                    <Label className="form-label" htmlFor="m-prioritas">
                      Prioritas
                    </Label>
                    <Input
                      type="select"
                      id="m-prioritas"
                      value={newQForm.prioritas}
                      onChange={(e) =>
                        setNewQForm({ ...newQForm, prioritas: e.target.value })
                      }
                    >
                      {PRIORITAS_LIST.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>
              </Row>
            </ModalBody>
            <ModalFooter className="bg-light">
              <Button
                color="secondary"
                type="button"
                onClick={() => setModalAddQ(false)}
              >
                Batal
              </Button>
              <Button color="primary" type="submit">
                <Icon name="check" className="me-1" />
                <span>{isGuru ? "Ajukan Pertanyaan Saya" : "Simpan Pertanyaan"}</span>
              </Button>
            </ModalFooter>
          </Form>
        </Modal>

        {/* MODAL EDIT PERTANYAAN & RTL */}
        <Modal
          isOpen={!!activeQ}
          toggle={() => setActiveQ(null)}
          className="modal-dialog-centered modal-lg"
        >
          {activeQ && (
            <>
              <ModalHeader toggle={() => setActiveQ(null)}>
                Detail Pertanyaan &amp; Tindak Lanjut
              </ModalHeader>
              {isGuru ? (
                <>
                  <ModalBody>
                    <div className="bg-light p-3 rounded mb-3 border">
                      <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-1">
                        <span className="badge badge-dim bg-primary">
                          {activeQ.kategori}
                        </span>
                        <span className="badge badge-dim bg-light border text-muted">
                          Prioritas {activeQ.prioritas}
                        </span>
                      </div>
                      <h5 className="fs-15px text-dark mb-1 fw-bold">{activeQ.teks}</h5>
                      <span className="sub-text text-muted fs-11px">
                        Diajukan oleh: <strong>{activeQ.penanya || "Anonim"}</strong>
                        {activeQ.unit ? ` · ${activeQ.unit}` : ""}
                      </span>
                    </div>

                    <div className="border rounded p-3 mb-3 bg-white">
                      <h6 className="title fs-13px mb-2 text-dark">Status Realisasi &amp; Tindak Lanjut Sekolah</h6>
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
                          <strong className="text-dark fs-12px">{activeQ.pic || "Belum ditugaskan"}</strong>
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
                        <span className="text-muted fs-11px d-block mb-1">Rencana Langkah Penyelesaian:</span>
                        <p className="text-dark fs-12px mb-0 bg-light p-2 rounded">
                          {activeQ.rencana || "Belum ada langkah penyelesaian yang dicatat."}
                        </p>
                      </div>

                      <div className="mb-2">
                        <div className="d-flex justify-content-between fs-11px mb-1">
                          <span className="text-muted">Progres Penyelesaian:</span>
                          <strong className="text-primary">{activeQ.progres || 0}%</strong>
                        </div>
                        <Progress value={activeQ.progres || 0} color="primary" className="progress-sm" />
                      </div>

                      {activeQ.keterangan && (
                        <div className="mt-2">
                          <span className="text-muted fs-11px d-block mb-1">Keterangan / Catatan:</span>
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
                      <div className="d-flex justify-content-between mb-1">
                        <span className="badge badge-dim bg-primary">
                          {activeQ.kategori}
                        </span>
                        <span className="sub-text text-muted">
                          Prioritas {activeQ.prioritas}
                        </span>
                      </div>
                      <h5 className="fs-15px text-dark mb-1">{activeQ.teks}</h5>
                      <span className="sub-text text-muted">
                        Diajukan oleh: <strong>{activeQ.penanya || "Anonim"}</strong>
                        {activeQ.unit ? ` · ${activeQ.unit}` : ""}
                      </span>
                    </div>

                    <Row className="g-3">
                      <Col sm="4">
                        <FormGroup>
                          <Label className="form-label" htmlFor="dq-status">
                            Status Tindak Lanjut
                          </Label>
                          <Input
                            type="select"
                            id="dq-status"
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
                          <Label className="form-label" htmlFor="dq-output">
                            Output
                          </Label>
                          <Input
                            type="select"
                            id="dq-output"
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
                          <Label className="form-label" htmlFor="dq-prioritas">
                            Prioritas
                          </Label>
                          <Input
                            type="select"
                            id="dq-prioritas"
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
                            <Label className="form-label mb-0" htmlFor="dq-lampiran">
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
                          <Label className="form-label" htmlFor="dq-rencana">
                            Rencana Tindak Lanjut (Langkah Konkret)
                          </Label>
                          <Input
                            type="textarea"
                            id="dq-rencana"
                            rows="3"
                            placeholder="Apa langkah yang akan diambil? Siapa yang dikoordinasikan? Bentuk hasil akhir?"
                            value={activeQ.rencana || ""}
                            onChange={(e) =>
                              setActiveQ({ ...activeQ, rencana: e.target.value })
                            }
                          />
                        </FormGroup>
                      </Col>

                      <Col sm="6">
                        <FormGroup>
                          <Label className="form-label" htmlFor="dq-pic">
                            Penanggung Jawab (PIC)
                          </Label>
                          <Input
                            type="text"
                            id="dq-pic"
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
                          <Label className="form-label" htmlFor="dq-tenggat">
                            Tenggat Waktu Selesai (Deadline)
                          </Label>
                          <Input
                            type="date"
                            id="dq-tenggat"
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
                            <Label className="form-label mb-0" htmlFor="dq-progres">
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
                            id="dq-progres"
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
                          <Label className="form-label" htmlFor="dq-keterangan">
                            Keterangan / Nomor SK / Catatan Pelaksanaan
                          </Label>
                          <Input
                            type="textarea"
                            id="dq-keterangan"
                            rows="2"
                            placeholder="Catatan tambahan realisasi program..."
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

                    {/* Timeline Perkembangan */}
                    <div className="mt-3 pt-2 border-top">
                      <h6 className="title fs-13px mb-2">Riwayat Log Perkembangan</h6>
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

                      <div
                        className="timeline"
                        style={{ maxHeight: "170px", overflowY: "auto" }}
                      >
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

        {/* MODAL PREVIEW DOKUMENTASI (FOTO & PDF) */}
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

        {/* MODAL EDIT INFO RAPAT */}
        <Modal
          isOpen={modalEditMeeting}
          toggle={() => setModalEditMeeting(!modalEditMeeting)}
          className="modal-dialog-centered modal-lg"
        >
          <ModalHeader toggle={() => setModalEditMeeting(!modalEditMeeting)}>
            Edit Informasi Rapat
          </ModalHeader>
          <Form onSubmit={handleSaveMeetingInfo}>
            <ModalBody>
              <Row className="g-3">
                <Col md="12">
                  <FormGroup>
                    <Label className="form-label" htmlFor="em-judul">
                      Judul / Topik Rapat <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="em-judul"
                      required
                      value={editMeetingForm.judul || ""}
                      onChange={(e) =>
                        setEditMeetingForm({
                          ...editMeetingForm,
                          judul: e.target.value,
                        })
                      }
                    />
                  </FormGroup>
                </Col>

                <Col sm="6">
                  <FormGroup>
                    <Label className="form-label" htmlFor="em-jenis">
                      Jenis Rapat
                    </Label>
                    <Input
                      type="select"
                      id="em-jenis"
                      value={editMeetingForm.jenis || "Rapat Dinas"}
                      onChange={(e) =>
                        setEditMeetingForm({
                          ...editMeetingForm,
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
                    <Label className="form-label" htmlFor="em-tanggal">
                      Hari / Tanggal
                    </Label>
                    <Input
                      type="date"
                      id="em-tanggal"
                      value={editMeetingForm.tanggal || ""}
                      onChange={(e) =>
                        setEditMeetingForm({
                          ...editMeetingForm,
                          tanggal: e.target.value,
                        })
                      }
                    />
                  </FormGroup>
                </Col>

                <Col sm="6">
                  <FormGroup>
                    <Label className="form-label" htmlFor="em-waktu">
                      Waktu
                    </Label>
                    <Input
                      type="text"
                      id="em-waktu"
                      value={editMeetingForm.waktu || ""}
                      onChange={(e) =>
                        setEditMeetingForm({
                          ...editMeetingForm,
                          waktu: e.target.value,
                        })
                      }
                    />
                  </FormGroup>
                </Col>

                <Col sm="6">
                  <FormGroup>
                    <Label className="form-label" htmlFor="em-tempat">
                      Tempat
                    </Label>
                    <Input
                      type="text"
                      id="em-tempat"
                      value={editMeetingForm.tempat || ""}
                      onChange={(e) =>
                        setEditMeetingForm({
                          ...editMeetingForm,
                          tempat: e.target.value,
                        })
                      }
                    />
                  </FormGroup>
                </Col>

                <Col sm="6">
                  <FormGroup>
                    <Label className="form-label" htmlFor="em-pemimpin">
                      Pemimpin Rapat
                    </Label>
                    <Input
                      type="text"
                      id="em-pemimpin"
                      value={editMeetingForm.pemimpin || ""}
                      onChange={(e) =>
                        setEditMeetingForm({
                          ...editMeetingForm,
                          pemimpin: e.target.value,
                        })
                      }
                    />
                  </FormGroup>
                </Col>

                <Col sm="6">
                  <FormGroup>
                    <Label className="form-label" htmlFor="em-notulis">
                      Notulis
                    </Label>
                    <Input
                      type="text"
                      id="em-notulis"
                      value={editMeetingForm.notulis || ""}
                      onChange={(e) =>
                        setEditMeetingForm({
                          ...editMeetingForm,
                          notulis: e.target.value,
                        })
                      }
                    />
                  </FormGroup>
                </Col>

                <Col md="12">
                  <FormGroup>
                    <Label className="form-label" htmlFor="em-peserta">
                      Peserta Hadir
                    </Label>
                    <Input
                      type="text"
                      id="em-peserta"
                      value={editMeetingForm.peserta || ""}
                      onChange={(e) =>
                        setEditMeetingForm({
                          ...editMeetingForm,
                          peserta: e.target.value,
                        })
                      }
                    />
                  </FormGroup>
                </Col>
              </Row>
            </ModalBody>
            <ModalFooter className="bg-light">
              <Button
                color="secondary"
                type="button"
                onClick={() => setModalEditMeeting(false)}
              >
                Batal
              </Button>
              <Button color="primary" type="submit">
                Simpan Perubahan
              </Button>
            </ModalFooter>
          </Form>
        </Modal>

        {/* MODAL POP-UP MODERN: BACAKAN PERTANYAAN FORUM */}
        <Modal
          isOpen={readerOpen && meetingQuestions.length > 0}
          toggle={() => setReaderOpen(!readerOpen)}
          className="modal-dialog-centered modal-lg"
        >
          <ModalHeader toggle={() => setReaderOpen(false)}>
            <div className="d-flex align-items-center gap-2">
              <Icon name="mic" className="text-primary fs-4" />
              <span className="fw-bold">Bacakan Pertanyaan Peserta</span>
              <span className="badge bg-primary rounded-pill ms-2 fs-11px">
                {readerIdx + 1} dari {meetingQuestions.length}
              </span>
            </div>
          </ModalHeader>
          <ModalBody className="p-3 p-md-4">
            {/* Progress Stepper */}
            <div className="mb-3">
              <div className="d-flex justify-content-between fs-11px text-muted mb-1">
                <span>Progres Pertanyaan Forum</span>
                <span className="fw-bold text-dark">
                  {Math.round(((readerIdx + 1) / meetingQuestions.length) * 100)}%
                </span>
              </div>
              <Progress
                value={((readerIdx + 1) / meetingQuestions.length) * 100}
                color="primary"
                style={{ height: "6px", borderRadius: "10px" }}
              />
            </div>

            {(() => {
              const q = meetingQuestions[readerIdx];
              if (!q) return null;
              return (
                <div>
                  <div className="card card-bordered p-3 p-md-4 bg-light rounded-3 mb-3 border">
                    <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-1">
                      <div className="d-flex gap-1.5 align-items-center">
                        <span className="badge badge-dim bg-primary fs-11px">
                          {q.kategori}
                        </span>
                        <span className="badge badge-dim bg-light border text-muted fs-11px">
                          Prioritas {q.prioritas}
                        </span>
                      </div>
                      <span className="badge bg-dark fs-11px text-white px-2 py-0.5">
                        Status: {q.status?.toUpperCase()}
                      </span>
                    </div>

                    <h4
                      className="fw-bold mb-3 text-dark fs-18px fs-md-22px"
                      style={{ lineHeight: "1.45" }}
                    >
                      “{q.teks}”
                    </h4>

                    <div className="d-flex align-items-center mt-2 pt-2 border-top">
                      <div className="user-avatar sm bg-primary-dim text-primary me-2">
                        <Icon name="user" />
                      </div>
                      <div>
                        <strong className="text-dark fs-13px d-block">
                          {q.penanya || "Anonim"}
                        </strong>
                        <span className="text-muted fs-11px d-block">
                          {q.unit || "Dewan Guru / Staf SMK Hassina"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form Tanggapan & RTL Forum (Untuk Super Admin & Notulen) */}
                  {!isGuru && (
                    <div className="card card-bordered p-3 bg-white mb-2 border">
                      <h6 className="title text-dark mb-2 fs-13px d-flex align-items-center">
                        <Icon name="edit-alt" className="me-1 text-primary" />
                        <span>Tanggapan Langsung Forum &amp; Rencana Tindak Lanjut:</span>
                      </h6>
                      <Input
                        type="textarea"
                        rows="2"
                        className="fs-13px mb-2"
                        placeholder="Ketik keputusan tanggapan forum langsung di sini..."
                        value={q.rencana || ""}
                        onChange={(e) => {
                          updateQuestion(q.id, { rencana: e.target.value });
                        }}
                      />

                      <Row className="g-2 mb-2">
                        <Col sm="6">
                          <Label className="form-label fs-11px mb-1 text-muted">Output Realisasi:</Label>
                          <Input
                            type="select"
                            bsSize="sm"
                            value={q.output || "Belum ditentukan"}
                            onChange={(e) => {
                              updateQuestion(q.id, { output: e.target.value });
                            }}
                          >
                            {OUTPUT_LIST.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </Input>
                        </Col>
                        <Col sm="6">
                          <Label className="form-label fs-11px mb-1 text-muted">Penanggung Jawab (PIC):</Label>
                          <Input
                            type="text"
                            bsSize="sm"
                            placeholder="Contoh: Wakasek Kesiswaan"
                            value={q.pic || ""}
                            onChange={(e) => {
                              updateQuestion(q.id, { pic: e.target.value });
                            }}
                          />
                        </Col>
                      </Row>

                      <div className="d-flex gap-1.5 flex-wrap pt-1">
                        <span className="text-muted fs-11px align-self-center me-1">Ubah Status:</span>
                        {STATUS_LIST.map((st) => (
                          <Button
                            key={st.id}
                            size="xs"
                            color={q.status === st.id ? st.color : "outline-light"}
                            className={q.status === st.id ? "fw-bold" : "text-dark bg-light border"}
                            onClick={() => {
                              updateQuestion(
                                q.id,
                                {
                                  status: st.id,
                                  progres: st.id === "selesai" ? 100 : q.progres,
                                },
                                `Status diubah saat forum: ${st.label}`
                              );
                            }}
                          >
                            {st.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </ModalBody>
          <ModalFooter className="bg-light d-flex justify-content-between align-items-center">
            <Button
              color="outline-secondary"
              size="sm"
              disabled={readerIdx === 0}
              onClick={() => setReaderIdx((i) => Math.max(0, i - 1))}
            >
              <Icon name="arrow-left" className="me-1" />
              <span>Sebelumnya</span>
            </Button>
            <span className="text-muted fs-12px">
              Slide <strong>{readerIdx + 1}</strong> / {meetingQuestions.length}
            </span>
            <div className="d-flex gap-2">
              <Button
                color="primary"
                size="sm"
                disabled={readerIdx === meetingQuestions.length - 1}
                onClick={() =>
                  setReaderIdx((i) =>
                    Math.min(meetingQuestions.length - 1, i + 1)
                  )
                }
              >
                <span>Berikutnya</span>
                <Icon name="arrow-right" className="ms-1" />
              </Button>
              <Button
                color="secondary"
                size="sm"
                onClick={() => setReaderOpen(false)}
              >
                Tutup
              </Button>
            </div>
          </ModalFooter>
        </Modal>

        {/* PRINT ONLY TEMPLATE */}
        <div id="print-area-doc" className="d-none d-print-block">
          <div className="text-center mb-4">
            <h3 className="mb-1 fw-bold">SMK HASSINA SUKABUMI</h3>
            <h5 className="mb-0">DOKUMEN NOTULA RAPAT RESMI</h5>
            <hr />
          </div>

          <table className="table table-bordered mb-4">
            <tbody>
              <tr>
                <td style={{ width: "25%" }}>
                  <strong>Topik / Judul Rapat</strong>
                </td>
                <td>{meeting.judul}</td>
              </tr>
              <tr>
                <td>
                  <strong>Jenis Rapat</strong>
                </td>
                <td>{meeting.jenis}</td>
              </tr>
              <tr>
                <td>
                  <strong>Hari / Tanggal & Waktu</strong>
                </td>
                <td>
                  {fDate(meeting.tanggal)} · {meeting.waktu}
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Tempat</strong>
                </td>
                <td>{meeting.tempat}</td>
              </tr>
              <tr>
                <td>
                  <strong>Pemimpin Rapat</strong>
                </td>
                <td>{meeting.pemimpin}</td>
              </tr>
              <tr>
                <td>
                  <strong>Notulis</strong>
                </td>
                <td>{meeting.notulis}</td>
              </tr>
              <tr>
                <td>
                  <strong>Peserta Rapat</strong>
                </td>
                <td>{meeting.peserta}</td>
              </tr>
            </tbody>
          </table>

          <h5 className="fw-bold">A. Agenda Rapat</h5>
          <p style={{ whiteSpace: "pre-wrap" }}>{meeting.agenda || "-"}</p>

          <h5 className="fw-bold mt-4">B. Jalannya Rapat & Diskusi</h5>
          <p style={{ whiteSpace: "pre-wrap" }}>{meeting.catatan || "-"}</p>

          <h5 className="fw-bold mt-4">C. Kesepakatan & Keputusan</h5>
          <p style={{ whiteSpace: "pre-wrap" }}>{meeting.keputusan || "-"}</p>

          <h5 className="fw-bold mt-4">D. Pertanyaan & Rencana Tindak Lanjut (RTL)</h5>
          {meetingQuestions.length === 0 ? (
            <p>Tidak ada pertanyaan masuk.</p>
          ) : (
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th style={{ width: "5%" }}>No</th>
                  <th style={{ width: "20%" }}>Penanya</th>
                  <th style={{ width: "35%" }}>Pertanyaan</th>
                  <th style={{ width: "25%" }}>Rencana Tindak Lanjut</th>
                  <th style={{ width: "15%" }}>PIC & Status</th>
                </tr>
              </thead>
              <tbody>
                {meetingQuestions.map((q, idx) => (
                  <tr key={q.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <strong>{q.penanya}</strong>
                      <br />
                      <small>{q.unit}</small>
                    </td>
                    <td>{q.teks}</td>
                    <td>
                      {q.rencana || "-"}
                      {q.output && q.output !== "Belum ditentukan" && (
                        <div>
                          <small>Output: {q.output}</small>
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{q.pic || "-"}</strong>
                      <br />
                      <small>Status: {q.status.toUpperCase()}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="row mt-5 pt-4">
            <div className="col-6 text-center">
              <p>
                Notulis Rapat,
                <br />
                <br />
                <br />
                <br />
                <strong>{meeting.notulis || "__________________"}</strong>
              </p>
            </div>
            <div className="col-6 text-center">
              <p>
                Pemimpin Rapat / Kepala Sekolah,
                <br />
                <br />
                <br />
                <br />
                <strong>{meeting.pemimpin || "__________________"}</strong>
              </p>
            </div>
          </div>
        </div>
      </Content>
    </React.Fragment>
  );
};

export default DetailRapat;

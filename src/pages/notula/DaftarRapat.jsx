import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Row,
  Col,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown,
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
  JENIS_LIST,
} from "@/notula-context/NotulaContext";

const DaftarRapat = () => {
  const { meetings, questions, addMeeting, deleteMeeting } = useNotula();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState("all");

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

  const handleCreateMeeting = (e) => {
    e.preventDefault();
    if (!newMeetingForm.judul.trim()) return;
    const created = addMeeting(newMeetingForm);
    setModalNewMeeting(false);
    navigate(`/rapat/${created.id}`);
  };

  const filteredMeetings = useMemo(() => {
    return [...meetings]
      .sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""))
      .filter((m) => {
        const matchesJenis = filterJenis === "all" || m.jenis === filterJenis;
        const term = search.toLowerCase();
        const matchesSearch =
          !term ||
          (m.judul || "").toLowerCase().includes(term) ||
          (m.tempat || "").toLowerCase().includes(term) ||
          (m.notulis || "").toLowerCase().includes(term) ||
          (m.pemimpin || "").toLowerCase().includes(term);
        return matchesJenis && matchesSearch;
      });
  }, [meetings, search, filterJenis]);

  return (
    <React.Fragment>
      <Head title="Daftar Rapat Dinas - SMK Hassina Sukabumi" />
      <Content>
        {/* Header */}
        <BlockHead size="sm" className="notula-page-header mb-4 mb-md-5">
          <BlockBetween className="align-items-start align-items-md-center flex-wrap gap-3">
            <BlockHeadContent>
              <div className="notula-page-meta">
                <span className="meta-school-pill">
                  <Icon name="building" className="me-1" />
                  SMK HASSINA SUKABUMI
                </span>
                <span className="meta-date-pill">
                  <Icon name="calendar" className="me-1 text-primary" />
                  {fDate(todayISO())}
                </span>
              </div>
              <BlockTitle page tag="h3" className="notula-page-title">
                Daftar Rapat &amp; Sidang Dinas
              </BlockTitle>
              <BlockDes className="text-soft">
                <p className="mb-0">Arsip dokumen notulensi resmi, risalah rapat dinas, dan monitoring tindak lanjut (RTL) SMK Hassina Sukabumi.</p>
              </BlockDes>
            </BlockHeadContent>
            <BlockHeadContent>
              <Button
                color="primary"
                className="fw-bold"
                onClick={() => setModalNewMeeting(true)}
              >
                <Icon name="plus" className="me-1" />
                <span>Catat Rapat Baru</span>
              </Button>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        {/* Filter & Pencarian */}
        <Block>
          <Card className="card-bordered mb-4 bg-white">
            <CardBody className="card-inner py-3 px-3 px-md-4 align-items-center">
              <Row className="g-3 align-items-center">
                <Col md="6" sm="12">
                  <div className="form-control-wrap">
                    <div className="form-icon form-icon-left">
                      <Icon name="search" />
                    </div>
                    <Input
                      type="text"
                      className="form-control"
                      placeholder="Cari topik, tempat, pemimpin, atau notulis..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </Col>
                <Col md="4" sm="8">
                  <Input
                    type="select"
                    value={filterJenis}
                    onChange={(e) => setFilterJenis(e.target.value)}
                  >
                    <option value="all">Semua Jenis Rapat</option>
                    {JENIS_LIST.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </Input>
                </Col>
                <Col md="2" sm="4" className="text-sm-end text-soft fs-13px">
                  <span>{filteredMeetings.length} rapat ditemukan</span>
                </Col>
              </Row>
            </CardBody>
          </Card>

          {/* Grid Kartu Rapat */}
          {filteredMeetings.length === 0 ? (
            <div className="alert alert-light text-center py-5 border">
              <Icon name="calendar-booking" className="text-muted fs-1 mb-2" />
              <h5>Belum Ada Rapat yang Cocok</h5>
              <p className="text-soft mb-3">
                Coba sesuaikan kata kunci pencarian atau catat agenda rapat baru.
              </p>
              <Button
                color="primary"
                size="sm"
                onClick={() => setModalNewMeeting(true)}
              >
                <Icon name="plus" className="me-1" />
                <span>Catat Rapat Baru</span>
              </Button>
            </div>
          ) : (
            <Row className="g-3">
              {filteredMeetings.map((m) => {
                const qs = questions.filter((q) => q.mid === m.id);
                const activeQs = qs.filter(
                  (q) => q.status === "perlu" || q.status === "proses"
                ).length;
                const doneQs = qs.filter((q) => q.status === "selesai").length;

                return (
                  <Col md="6" key={m.id}>
                    <Card className="card-bordered h-100 bg-white">
                      <CardBody className="card-inner p-4 d-flex flex-column justify-content-between">
                        <div>
                          {/* Header Card */}
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="d-flex align-items-center gap-1 flex-wrap">
                              <span className="badge badge-dim bg-primary fs-11px">
                                {m.jenis}
                              </span>
                              {m.status === "selesai" ? (
                                <span className="badge badge-dim bg-success fs-11px fw-bold">
                                  Selesai
                                </span>
                              ) : (
                                <span className="badge badge-dim bg-warning fs-11px fw-bold">
                                  Draf
                                </span>
                              )}
                            </div>

                            <UncontrolledDropdown>
                              <DropdownToggle
                                tag="a"
                                className="btn btn-trigger btn-icon btn-sm text-muted"
                              >
                                <Icon name="more-h" />
                              </DropdownToggle>
                              <DropdownMenu end className="dropdown-menu-sm">
                                <DropdownItem tag={Link} to={`/rapat/${m.id}`}>
                                  <Icon name="edit" className="me-2" />
                                  <span>Buka Notula</span>
                                </DropdownItem>
                                <DropdownItem
                                  tag={Link}
                                  to={`/rapat/${m.id}?reader=true`}
                                >
                                  <Icon name="play" className="me-2" />
                                  <span>Mode Bacakan</span>
                                </DropdownItem>
                                <DropdownItem divider />
                                <DropdownItem
                                  className="text-danger"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Hapus dokumen rapat "${m.judul}" beserta seluruh pertanyaan di dalamnya?`
                                      )
                                    ) {
                                      deleteMeeting(m.id);
                                    }
                                  }}
                                >
                                  <Icon name="trash" className="me-2" />
                                  <span>Hapus</span>
                                </DropdownItem>
                              </DropdownMenu>
                            </UncontrolledDropdown>
                          </div>

                          {/* Judul Rapat */}
                          <Link to={`/rapat/${m.id}`} className="text-dark">
                            <h5 className="title fs-15px mb-1 fw-bold">
                              {m.judul}
                            </h5>
                          </Link>

                          <p className="sub-text text-soft fs-13px mb-3">
                            <Icon name="calendar" className="me-1" />
                            {fDate(m.tanggal)} &middot; {m.waktu || "-"} &middot;{" "}
                            <Icon name="map-pin" className="ms-1 me-1" />
                            {m.tempat || "-"}
                          </p>

                          {/* Meta Details */}
                          <div className="border rounded p-2 mb-3 fs-13px bg-lighter">
                            <div className="d-flex justify-content-between mb-1">
                              <span className="text-soft">Pemimpin:</span>
                              <span className="text-dark fw-medium text-truncate ms-2">
                                {m.pemimpin || "-"}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between mb-1">
                              <span className="text-soft">Notulis:</span>
                              <span className="text-dark fw-medium text-truncate ms-2">
                                {m.notulis || "-"}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-soft">Aspirasi:</span>
                              <span className="text-dark ms-2">
                                <strong>{qs.length}</strong> Masuk &middot;{" "}
                                <strong className="text-warning">{activeQs}</strong> RTL Aktif &middot;{" "}
                                <strong className="text-success">{doneQs}</strong> Selesai
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Footer Card Actions */}
                        <div className="d-flex justify-content-between align-items-center pt-2 border-top gap-2">
                          <Link
                            to={`/rapat/${m.id}?reader=true`}
                            className="btn btn-sm btn-outline-light text-dark bg-white"
                          >
                            <Icon name="play" className="me-1 text-primary" />
                            <span>Bacakan</span>
                          </Link>
                          <Link
                            to={`/rapat/${m.id}`}
                            className="btn btn-sm btn-primary"
                          >
                            <Icon name="edit" className="me-1" />
                            <span>Buka Notulensi</span>
                          </Link>
                        </div>
                      </CardBody>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </Block>

        {/* Modal Buat Rapat Baru */}
        <Modal
          isOpen={modalNewMeeting}
          toggle={() => setModalNewMeeting(!modalNewMeeting)}
          className="modal-dialog-centered modal-lg"
        >
          <ModalHeader toggle={() => setModalNewMeeting(!modalNewMeeting)}>
            Catat Dokumen Rapat Baru
          </ModalHeader>
          <Form onSubmit={handleCreateMeeting}>
            <ModalBody>
              <Row className="g-3">
                <Col md="12">
                  <FormGroup>
                    <Label className="form-label" htmlFor="dm-judul">
                      Judul / Topik Rapat <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="dm-judul"
                      required
                      placeholder="Contoh: Rapat Evaluasi Pembelajaran & Disiplin Siswa"
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
                    <Label className="form-label" htmlFor="dm-jenis">
                      Jenis Rapat
                    </Label>
                    <Input
                      type="select"
                      id="dm-jenis"
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
                    <Label className="form-label" htmlFor="dm-tanggal">
                      Tanggal
                    </Label>
                    <Input
                      type="date"
                      id="dm-tanggal"
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
                    <Label className="form-label" htmlFor="dm-waktu">
                      Waktu
                    </Label>
                    <Input
                      type="text"
                      id="dm-waktu"
                      placeholder="08.00 – 11.00 WIB"
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
                    <Label className="form-label" htmlFor="dm-tempat">
                      Tempat
                    </Label>
                    <Input
                      type="text"
                      id="dm-tempat"
                      placeholder="Aula / Ruang Guru SMK Hassina"
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
                    <Label className="form-label" htmlFor="dm-pemimpin">
                      Pemimpin Rapat
                    </Label>
                    <Input
                      type="text"
                      id="dm-pemimpin"
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
                    <Label className="form-label" htmlFor="dm-notulis">
                      Notulis
                    </Label>
                    <Input
                      type="text"
                      id="dm-notulis"
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
                    <Label className="form-label" htmlFor="dm-peserta">
                      Peserta Hadir
                    </Label>
                    <Input
                      type="text"
                      id="dm-peserta"
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
            <ModalFooter className="bg-light">
              <Button
                color="secondary"
                type="button"
                onClick={() => setModalNewMeeting(false)}
              >
                Batal
              </Button>
              <Button color="primary" type="submit">
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

export default DaftarRapat;

import React, { useRef } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardBody,
  Row,
  Col,
  Progress,
  Button,
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
  todayISO,
  STATUS_LIST,
  KATEGORI_LIST,
} from "@/notula-context/NotulaContext";

const RekapNotula = () => {
  const { meetings, questions, importJSON, resetToDefault } = useNotula();
  const fileInputRef = useRef(null);

  const totalM = meetings.length;
  const totalQ = questions.length;

  // Sebaran Status
  const statusStats = STATUS_LIST.map((st) => {
    const count = questions.filter((q) => q.status === st.id).length;
    return { ...st, count };
  });

  // Sebaran Output
  const outputStats = [
    "SK Kepala Sekolah",
    "SOP / Prosedur Baru",
    "Program Kerja Bidang",
    "Usulan Anggaran",
  ].map((out) => {
    const count = questions.filter((q) => q.output === out).length;
    return { label: out, count };
  });

  // Sebaran PIC
  const picCountMap = {};
  questions
    .filter((q) => q.status === "perlu" || q.status === "proses")
    .forEach((q) => {
      const p = q.pic || "Belum Ditentukan";
      picCountMap[p] = (picCountMap[p] || 0) + 1;
    });
  const picStats = Object.keys(picCountMap)
    .map((k) => ({ label: k, count: picCountMap[k] }))
    .sort((a, b) => b.count - a.count);

  // Sebaran Kategori
  const kategoriStats = KATEGORI_LIST.map((kat) => {
    const count = questions.filter((q) => q.kategori === kat).length;
    return { label: kat, count };
  });

  // Export Data JSON
  const handleExport = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify({ meetings, questions }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `notula_smk_hassina_${todayISO()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Data JSON
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const success = importJSON(parsed);
        if (success) {
          alert("Data Notula SMK Hassina berhasil diimpor!");
        } else {
          alert("Format file JSON tidak valid.");
        }
      } catch (err) {
        alert("Gagal membaca file JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <React.Fragment>
      <Head title="Rekapitulasi Notulensi - SMK Hassina" />
      <Content>
        {/* Header */}
        <BlockHead size="sm" className="mb-4">
          <BlockBetween className="align-items-center flex-wrap gap-2">
            <BlockHeadContent>
              <div className="notula-page-meta">
                <span className="meta-school-pill">
                  <Icon name="building" className="me-1" />
                  SMK HASSINA SUKABUMI
                </span>
              </div>
              <BlockTitle page tag="h3" className="notula-page-title">
                Rekapitulasi &amp; Monitoring Notulensi
              </BlockTitle>
              <BlockDes className="text-soft">
                <p>Analisis sebaran status tindak lanjut, beban penanggung jawab (PIC), dan wujud capaian program sekolah.</p>
              </BlockDes>
            </BlockHeadContent>
            <BlockHeadContent>
              <div className="d-flex flex-wrap gap-2">
                <Button color="white" className="btn-outline-light rounded-pill px-3 shadow-sm" size="sm" onClick={handleExport}>
                  <Icon name="download" className="me-1 text-primary" />
                  <span>Cadangkan (JSON)</span>
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept=".json"
                  onChange={handleFileChange}
                />
                <Button
                  color="light"
                  outline
                  size="sm"
                  onClick={() => fileInputRef.current.click()}
                  className="bg-white rounded-pill px-3 shadow-sm"
                >
                  <Icon name="upload" className="me-1" />
                  <span>Pulihkan Data</span>
                </Button>
              </div>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        {/* 4 Cards Rekap Statistik */}
        <Block>
          <Row className="g-4">
            {/* Sebaran Status */}
            <Col md="6">
              <Card className="card-bordered h-100 bg-white">
                <CardBody className="card-inner p-4">
                  <h6 className="title mb-3 fs-16px text-dark">
                    <Icon name="pie" className="text-primary me-2" />
                    Sebaran Status Tindak Lanjut
                  </h6>
                  {statusStats.map((item) => {
                    const pct = totalQ > 0 ? Math.round((item.count / totalQ) * 100) : 0;
                    return (
                      <div key={item.label} className="mb-3">
                        <div className="d-flex justify-content-between fs-13px mb-1">
                          <span className="text-dark fw-bold">{item.label}</span>
                          <span className="text-muted">
                            {item.count} ({pct}%)
                          </span>
                        </div>
                        <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              backgroundColor:
                                item.color === "success"
                                  ? "#1ee0ac"
                                  : item.color === "warning"
                                  ? "#f4bd0e"
                                  : item.color === "info"
                                  ? "#09c2de"
                                  : "#6c757d",
                              borderRadius: "4px",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardBody>
              </Card>
            </Col>

            {/* Output Nyata */}
            <Col md="6">
              <Card className="card-bordered h-100 bg-white">
                <CardBody className="card-inner p-4">
                  <h6 className="title mb-1 fs-16px text-dark">
                    <Icon name="award" className="text-success me-2" />
                    Output Nyata yang Dihasilkan
                  </h6>
                  <p className="sub-text text-muted mb-3 fs-12px">
                    Aspirasi & pertanyaan rapat yang direalisasikan menjadi instrumen sekolah:
                  </p>
                  {outputStats.length === 0 ? (
                    <span className="text-muted fs-13px">Belum ada data output.</span>
                  ) : (
                    outputStats.map((item) => {
                      const maxVal = Math.max(...outputStats.map((x) => x.count), 1);
                      const pct = Math.round((item.count / maxVal) * 100);
                      return (
                        <div key={item.label} className="mb-3">
                          <div className="d-flex justify-content-between fs-13px mb-1">
                            <span className="text-dark fw-bold">{item.label}</span>
                            <span className="badge bg-success-dim text-success fw-bold">{item.count} Dokumen</span>
                          </div>
                          <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                backgroundColor: "#1ee0ac",
                                borderRadius: "4px",
                                transition: "width 0.3s ease",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardBody>
              </Card>
            </Col>

            {/* Beban PIC */}
            <Col md="6">
              <Card className="card-bordered h-100 bg-white">
                <CardBody className="card-inner p-4">
                  <h6 className="title mb-1 fs-16px text-dark">
                    <Icon name="user-check" className="text-warning me-2" />
                    Beban Penanggung Jawab (PIC Aktif)
                  </h6>
                  <p className="sub-text text-muted mb-3 fs-12px">
                    Tindak lanjut aktif yang sedang diproses oleh masing-masing unit:
                  </p>
                  {picStats.length === 0 ? (
                    <span className="text-muted fs-13px">Semua PIC telah menyelesaikan tugasnya.</span>
                  ) : (
                    picStats.map((item) => {
                      const maxVal = Math.max(...picStats.map((x) => x.count), 1);
                      const pct = Math.round((item.count / maxVal) * 100);
                      return (
                        <div key={item.label} className="mb-3">
                          <div className="d-flex justify-content-between fs-13px mb-1">
                            <span className="text-dark fw-bold text-truncate me-2">{item.label}</span>
                            <span className="badge bg-warning-dim text-warning fw-bold flex-shrink-0">
                              {item.count} Tugas
                            </span>
                          </div>
                          <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                backgroundColor: "#f4bd0e",
                                borderRadius: "4px",
                                transition: "width 0.3s ease",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardBody>
              </Card>
            </Col>

            {/* Kategori Pertanyaan */}
            <Col md="6">
              <Card className="card-bordered h-100 bg-white">
                <CardBody className="card-inner p-4">
                  <h6 className="title mb-3 fs-16px text-dark">
                    <Icon name="grid-alt" className="text-info me-2" />
                    Kategori Bidang Pertanyaan
                  </h6>
                  {kategoriStats.map((item) => {
                    const pct = totalQ > 0 ? Math.round((item.count / totalQ) * 100) : 0;
                    return (
                      <div key={item.label} className="mb-3">
                        <div className="d-flex justify-content-between fs-13px mb-1">
                          <span className="text-dark fw-bold">{item.label}</span>
                          <span className="text-muted">{item.count} ({pct}%)</span>
                        </div>
                        <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              backgroundColor: "#09c2de",
                              borderRadius: "4px",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Block>

        {/* Action Bottom */}
        <Block className="mt-4 text-center">
          <Button
            color="light"
            size="sm"
            onClick={() => {
              if (
                window.confirm(
                  "Apakah Anda yakin ingin menyetel ulang data kembali ke data contoh bawaan? Semua perubahan akan ditimpa."
                )
              ) {
                resetToDefault();
                alert("Data berhasil direset ke setelan awal.");
              }
            }}
            className="text-danger"
          >
            <Icon name="reload" className="me-1" />
            <span>Reset ke Data Awal Sistem</span>
          </Button>
        </Block>
      </Content>
    </React.Fragment>
  );
};

export default RekapNotula;

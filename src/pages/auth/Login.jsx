import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoHassina from "@/images/logo-hassina.png";
import Head from "@/layout/head/Head";
import { Icon } from "@/components/Component";
import { Form, Spinner, Alert, Card, CardBody } from "reactstrap";
import { useForm } from "react-hook-form";
import { useAuth } from "@/notula-context/AuthContext";

const ROLES_INFO = [
  {
    id: "admin",
    username: "admin",
    pass: "admin123",
    label: "Super Admin",
    sublabel: "Kepala Sekolah",
    color: "primary",
    icon: "shield-star",
    desc: "Akses penuh sistem, validasi & finalisasi dokumen rapat.",
  },
  {
    id: "notulen",
    username: "notulen",
    pass: "notulis123",
    label: "Moderator",
    sublabel: "Notulen Rapat",
    color: "info",
    icon: "edit-alt",
    desc: "Mencatat agenda, mengelola pertanyaan dan tindak lanjut (RTL).",
  },
  {
    id: "guru",
    username: "guru",
    pass: "guru123",
    label: "Guru",
    sublabel: "Ibu Rina Marlina",
    color: "success",
    icon: "user-check",
    desc: "Melihat agenda rapat dan menyampaikan pertanyaan/aspirasi.",
  },
];

const Login = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passState, setPassState] = useState(false);
  const [errorVal, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState("admin");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: "admin",
      password: "admin123",
    },
  });

  const onFormSubmit = async (formData) => {
    setLoading(true);
    setError("");
    try {
      const loggedUser = await login(formData.username, formData.password);
      if (loggedUser.role === "guru") {
        navigate("/rapat");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Gagal masuk. Periksa kembali username dan kata sandi Anda.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (r) => {
    setSelectedRole(r.id);
    setValue("username", r.username);
    setValue("password", r.pass);
    setError("");
  };

  return (
    <React.Fragment>
      <Head title="Masuk — Aplikasi Manajemen Pencatatan Rapat SMK Hassina" />
      <div
        className="min-vh-100 d-flex flex-column justify-content-between position-relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #eef2f6 50%, #e2e8f0 100%)",
        }}
      >
        {/* Subtle Decorative Ambient Elements */}
        <div
          aria-hidden="true"
          className="position-absolute"
          style={{
            top: "-80px",
            right: "-80px",
            width: "360px",
            height: "360px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(9, 113, 254, 0.12) 0%, rgba(9, 113, 254, 0) 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden="true"
          className="position-absolute"
          style={{
            bottom: "-60px",
            left: "-60px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0) 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Top Minimal Navigation Bar */}
        <header className="w-100 py-3 px-3 px-md-4 border-bottom bg-white bg-opacity-75 backdrop-blur-sm shadow-xs">
          <div className="container-xl d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <img
                src={LogoHassina}
                alt="Logo SMK Hassina"
                style={{ width: "32px", height: "32px", objectFit: "contain" }}
              />
              <span className="fw-bold text-dark fs-14px tracking-tight">
                SMK HASSINA SUKABUMI
              </span>
            </div>
            <span className="badge bg-light text-muted border rounded-pill px-2.5 py-1 fs-11px d-none d-sm-inline-flex align-items-center">
              <span className="live-indicator-dot me-1" style={{ width: "6px", height: "6px" }} />
              Sistem Aktif
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow-1 d-flex align-items-center justify-content-center py-4 py-md-5 px-3">
          <div style={{ width: "100%", maxWidth: "460px" }}>
            {/* Branding Header */}
            <div className="text-center mb-3 mb-md-4">
              <div
                className="d-inline-flex align-items-center justify-content-center p-2 mb-2 bg-white rounded-3 shadow-sm border"
                style={{ width: "56px", height: "56px" }}
              >
                <img
                  src={LogoHassina}
                  alt="SMK Hassina"
                  style={{ width: "40px", height: "40px", objectFit: "contain" }}
                />
              </div>

              <h3 className="fw-bold text-dark fs-20px fs-md-22px mb-1" style={{ letterSpacing: "-0.02em" }}>
                Aplikasi Manajemen Pencatatan Rapat
              </h3>
              <p className="text-muted fs-13px mb-0 mx-auto" style={{ maxWidth: "380px", lineHeight: "1.5" }}>
                Dokumentasi resmi catatan notulensi rapat dinas, pengesahan rapat, dan pengawalan rencana tindak lanjut (RTL).
              </p>
            </div>

            {/* Login Card */}
            <Card className="border-0 shadow-lg rounded-4 overflow-hidden bg-white">
              <div
                style={{
                  height: "4px",
                  background: "linear-gradient(90deg, #0971fe 0%, #0284c7 50%, #10b981 100%)",
                }}
              />
              <CardBody className="p-3 p-sm-4 p-md-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fs-16px fw-bold text-dark mb-0">Masuk ke Akun</h5>
                    <span className="text-muted fs-12px">Silakan pilih peran atau gunakan akun terdaftar</span>
                  </div>
                  <Icon name="lock-alt" className="text-primary fs-3 opacity-50" />
                </div>

                {/* Quick Role Selection Tabs */}
                <div className="mb-3">
                  <label className="form-label text-muted fs-11px fw-bold text-uppercase mb-1.5 d-block">
                    Pilih Peran Pengguna:
                  </label>
                  <div className="row g-2">
                    {ROLES_INFO.map((r) => {
                      const isSelected = selectedRole === r.id;
                      return (
                        <div className="col-4" key={r.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectRole(r)}
                            className={`btn w-100 p-2 text-start rounded-3 h-100 transition-all border d-flex flex-column justify-content-between ${
                              isSelected
                                ? `border-${r.color} bg-${r.color}-dim text-${r.color} shadow-xs`
                                : "border-light bg-light text-dark hover-bg-white"
                            }`}
                            style={{ transition: "all 0.15s ease" }}
                          >
                            <div className="d-flex align-items-center justify-content-between w-100 mb-1">
                              <Icon name={r.icon} className={`fs-13px text-${r.color}`} />
                              {isSelected && (
                                <span
                                  className={`badge rounded-circle p-0 bg-${r.color} text-white d-flex align-items-center justify-content-center`}
                                  style={{ width: "14px", height: "14px", fontSize: "9px" }}
                                >
                                  ✓
                                </span>
                              )}
                            </div>
                            <div>
                              <strong className="fs-12px d-block lh-sm mb-0.5">{r.label}</strong>
                              <span className="text-muted fs-10px d-block text-truncate" style={{ opacity: 0.85 }}>
                                {r.sublabel}
                              </span>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Active role description helper */}
                  {selectedRole && (
                    <div className="mt-2 py-1.5 px-2.5 bg-light rounded-2 border fs-11px text-muted d-flex align-items-center">
                      <Icon name="info" className="me-1.5 text-primary flex-shrink-0" />
                      <span>{ROLES_INFO.find((x) => x.id === selectedRole)?.desc}</span>
                    </div>
                  )}
                </div>

                {/* Error Alert */}
                {errorVal && (
                  <Alert color="danger" className="py-2 px-3 fs-12px mb-3 d-flex align-items-center border-0 shadow-xs">
                    <Icon name="alert-circle" className="fs-4 me-2 flex-shrink-0" />
                    <div>{errorVal}</div>
                  </Alert>
                )}

                {/* Credentials Form */}
                <Form onSubmit={handleSubmit(onFormSubmit)}>
                  <div className="mb-3">
                    <label className="form-label fs-12px fw-bold text-dark mb-1" htmlFor="username">
                      Username atau Email
                    </label>
                    <div className="form-control-wrap">
                      <div className="form-icon form-icon-left text-muted">
                        <Icon name="user" />
                      </div>
                      <input
                        type="text"
                        id="username"
                        {...register("username", { required: "Username atau email harus diisi" })}
                        placeholder="Contoh: admin / notulen / guru"
                        className={`form-control ps-4 ${errors.username ? "is-invalid" : ""}`}
                        style={{ height: "42px", fontSize: "13px" }}
                      />
                    </div>
                    {errors.username && (
                      <span className="text-danger fs-11px mt-1 d-block">{errors.username.message}</span>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fs-12px fw-bold text-dark mb-0" htmlFor="password">
                        Kata Sandi
                      </label>
                    </div>
                    <div className="form-control-wrap position-relative">
                      <div className="form-icon form-icon-left text-muted">
                        <Icon name="lock" />
                      </div>
                      <input
                        type={passState ? "text" : "password"}
                        id="password"
                        {...register("password", { required: "Kata sandi harus diisi" })}
                        placeholder="Masukkan kata sandi"
                        className={`form-control ps-4 pe-5 ${errors.password ? "is-invalid" : ""}`}
                        style={{ height: "42px", fontSize: "13px" }}
                      />
                      <button
                        type="button"
                        onClick={() => setPassState(!passState)}
                        className="btn btn-sm btn-icon position-absolute end-0 top-50 translate-middle-y me-1 text-muted border-0 shadow-none bg-transparent"
                        tabIndex={-1}
                        title={passState ? "Sembunyikan sandi" : "Tampilkan sandi"}
                      >
                        <Icon name={passState ? "eye-off" : "eye"} />
                      </button>
                    </div>
                    {errors.password && (
                      <span className="text-danger fs-11px mt-1 d-block">{errors.password.message}</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-100 py-2.5 rounded-3 fw-bold fs-13px shadow-sm mt-2 d-flex align-items-center justify-content-center"
                    style={{
                      background: "linear-gradient(135deg, #0971fe 0%, #1d4ed8 100%)",
                      border: "none",
                    }}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" color="light" className="me-2" />
                        <span>Memverifikasi Kredensial...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk ke Notula Rapat</span>
                        <Icon name="arrow-right" className="ms-1.5" />
                      </>
                    )}
                  </button>
                </Form>
              </CardBody>
            </Card>
          </div>
        </main>

        {/* Minimal Footer */}
        <footer className="py-2.5 text-center border-top bg-white bg-opacity-75 fs-11px text-soft">
          &copy; {new Date().getFullYear()} SMK Hassina Sukabumi — Aplikasi Manajemen Pencatatan Rapat. Seluruh hak cipta dilindungi.
        </footer>
      </div>
    </React.Fragment>
  );
};

export default Login;

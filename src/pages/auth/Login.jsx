import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoHassina from "@/images/logo-hassina.png";
import Head from "@/layout/head/Head";
import { Icon } from "@/components/Component";
import { Form, Spinner, Alert, Card, CardBody } from "reactstrap";
import { useForm } from "react-hook-form";
import { useAuth } from "@/notula-context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passState, setPassState] = useState(false);
  const [errorVal, setError] = useState("");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onFormSubmit = async (formData) => {
    setLoading(true);
    setError("");
    try {
      const loggedUser = await login(formData.username.trim(), formData.password);
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

  return (
    <React.Fragment>
      <Head title="Masuk — Sistem Notula Rapat SMK Hassina" />
      <div
        className="min-vh-100 d-flex flex-column justify-content-center align-items-center px-3 py-4"
        style={{ backgroundColor: "#f8fafc" }}
      >
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <Card
            className="border bg-white rounded-4 overflow-hidden"
            style={{
              borderColor: "#e2e8f0",
              boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.02)",
            }}
          >
            <div style={{ height: "4px", backgroundColor: "#2563eb" }} />
            <CardBody className="p-4 p-sm-5">
              {/* Brand Header */}
              <div className="text-center mb-4">
                <div
                  className="d-inline-flex align-items-center justify-content-center mb-3 bg-light rounded-3 border"
                  style={{ width: "54px", height: "54px", borderColor: "#e2e8f0" }}
                >
                  <img
                    src={LogoHassina}
                    alt="Logo SMK Hassina"
                    style={{ width: "36px", height: "36px", objectFit: "contain" }}
                  />
                </div>
                <h4 className="fw-bold text-dark mb-1" style={{ fontSize: "19px", letterSpacing: "-0.01em" }}>
                  Notula Rapat
                </h4>
                <p className="text-muted mb-0" style={{ fontSize: "13px" }}>
                  SMK Hassina Sukabumi
                </p>
              </div>

              {/* Error Alert */}
              {errorVal && (
                <Alert
                  color="danger"
                  className="py-2 px-3 fs-12px mb-3 d-flex align-items-center border-0 rounded-3"
                >
                  <Icon name="alert-circle" className="fs-5 me-2 flex-shrink-0" />
                  <div>{errorVal}</div>
                </Alert>
              )}

              {/* Credentials Form */}
              <Form onSubmit={handleSubmit(onFormSubmit)} noValidate>
                <div className="mb-3">
                  <label className="form-label fs-12px fw-semibold text-dark mb-1.5" htmlFor="username">
                    Username
                  </label>
                  <div className="form-control-wrap">
                    <div className="form-icon form-icon-left text-muted">
                      <Icon name="user" />
                    </div>
                    <input
                      type="text"
                      id="username"
                      autoComplete="username"
                      autoFocus
                      {...register("username", { required: "Username wajib diisi" })}
                      placeholder="Masukkan username Anda"
                      className={`form-control ps-4 rounded-3 ${errors.username ? "is-invalid" : ""}`}
                      style={{ height: "42px", fontSize: "13.5px" }}
                    />
                  </div>
                  {errors.username && (
                    <span className="text-danger fs-11px mt-1 d-block">{errors.username.message}</span>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label fs-12px fw-semibold text-dark mb-1.5" htmlFor="password">
                    Kata Sandi
                  </label>
                  <div className="form-control-wrap position-relative">
                    <div className="form-icon form-icon-left text-muted">
                      <Icon name="lock" />
                    </div>
                    <input
                      type={passState ? "text" : "password"}
                      id="password"
                      autoComplete="current-password"
                      {...register("password", { required: "Kata sandi wajib diisi" })}
                      placeholder="Masukkan kata sandi"
                      className={`form-control ps-4 pe-5 rounded-3 ${errors.password ? "is-invalid" : ""}`}
                      style={{ height: "42px", fontSize: "13.5px" }}
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
                  className="btn btn-primary w-100 py-2.5 rounded-3 fw-semibold fs-13px d-flex align-items-center justify-content-center shadow-xs"
                  style={{
                    backgroundColor: "#2563eb",
                    borderColor: "#2563eb",
                    height: "42px",
                  }}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" color="light" className="me-2" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk</span>
                      <Icon name="arrow-right" className="ms-1.5" />
                    </>
                  )}
                </button>
              </Form>
            </CardBody>
          </Card>

          <div className="text-center mt-3">
            <span className="text-muted" style={{ fontSize: "11.5px" }}>
              &copy; {new Date().getFullYear()} SMK Hassina Sukabumi
            </span>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Login;

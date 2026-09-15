import React from "react";
import { Link } from "react-router-dom";
import LogoHassina from "@/images/logo-hassina.png";

const Logo = () => {
  return (
    <Link to="/" className="logo-link d-flex align-items-center text-decoration-none py-1">
      <img
        src={LogoHassina}
        alt="SMK HASSINA"
        className="me-2 flex-shrink-0"
        style={{ width: "38px", height: "38px", objectFit: "contain" }}
      />
      <div className="d-flex flex-column justify-content-center">
        <span
          className="fw-bold text-dark text-truncate"
          style={{
            fontSize: "14px",
            lineHeight: "1.25",
            letterSpacing: "0.2px",
            display: "block",
          }}
        >
          NOTULA HASSINA
        </span>
        <span
          className="text-muted d-none d-sm-block text-truncate"
          style={{
            fontSize: "11px",
            lineHeight: "1.2",
            display: "block",
            marginTop: "1px",
          }}
        >
          SMK Hassina Sukabumi
        </span>
      </div>
    </Link>
  );
};

export default Logo;

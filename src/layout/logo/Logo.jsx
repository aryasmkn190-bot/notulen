import React from "react";
import { Link } from "react-router-dom";

const Logo = () => {
  return (
    <Link to="/" className="logo-link d-flex align-items-center text-decoration-none py-1">
      <div
        className="me-2 d-flex align-items-center justify-content-center text-white rounded-3 flex-shrink-0 shadow-sm"
        style={{
          width: "36px",
          height: "36px",
          background: "linear-gradient(135deg, #0971fe 0%, #1d4ed8 100%)",
        }}
      >
        <em className="icon ni ni-property fs-18px"></em>
      </div>
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

import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <div className="nk-footer bg-white border-top">
      <div className="container-fluid">
        <div className="nk-footer-wrap">
          <div className="nk-footer-copyright">
            &copy; {new Date().getFullYear()} <strong>SMK Hassina Sukabumi</strong> — Aplikasi Manajemen Rapat & Notulensi Sekolah.
          </div>
          <div className="nk-footer-links">
            <ul className="nav nav-sm">
              <li className="nav-item">
                <Link to="/" className="nav-link">
                  Beranda
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/rapat" className="nav-link">
                  Rapat
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/pertanyaan" className="nav-link">
                  Pertanyaan & RTL
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/rekap" className="nav-link">
                  Rekap
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;

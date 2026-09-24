import React, { useState } from "react";
import UserAvatar from "@/components/user/UserAvatar";
import { DropdownToggle, DropdownMenu, Dropdown, Badge } from "reactstrap";
import { Icon } from "@/components/Component";
import { LinkList, LinkItem } from "@/components/links/Links";
import { useTheme, useThemeUpdate } from "@/layout/provider/Theme";
import { useNotula } from "@/notula-context/NotulaContext";
import { useAuth } from "@/notula-context/AuthContext";
import { findUpper } from "@/utils/Utils";
import { useNavigate } from "react-router-dom";

const User = () => {
  const theme = useTheme();
  const themeUpdate = useThemeUpdate();
  const { meetings, questions } = useNotula();
  const { user, logout, isSuperAdmin, isModerator, isGuru } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((prevState) => !prevState);

  const activeRTL = questions.filter(
    (q) => q.status === "perlu" || q.status === "proses"
  ).length;

  const myQuestionsCount = user
    ? questions.filter((q) => q.user_id === user.id || q.penanya === user.nama).length
    : 0;

  const getRoleLabel = () => {
    if (isSuperAdmin) return { text: "Super Admin", color: "danger", icon: "shield-star" };
    if (isModerator) return { text: "Moderator / Notulen", color: "info", icon: "edit-alt" };
    return { text: "Guru", color: "success", icon: "user-check" };
  };

  const roleInfo = getRoleLabel();
  const initials = user ? findUpper(user.nama) || user.nama.slice(0, 2).toUpperCase() : "AP";

  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
    navigate("/login");
  };

  return (
    <Dropdown isOpen={open} className="user-dropdown" toggle={toggle}>
      <DropdownToggle
        tag="a"
        href="#toggle"
        className="dropdown-toggle"
        onClick={(ev) => {
          ev.preventDefault();
        }}
      >
        <div className="user-toggle">
          <UserAvatar
            text={initials}
            className={`sm bg-${roleInfo.color}`}
          />
          <div className="user-info d-none d-md-block ms-2">
            <span className="lead-text fs-12px mb-0">{user?.nama || "Pengguna"}</span>
            <span className={`badge badge-dot text-${roleInfo.color} fs-11px`}>
              {roleInfo.text}
            </span>
          </div>
        </div>
      </DropdownToggle>
      <DropdownMenu end className="dropdown-menu-md dropdown-menu-s1">
        <div className="dropdown-inner user-card-wrap bg-lighter">
          <div className="user-card sm">
            <div className={`user-avatar bg-${roleInfo.color}`}>
              <span>{initials}</span>
            </div>
            <div className="user-info">
              <span className="lead-text">{user?.nama || "Pengguna Notula"}</span>
              <span className="sub-text text-truncate" style={{ maxWidth: "190px" }}>
                {user?.email || "user@smkhassina.sch.id"}
              </span>
              <div className="mt-1">
                <span className={`badge badge-dim bg-${roleInfo.color} fs-10px px-1.5 py-0.5`}>
                  <Icon name={roleInfo.icon} className="me-1" />
                  {roleInfo.text}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="dropdown-inner user-account-info">
          <h6 className="overline-title-alt">Status Notulensi SMK Hassina</h6>
          {isGuru ? (
            <div>
              <div className="user-balance text-primary fs-16px">
                {myQuestionsCount} <small className="text-muted fs-12px">Pertanyaan Diajukan</small>
              </div>
              <div className="user-balance-sub text-soft fs-11px">
                {user?.unit || "Dewan Guru SMK Hassina"}
              </div>
            </div>
          ) : (
            <div>
              <div className="user-balance text-primary fs-18px">
                {meetings.length} <small className="text-muted fs-12px">Rapat Tercatat</small>
              </div>
              <div className="user-balance-sub text-warning">
                {activeRTL} Tindak Lanjut Aktif
              </div>
            </div>
          )}
        </div>

        <div className="dropdown-inner">
          <LinkList>
            {!isGuru && (
              <LinkItem link={"/"} icon="home" onClick={toggle}>
                Beranda Dashboard
              </LinkItem>
            )}
            <LinkItem link={"/rapat"} icon="calendar-booking" onClick={toggle}>
              Daftar Rapat Dinas
            </LinkItem>
            <LinkItem link={"/pertanyaan"} icon="help" onClick={toggle}>
              {isGuru ? "Pertanyaan Saya" : "Pertanyaan & RTL"}
            </LinkItem>
            {!isGuru && (
              <LinkItem link={"/rekap"} icon="reports" onClick={toggle}>
                Rekapitulasi Notula
              </LinkItem>
            )}
            <li>
              <a
                className={`dark-switch ${theme.skin === "dark" ? "active" : ""}`}
                href="#theme"
                onClick={(ev) => {
                  ev.preventDefault();
                  themeUpdate.skin(theme.skin === "dark" ? "light" : "dark");
                }}
              >
                {theme.skin === "dark" ? (
                  <>
                    <em className="icon ni ni-sun"></em>
                    <span>Mode Terang</span>
                  </>
                ) : (
                  <>
                    <em className="icon ni ni-moon"></em>
                    <span>Mode Gelap</span>
                  </>
                )}
              </a>
            </li>
          </LinkList>
        </div>

        <div className="dropdown-inner border-top">
          <LinkList>
            <li>
              <a href="#logout" className="text-danger" onClick={handleLogout}>
                <em className="icon ni ni-signout"></em>
                <span>Keluar (Logout)</span>
              </a>
            </li>
          </LinkList>
        </div>
      </DropdownMenu>
    </Dropdown>
  );
};

export default User;

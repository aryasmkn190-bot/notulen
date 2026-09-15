import React, { useState } from "react";
import UserAvatar from "@/components/user/UserAvatar";
import { DropdownToggle, DropdownMenu, Dropdown } from "reactstrap";
import { Icon } from "@/components/Component";
import { LinkList, LinkItem } from "@/components/links/Links";
import { useTheme, useThemeUpdate } from "@/layout/provider/Theme";
import { useNotula } from "@/notula-context/NotulaContext";

const User = () => {
  const theme = useTheme();
  const themeUpdate = useThemeUpdate();
  const { meetings, questions } = useNotula();
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((prevState) => !prevState);

  const activeRTL = questions.filter(
    (q) => q.status === "perlu" || q.status === "proses"
  ).length;

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
          <UserAvatar icon="user-alt" className="sm bg-primary" />
        </div>
      </DropdownToggle>
      <DropdownMenu end className="dropdown-menu-md dropdown-menu-s1">
        <div className="dropdown-inner user-card-wrap bg-lighter d-none d-md-block">
          <div className="user-card sm">
            <div className="user-avatar bg-primary">
              <span>AP</span>
            </div>
            <div className="user-info">
              <span className="lead-text">Arya Putra Perdana, S.Kom.</span>
              <span className="sub-text">aryaputra@smkhassina.sch.id</span>
            </div>
          </div>
        </div>
        <div className="dropdown-inner user-account-info">
          <h6 className="overline-title-alt">Status Notulensi SMK Hassina</h6>
          <div className="user-balance text-primary fs-18px">
            {meetings.length} <small className="text-muted fs-12px">Rapat Tercatat</small>
          </div>
          <div className="user-balance-sub text-warning">
            {activeRTL} Tindak Lanjut Aktif
          </div>
        </div>
        <div className="dropdown-inner">
          <LinkList>
            <LinkItem link={"/rapat"} icon="calendar-booking" onClick={toggle}>
              Daftar Rapat Dinas
            </LinkItem>
            <LinkItem link={"/pertanyaan"} icon="help" onClick={toggle}>
              Pertanyaan & RTL
            </LinkItem>
            <LinkItem link={"/rekap"} icon="reports" onClick={toggle}>
              Rekapitulasi Notula
            </LinkItem>
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
      </DropdownMenu>
    </Dropdown>
  );
};

export default User;

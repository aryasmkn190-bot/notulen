import React from "react";
import classNames from "classnames";
import Toggle from "../sidebar/Toggle";
import Logo from "../logo/Logo";
import Menu from "../menu/Menu";
import MenuMobile from "../menu/MenuMobile";
import User from "./dropdown/user/User";
import { useTheme, useThemeUpdate } from "@/layout/provider/Theme";

const Header = ({ fixed, className, menuData, ...props }) => {
  const theme = useTheme();
  const themeUpdate = useThemeUpdate();

  const headerClass = classNames({
    "nk-header is-regular": true,
    "nk-header-fixed": fixed,
    [`is-light`]: theme.header === "white",
    [`is-${theme.header}`]: theme.header !== "white" && theme.header !== "light",
    [`${className}`]: className,
  });

  return (
    <div className={headerClass}>
      <div className="container-fluid">
        <div className="nk-header-wrap">
          {/* Mobile Menu Trigger */}
          <div className="nk-menu-trigger d-lg-none">
            <Toggle
              className="nk-nav-toggle nk-quick-nav-icon"
              icon="menu"
              click={themeUpdate.sidebarVisibility}
            />
          </div>

          {/* Logo Brand */}
          <div className="nk-header-brand">
            <Logo />
          </div>

          {/* Navigation Menu */}
          <div
            className={`nk-header-menu ms-auto ${
              theme.sidebarMobile ? "mobile-menu" : ""
            } ${theme.sidebarVisibility ? "nk-header-active" : ""}`}
          >
            <div className="nk-header-mobile">
              <div className="nk-header-brand">
                <Logo />
              </div>
              <div className="nk-menu-trigger me-n2">
                <Toggle
                  className="nk-nav-toggle nk-quick-nav-icon"
                  icon="arrow-left"
                  click={themeUpdate.sidebarVisibility}
                />
              </div>
            </div>
            {theme.sidebarMobile ? (
              <MenuMobile data={menuData} ui="ui-s2" />
            ) : (
              <Menu data={menuData} ui="ui-s2" />
            )}
          </div>

          {/* Backdrop Overlay for Mobile Menu */}
          {theme.sidebarVisibility && (
            <div
              className="nk-header-overlay"
              onClick={themeUpdate.sidebarVisibility}
            ></div>
          )}

          {/* Header Tools */}
          <div className="nk-header-tools">
            <ul className="nk-quick-nav d-flex align-items-center">
              {/* User Dropdown Profile & Theme Toggle */}
              <li className="user-dropdown">
                <User />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;

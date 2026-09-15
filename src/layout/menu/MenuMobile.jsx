import React, { useEffect, useLayoutEffect, Fragment } from "react";
import classNames from "classnames";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Icon } from "@/components/Component";
import { slideUp, slideDown, getParents } from "@/utils/Utils";
import { useThemeUpdate } from "@/layout/provider/Theme";

const MenuMobile = ({ data, ui }) => {
  const themeUpdate = useThemeUpdate();
  const location = useLocation();

  let currentLink = function (selector) {
    let elm = document.querySelectorAll(selector);
    elm.forEach(function (item) {
      var activeRouterLink = item.classList.contains("active");
      if (activeRouterLink) {
        let parents = getParents(item, `.nk-menu`, "nk-menu-item");
        parents.forEach((parentElemets) => {
          parentElemets.classList.add("active", "current-page");
          let subItem = parentElemets.querySelector(`.nk-menu-wrap`);
          subItem !== null && (subItem.style.display = "block");
        });
      } else {
        item.parentElement.classList.remove("active", "current-page");
      }
    });
  };

  // Dropdown toggle
  let dropdownToggle = function (elm) {
    let parent = elm.parentElement;
    let nextelm = elm.nextElementSibling;
    if (!nextelm) return;
    let speed =
      nextelm.children.length > 5 ? 400 + nextelm.children.length * 10 : 400;
    if (!parent.classList.contains("active")) {
      parent.classList.add("active");
      slideDown(nextelm, speed);
    } else {
      parent.classList.remove("active");
      slideUp(nextelm, speed);
    }
  };

  // Dropdown close siblings
  let closeSiblings = function (elm) {
    let parent = elm.parentElement;
    let siblings = parent.parentElement.children;
    Array.from(siblings).forEach((item) => {
      if (item !== parent) {
        item.classList.remove("active");
        if (item.classList.contains("has-sub")) {
          let subitem = item.querySelectorAll(`.nk-menu-wrap`);
          subitem.forEach((child) => {
            child.parentElement.classList.remove("active");
            slideUp(child, 400);
          });
        }
      }
    });
  };

  let menuToggle = function (e) {
    e.preventDefault();
    let item = e.target.closest(`.nk-menu-toggle`);
    if (item) {
      dropdownToggle(item);
      closeSiblings(item);
    }
  };

  let routeChange = function () {
    currentLink(`.nk-menu-link`);
  };

  useLayoutEffect(() => {
    routeChange();
    if (themeUpdate && themeUpdate.sidebarHide) {
      themeUpdate.sidebarHide();
    }
  }, [location.pathname]);

  useEffect(() => {
    currentLink(`.nk-menu-link`);
  }, []);

  return (
    <ul className={classNames({ "nk-menu nk-menu-main": true, [`${ui}`]: ui })}>
      {(data || []).map((item, index) => (
        <li
          className={classNames({
            "nk-menu-item": true,
            "has-sub": item.subMenu,
          })}
          key={index}
        >
          {!item.subMenu ? (
            <NavLink
              to={item.link}
              className="nk-menu-link"
              target={item.newTab ? "_blank" : undefined}
              onClick={() => {
                if (themeUpdate && themeUpdate.sidebarHide) {
                  themeUpdate.sidebarHide();
                }
              }}
            >
              {item.icon && (
                <span className="nk-menu-icon me-2">
                  <Icon name={item.icon} />
                </span>
              )}
              <span className="nk-menu-text">{item.text}</span>
              {item.badge && (
                <span className="nk-menu-badge">{item.badge}</span>
              )}
            </NavLink>
          ) : (
            <>
              <a
                href="#menu"
                className="nk-menu-link nk-menu-toggle"
                onClick={menuToggle}
              >
                {item.icon && (
                  <span className="nk-menu-icon me-2">
                    <Icon name={item.icon} />
                  </span>
                )}
                <span className="nk-menu-text">{item.text}</span>
                {item.badge && (
                  <span className="nk-menu-badge">{item.badge}</span>
                )}
              </a>
              <div className="nk-menu-wrap">
                <ul className="nk-menu-sub">
                  {item.subMenu.map((sItem, sIndex) => (
                    <Fragment key={sIndex}>
                      {sItem.heading ? (
                        <li className="nk-menu-heading">
                          <h6 className="overline-title text-primary">
                            {sItem.heading}
                          </h6>
                        </li>
                      ) : (
                        <li
                          className={classNames({
                            "nk-menu-item": true,
                            "has-sub": sItem.subMenu,
                          })}
                        >
                          <NavLink
                            to={sItem.link}
                            className="nk-menu-link"
                            target={sItem.newTab ? "_blank" : undefined}
                            onClick={() => {
                              if (themeUpdate && themeUpdate.sidebarHide) {
                                themeUpdate.sidebarHide();
                              }
                            }}
                          >
                            <span className="nk-menu-text">{sItem.text}</span>
                            {sItem.badge && (
                              <span className="nk-menu-badge">
                                {sItem.badge}
                              </span>
                            )}
                          </NavLink>
                        </li>
                      )}
                    </Fragment>
                  ))}
                </ul>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
};

export default MenuMobile;

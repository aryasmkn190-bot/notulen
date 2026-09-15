import React, { useEffect, useLayoutEffect, Fragment } from "react";
import classNames from "classnames";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Icon } from "@/components/Component";
import { useThemeUpdate } from "@/layout/provider/Theme";

const Menu = ({ data, ui }) => {
  const themeUpdate = useThemeUpdate();
  const location = useLocation();

  let currentLink = function (selector) {
    let elm = document.querySelectorAll(selector);
    elm.forEach(function (item) {
      var activeRouterLink = item.classList.contains("active");
      if (activeRouterLink) {
        let parents = item.closest(".nk-menu-item");
        if (parents) {
          parents.classList.add("active", "current-page");
        }
      } else {
        if (item.parentElement) {
          item.parentElement.classList.remove("active", "current-page");
        }
      }
    });
  };

  useLayoutEffect(() => {
    currentLink(`.nk-menu-link`);
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
              end
            >
              {item.icon && (
                <span className="nk-menu-icon me-1">
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
              <a href="#toggle" className="nk-menu-link nk-menu-toggle">
                {item.icon && (
                  <span className="nk-menu-icon me-1">
                    <Icon name={item.icon} />
                  </span>
                )}
                <span className="nk-menu-text">{item.text}</span>
                {item.badge && (
                  <span className="nk-menu-badge">{item.badge}</span>
                )}
              </a>
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
                        >
                          <span className="nk-menu-text">{sItem.text}</span>
                        </NavLink>
                      </li>
                    )}
                  </Fragment>
                ))}
              </ul>
            </>
          )}
        </li>
      ))}
    </ul>
  );
};

export default Menu;

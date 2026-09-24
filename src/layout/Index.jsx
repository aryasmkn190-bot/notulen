import React, { useMemo } from "react";
import { Outlet } from "react-router-dom";
import defaultMenu from "./header/MenuData";
import Head from "./head/Head";
import Header from "./header/Header";
import Footer from "./footer/Footer";
import AppRoot from "./global/AppRoot";
import AppWrap from "./global/AppWrap";
import { useAuth } from "@/notula-context/AuthContext";

import FileManagerProvider from "@/pages/app/file-manager/components/Context";

const Layout = ({ title, ...props }) => {
  const { isGuru } = useAuth();

  const menuData = useMemo(() => {
    if (isGuru) {
      return [
        {
          text: "Daftar Rapat",
          link: "/rapat",
          icon: "calendar",
        },
        {
          text: "Pertanyaan Saya",
          link: "/pertanyaan",
          icon: "help",
        },
      ];
    }
    return defaultMenu;
  }, [isGuru]);

  return (
    <FileManagerProvider>
      <Head title={!title && "Loading"} />
      <AppRoot>
        <AppWrap>
          <Header menuData={menuData} fixed />
          <Outlet />
          <Footer />
        </AppWrap>
      </AppRoot>
    </FileManagerProvider>
  );
};

export default Layout;

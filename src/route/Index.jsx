import React, { useEffect } from "react";
import { Routes, Route, useLocation, BrowserRouter } from "react-router-dom";
import { NotulaProvider } from "@/notula-context/NotulaContext";

// Notula Pages
import DashboardNotula from "@/pages/notula/DashboardNotula";
import DaftarRapat from "@/pages/notula/DaftarRapat";
import DetailRapat from "@/pages/notula/DetailRapat";
import HistoriPertanyaan from "@/pages/notula/HistoriPertanyaan";
import RekapNotula from "@/pages/notula/RekapNotula";

// Original DashLite Components Preview
import Component from "@/pages/components/Index";
import Alerts from "@/pages/components/Alerts";
import Badges from "@/pages/components/Badges";
import Buttons from "@/pages/components/Buttons";
import Cards from "@/pages/components/Cards";
import Modals from "@/pages/components/Modals";
import Tabs from "@/pages/components/Tabs";
import Toast from "@/pages/components/Toast";
import FormElements from "@/pages/components/forms/FormElements";
import FormLayouts from "@/pages/components/forms/FormLayouts";
import BasicTable from "@/pages/components/table/BasicTable";
import DataTablePage from "@/pages/components/table/DataTable";
import ChartPage from "@/pages/components/charts/Charts";
import NioIconPage from "@/pages/components/crafted-icons/NioIcon";
import SVGIconPage from "@/pages/components/crafted-icons/SvgIcons";

import Error404Modern from "@/pages/error/404-modern";

import Layout from "@/layout/Index";
import LayoutNoSidebar from "@/layout/Index-nosidebar";
import ThemeProvider from "@/layout/provider/Theme";

const ScrollToTop = (props) => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return <>{props.children}</>;
};

const Pages = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ScrollToTop>
        <NotulaProvider>
          <Routes>
            <Route element={<ThemeProvider />}>
              <Route element={<Layout />}>
                {/* Core Notula Routes */}
                <Route index element={<DashboardNotula />} />
                <Route path="rapat" element={<DaftarRapat />} />
                <Route path="rapat/:id" element={<DetailRapat />} />
                <Route path="pertanyaan" element={<HistoriPertanyaan />} />
                <Route path="rekap" element={<RekapNotula />} />

                {/* DashLite Demo Components */}
                <Route path="components">
                  <Route index element={<Component />} />
                  <Route path="alerts" element={<Alerts />} />
                  <Route path="badges" element={<Badges />} />
                  <Route path="buttons" element={<Buttons />} />
                  <Route path="cards" element={<Cards />} />
                  <Route path="modals" element={<Modals />} />
                  <Route path="tabs" element={<Tabs />} />
                  <Route path="toast" element={<Toast />} />
                  <Route path="form-elements" element={<FormElements />} />
                  <Route path="form-layouts" element={<FormLayouts />} />
                </Route>
                <Route path="table-basic" element={<BasicTable />} />
                <Route path="table-datatable" element={<DataTablePage />} />
                <Route path="charts/chartjs" element={<ChartPage />} />
                <Route path="nioicon" element={<NioIconPage />} />
                <Route path="svg-icons" element={<SVGIconPage />} />
              </Route>

              <Route element={<LayoutNoSidebar />}>
                <Route path="*" element={<Error404Modern />} />
              </Route>
            </Route>
          </Routes>
        </NotulaProvider>
      </ScrollToTop>
    </BrowserRouter>
  );
};

export default Pages;

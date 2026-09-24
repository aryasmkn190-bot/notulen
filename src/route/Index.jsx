import React, { useEffect } from "react";
import { Routes, Route, useLocation, BrowserRouter, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/notula-context/AuthContext";
import { NotulaProvider } from "@/notula-context/NotulaContext";

// Auth & Notula Pages
import Login from "@/pages/auth/Login";
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
import { Spinner } from "reactstrap";

const ScrollToTop = (props) => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return <>{props.children}</>;
};

// Protected route checking active session
const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="text-center">
          <Spinner color="primary" />
          <p className="mt-2 text-soft fs-13px">Memuat sesi pengguna Notula...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Layout />;
};

// Role guard for Beranda (Guru is redirected to /rapat)
const HomeRouteGuard = () => {
  const { user } = useAuth();
  if (user?.role === "guru") {
    return <Navigate to="/rapat" replace />;
  }
  return <DashboardNotula />;
};

// Role guard for Rekap (Guru is redirected to /rapat)
const RekapRouteGuard = () => {
  const { user } = useAuth();
  if (user?.role === "guru") {
    return <Navigate to="/rapat" replace />;
  }
  return <RekapNotula />;
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
        <AuthProvider>
          <NotulaProvider>
            <Routes>
              <Route element={<ThemeProvider />}>
                {/* Public Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/auth-login" element={<Login />} />

                {/* Protected Application Routes */}
                <Route element={<ProtectedLayout />}>
                  <Route index element={<HomeRouteGuard />} />
                  <Route path="rapat" element={<DaftarRapat />} />
                  <Route path="rapat/:id" element={<DetailRapat />} />
                  <Route path="pertanyaan" element={<HistoriPertanyaan />} />
                  <Route path="rekap" element={<RekapRouteGuard />} />

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
        </AuthProvider>
      </ScrollToTop>
    </BrowserRouter>
  );
};

export default Pages;

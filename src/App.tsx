import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import ClickUpTasksTable from "./pages/Dashboard/ClickUpTasksTable";
import ClientBennyPage from "./pages/Dashboard/ClientBenny";
import ClientHuhmePage from "./pages/Dashboard/ClientHuhme";
import ClientVikingMortgagesPage from "./pages/Dashboard/ClientVikingMortgages";
import ClientFiveStayPage from "./pages/Dashboard/ClientFiveStay";
import ClientPhillisPage from "./pages/Dashboard/ClientPhillis";
import ClientFinanceConnectPage from "./pages/Dashboard/ClientFinanceConnect";
import ClientNorthernBeachesPage from "./pages/Dashboard/ClientNorthernBeaches";
import ClientTweedCoastPage from "./pages/Dashboard/ClientTweedCoast";
import ClientEldersPage from "./pages/Dashboard/ClientElders";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />
            <Route path="/clientbenny" element={<ClientBennyPage />} />
            <Route path="/clienthuhme" element={<ClientHuhmePage />} />
            <Route path="/clientvikingmortgages" element={<ClientVikingMortgagesPage />} />
            <Route path="/clientfivestay" element={<ClientFiveStayPage />} />
            <Route path="/clientphillis" element={<ClientPhillisPage />} />
            <Route path="/clientfinance" element={<ClientFinanceConnectPage />} />
            <Route path="/clientnorthernbeaches" element={<ClientNorthernBeachesPage />} />
            <Route path="/clienttweedcoast" element={<ClientTweedCoastPage />} />
            <Route path="/clientelders" element={<ClientEldersPage />} />
            <Route path="/clickup-tasks" element={<ClickUpTasksTable />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}

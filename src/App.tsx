import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import PageCollection from "@/pages/PageCollection";
import PaperMatching from "@/pages/PaperMatching";
import DamageAnnotation from "@/pages/DamageAnnotation";
import RestorationArchive from "@/pages/RestorationArchive";
import PaperLibrary from "@/pages/PaperLibrary";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/capture" element={<PageCollection />} />
          <Route path="/search" element={<PaperMatching />} />
          <Route path="/annotation" element={<DamageAnnotation />} />
          <Route path="/archive" element={<RestorationArchive />} />
          <Route path="/library" element={<PaperLibrary />} />
        </Route>
      </Routes>
    </Router>
  );
}

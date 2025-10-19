import { BrowserRouter, Routes, Route } from "react-router-dom";
import MindmapPage from "./pages/MindmapPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MindmapPage />} />
        <Route path="*" element={<MindmapPage />} />
      </Routes>
    </BrowserRouter>
  );
}

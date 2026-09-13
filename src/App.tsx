import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import AdminApp from './admin/AdminApp';
import AdminApp from './admin/AdminApp';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* أي حد يفتح الرابط الأساسي، نوجهه لصفحة الأدمن */}
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* كل صفحات الأدمن */}
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
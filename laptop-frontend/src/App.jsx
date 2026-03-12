import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Đường dẫn mặc định vào trang tìm kiếm laptop */}
        <Route path="/" element={<Home />} />
        {/* Đường dẫn hiển thị kết quả dựa trên sessionKey từ Backend */}
        <Route path="/dashboard/:sessionKey" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
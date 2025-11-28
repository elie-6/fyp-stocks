import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TickerPage from './pages/TickerPage'; 
import AllTickersPage from './pages/AllTickersPage'; 
import ContactUs from './pages/ContactUs'; 
import About from './pages/About';


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ticker/:ticker" element={<TickerPage />} />
        <Route path="/all-tickers" element={<AllTickersPage />} />
        <Route path="/contact" element={<ContactUs />} /> 
        <Route path="/about" element={<About />} /> 
      </Routes>
    </Router>
  );
}
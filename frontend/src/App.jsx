import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TickerPage from './pages/TickerPage'; // <-- new page for individual tickers
import AllTickersPage from './pages/AllTickersPage'; // <-- new page for all tickers
import ContactUs from './pages/ContactUs'; // <-- new Contact Us page
import About from './pages/About';


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ticker/:ticker" element={<TickerPage />} />
        <Route path="/all-tickers" element={<AllTickersPage />} />
        <Route path="/contact" element={<ContactUs />} /> {/* <-- new */}
        <Route path="/about" element={<About />} /> 
      </Routes>
    </Router>
  );
}
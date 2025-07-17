import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Clubs from './pages/Clubs';
import ClubDetail from './pages/ClubDetail';
import ClubJoinQR from './pages/ClubJoinQR';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ClubJoinPage from './pages/ClubJoinPage';
import EventCheckinPage from './pages/EventCheckinPage';
import EventCheckinQR from './pages/EventCheckinQR';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import Entry from './pages/Entry';
import RoleConfirm from './pages/RoleConfirm';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Entry point decides where to route */}
          <Route path="/" element={<Entry />} />
          <Route path="/welcome" element={<Welcome />} />
          
          {/* Club owner routes */}
          <Route path="/clubs" element={<Clubs />} />
          <Route path="/clubs/:clubId" element={<ClubDetail />} />
          <Route path="/clubs/:clubId/join-qr" element={<ClubJoinQR />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Member/Public routes */}
          <Route path="/join" element={<ClubJoinPage />} />
          <Route path="/join/:clubId" element={<ClubJoinPage />} />
          <Route path="/attend" element={<EventCheckinPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/role-confirm" element={<RoleConfirm />} />
          <Route path="/checkin/:inviteCode" element={<EventCheckinPage />} />
          <Route path="/events/:inviteCode/checkin-qr" element={<EventCheckinQR />} />
          
          {/* Fallback */}
          <Route path="*" element={<Entry />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

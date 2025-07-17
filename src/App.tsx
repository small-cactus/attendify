import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Clubs from './pages/Clubs';
import ClubDetail from './pages/ClubDetail';
import ClubJoinQR from './pages/ClubJoinQR';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ClubJoinPage from './pages/ClubJoinPage';
import EventCheckinPage from './pages/EventCheckinPage';
import EventCheckinQR from './pages/EventCheckinQR';
import CheckinCodePage from './pages/CheckinCodePage';
import HomeRoute from './pages/HomeRoute';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Redirect root based on whether the user is in a club */}
          <Route path="/" element={<HomeRoute />} />
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
          <Route path="/attend/:inviteCode" element={<EventCheckinPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/checkin" element={<CheckinCodePage />} />
          <Route path="/checkin/:inviteCode" element={<CheckinCodePage />} />
          <Route path="/events/:inviteCode/checkin-qr" element={<EventCheckinQR />} />
          
          {/* Fallback */}
          <Route path="*" element={<HomeRoute />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

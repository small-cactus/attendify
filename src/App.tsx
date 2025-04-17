import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Clubs from './pages/Clubs';
import ClubDetail from './pages/ClubDetail';
import ClubJoinQR from './pages/ClubJoinQR';
import Login from './pages/Login';
import Profile from './pages/Profile';
import JoinClub from './pages/JoinClub';
import JoinFlow from './pages/JoinFlow';
import AttendEvent from './pages/AttendEvent';
import Welcome from './pages/Welcome';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* New welcome page as the main entry point */}
          <Route path="/" element={<Welcome />} />
          
          {/* Club owner routes */}
          <Route path="/clubs" element={<Clubs />} />
          <Route path="/clubs/:clubId" element={<ClubDetail />} />
          <Route path="/clubs/:clubId/join-qr" element={<ClubJoinQR />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Member routes */}
          <Route path="/join-flow" element={<JoinFlow />} />
          <Route path="/join" element={<JoinClub />} />
          <Route path="/attend" element={<AttendEvent />} />
          
          {/* Fallback */}
          <Route path="*" element={<Welcome />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

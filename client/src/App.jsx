import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Board from './pages/Board';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Gantt from './pages/Gantt';
import Register from './pages/Register';
import MemberDashboard from './pages/MemberDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/projects" element={<Projects />} />
        <Route path="/admin/tasks" element={<Tasks />} />
        <Route path="/admin/board" element={<Board />} />
        <Route path="/admin/team" element={<Team />} />
        <Route path="/admin/analytics" element={<Analytics />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/gantt" element={<Gantt />} />
        <Route path="/member/dashboard" element={<MemberDashboard />} />
        <Route path="/member/projects" element={<Projects />} />
        <Route path="/member/tasks" element={<Tasks />} />
        <Route path="/member/board" element={<Board />} />
        <Route path="/member/team" element={<Team />} />
        <Route path="/member/analytics" element={<Analytics />} />
        <Route path="/member/settings" element={<Settings />} />
        <Route path="/member/gantt" element={<Gantt />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
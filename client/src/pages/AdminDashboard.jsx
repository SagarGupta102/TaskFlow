
import { useEffect, useState } from 'react';
import Logo from '../components/Logo';
import Sidebar from '../components/Sidebar';
import { getAnalyticsSummary } from '../services/api';
import './AdminDashboard.css';

function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('taskflow_user') || '{}');
  const [summary, setSummary] = useState(null);
  const [analyticsError, setAnalyticsError] = useState('');

  useEffect(() => {
    let active = true;

    async function fetchSummary() {
      try {
        const data = await getAnalyticsSummary();
        if (active) {
          setSummary(data.summary);
        }
      } catch (error) {
        if (active) {
          setAnalyticsError(error.message);
        }
      }
    }

    fetchSummary();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="admin-dashboard">
      <Sidebar />

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-brand">
            <Logo size={42} />
            <h1>TaskFlow</h1>
          </div>

          <div className="admin-profile">
            <div className="admin-avatar">
              {user.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <span>{user.name || 'Admin'}</span>
          </div>
        </header>

        <main className="dashboard-content">
          <section className="dashboard-welcome">
            <p className="dashboard-label">ADMIN WORKSPACE</p>
            <h2>Welcome back, {user.name || 'Admin'}!</h2>
            <p>
              Manage your projects, organize tasks, and keep your team
              moving forward.
            </p>
          </section>

          <section className="dashboard-stats">
            <div className="stat-card">
              <h3>Total Projects</h3>
              <p>{summary ? summary.totalProjects : '—'}</p>
            </div>

            <div className="stat-card">
              <h3>Team Members</h3>
              <p>{summary ? summary.totalMembers : '—'}</p>
            </div>

            <div className="stat-card">
              <h3>Total Tasks</h3>
              <p>{summary ? summary.totalTasks : '—'}</p>
            </div>

            <div className="stat-card">
              <h3>Completed Tasks</h3>
              <p>{summary ? summary.completedTasks : '—'}</p>
            </div>
          </section>

          {analyticsError && <p className="dashboard-analytics-error">{analyticsError}</p>}

          <section className="dashboard-placeholder">
            <h3>Your workspace is ready!</h3>
            <p>
              Your project activity and team progress will appear here
              as you start using TaskFlow.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;

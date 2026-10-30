import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import './Settings.css';

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('taskflow_user') || '{}');
  } catch {
    return {};
  }
}

function Settings() {
  const navigate = useNavigate();
  const [user] = useState(getStoredUser);
  const [theme, setTheme] = useState(() => localStorage.getItem('taskflow_theme') || 'light');

  function handleThemeChange(event) {
    const nextTheme = event.target.value;
    setTheme(nextTheme);
    localStorage.setItem('taskflow_theme', nextTheme);
  }

  function handleLogout() {
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
    navigate('/login', { replace: true });
  }

  return (
    <div className={`settings-page settings-${theme}`}>
      <WorkspaceLayout eyebrow="WORKSPACE" title="Settings">
        <div className="settings-intro">
          <p className="page-kicker">PREFERENCES</p>
          <h2>Manage your account.</h2>
          <p>Review your profile and choose how TaskFlow should feel on this device.</p>
        </div>

        <div className="settings-grid">
          <section className="settings-card" aria-labelledby="account-heading">
            <div className="settings-card-heading">
              <p className="page-kicker">ACCOUNT</p>
              <h3 id="account-heading">Account information</h3>
            </div>
            <dl className="account-details">
              <div>
                <dt>Name</dt>
                <dd>{user.name || 'Not available'}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{user.email || 'Not available'}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd className="role-value">{user.role || 'Not available'}</dd>
              </div>
            </dl>
          </section>

          <section className="settings-card" aria-labelledby="appearance-heading">
            <div className="settings-card-heading">
              <p className="page-kicker">INTERFACE</p>
              <h3 id="appearance-heading">Appearance</h3>
            </div>
            <label className="theme-field" htmlFor="theme-preference">
              Theme preference
              <select id="theme-preference" value={theme} onChange={handleThemeChange}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <p className="settings-note">This preference is saved on this device.</p>
          </section>
        </div>

        <section className="settings-card settings-account-action" aria-labelledby="session-heading">
          <div className="settings-card-heading">
            <p className="page-kicker">SESSION</p>
            <h3 id="session-heading">Sign out of TaskFlow</h3>
          </div>
          <p className="settings-note">Remove this device's saved authentication session.</p>
          <button className="logout-button" type="button" onClick={handleLogout}>
            Log out
          </button>
        </section>
      </WorkspaceLayout>
    </div>
  );
}

export default Settings;

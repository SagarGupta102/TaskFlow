import { NavLink } from 'react-router-dom';
import Logo from './Logo';
import './Sidebar.css';

const navigationItems = [
  { name: 'Dashboard', suffix: 'dashboard', icon: '▦' },
  { name: 'My Tasks', suffix: 'tasks', icon: '✓' },
  { name: 'Board', suffix: 'board', icon: '▤' },
  { name: 'Projects', suffix: 'projects', icon: '◫' },
  { name: 'Team', suffix: 'team', icon: '♧' },
  { name: 'Analytics', suffix: 'analytics', icon: '▥' },
  { name: 'Gantt Chart', suffix: 'gantt', icon: '▤' },
  { name: 'Settings', suffix: 'settings', icon: '⚙' },
];

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('taskflow_user') || '{}');
  } catch {
    return {};
  }
}

function Sidebar() {
  const user = getStoredUser();
  const basePath = user.role === 'member' ? '/member' : '/admin';
  const menuItems = navigationItems.map((item) => ({
    ...item,
    path: item.suffix ? `${basePath}/${item.suffix}` : item.path,
  }));

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Logo size={38} />
        <span>TaskFlow</span>
      </div>

      <p className="sidebar-section-title">WORKSPACE</p>

      <nav className="sidebar-navigation">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>TaskFlow</p>
        <span>Manage work. Achieve more.</span>
      </div>
    </aside>
  );
}

export default Sidebar;
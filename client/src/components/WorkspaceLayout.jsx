import { useState } from 'react';
import Logo from './Logo';
import Sidebar from './Sidebar';
import './WorkspaceLayout.css';

function WorkspaceLayout({ children, eyebrow, title, action }) {
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('taskflow_user') || '{}');
    } catch {
      return {};
    }
  });

  return (
    <div className="workspace-shell">
      <Sidebar />
      <div className="workspace-main">
        <header className="workspace-header">
          <div className="workspace-heading">
            <Logo size={42} />
            <div>
              <p>{eyebrow}</p>
              <h1>{title}</h1>
            </div>
          </div>
          <div className="workspace-profile">
            <div className="workspace-avatar">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span>{user.name || 'Workspace user'}</span>
            {action}
          </div>
        </header>
        <main className="workspace-content">{children}</main>
      </div>
    </div>
  );
}

export default WorkspaceLayout;

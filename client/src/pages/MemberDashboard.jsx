import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { getProjects, getTasks } from '../services/api';
import './MemberDashboard.css';

const statusLabels = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  completed: 'Completed',
};

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('taskflow_user') || '{}');
  } catch {
    return {};
  }
}

function formatDate(value) {
  if (!value) return 'No date';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function MemberDashboard() {
  const [user] = useState(getStoredUser);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function fetchOverview() {
      try {
        const [taskData, projectData] = await Promise.all([getTasks(), getProjects()]);
        if (active) {
          setTasks(taskData.tasks || []);
          setProjects(projectData.projects || []);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchOverview();

    return () => {
      active = false;
    };
  }, []);

  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const inProgressTasks = tasks.filter((task) => task.status === 'in-progress').length;
  const todoTasks = tasks.filter((task) => task.status === 'todo').length;
  const completionPercentage = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  const upcomingTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks
      .filter((task) => task.dueDate && task.status !== 'completed' && new Date(task.dueDate) >= today)
      .sort((first, second) => new Date(first.dueDate) - new Date(second.dueDate))
      .slice(0, 5);
  }, [tasks]);

  const recentTasks = useMemo(() => (
    [...tasks]
      .sort((first, second) => {
        const firstDate = first.updatedAt || first.createdAt || 0;
        const secondDate = second.updatedAt || second.createdAt || 0;
        return new Date(secondDate) - new Date(firstDate);
      })
      .slice(0, 5)
  ), [tasks]);

  return (
    <WorkspaceLayout eyebrow="MEMBER WORKSPACE" title="Dashboard">
      <div className="member-dashboard">
        <section className="member-welcome">
          <div>
            <p className="member-kicker">YOUR OVERVIEW</p>
            <h2>Welcome back, {user.name || 'Team Member'}.</h2>
            <p>Here is a focused view of the work assigned to you and the projects you support.</p>
          </div>
          <div className="member-progress-ring" aria-label={`${completionPercentage}% of assigned tasks completed`}>
            <strong>{completionPercentage}%</strong>
            <span>complete</span>
          </div>
        </section>

        {loading && <p className="member-state">Loading your workspace overview...</p>}
        {!loading && error && <p className="member-state member-error">{error}</p>}
        {!loading && !error && tasks.length === 0 && projects.length === 0 && (
          <section className="member-empty">
            <h3>Your workspace is ready for its first assignment.</h3>
            <p>Once a project or task is assigned to you, your progress and upcoming work will appear here.</p>
            <Link className="member-link-button" to="/member/projects">Explore projects</Link>
          </section>
        )}
        {!loading && !error && (tasks.length > 0 || projects.length > 0) && (
          <>
            <section className="member-stat-grid" aria-label="My task statistics">
              <div className="member-stat-card"><span>Assigned tasks</span><strong>{tasks.length}</strong></div>
              <div className="member-stat-card"><span>To Do</span><strong>{todoTasks}</strong></div>
              <div className="member-stat-card"><span>In Progress</span><strong>{inProgressTasks}</strong></div>
              <div className="member-stat-card"><span>Completed</span><strong>{completedTasks}</strong></div>
            </section>

            <section className="member-content-grid">
              <div className="member-panel">
                <div className="member-panel-heading">
                  <div>
                    <p className="member-kicker">PROJECTS</p>
                    <h3>Projects you belong to</h3>
                  </div>
                  <Link to="/member/projects">View all</Link>
                </div>
                {projects.length === 0 ? (
                  <p className="member-muted">No projects have been assigned to you yet.</p>
                ) : (
                  <div className="member-project-list">
                    {projects.slice(0, 5).map((project) => (
                      <div className="member-project-item" key={project._id}>
                        <div>
                          <strong>{project.name}</strong>
                          <span>{project.description || 'No description provided.'}</span>
                        </div>
                        <span className={`member-status member-status-${project.status}`}>{project.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="member-panel">
                <div className="member-panel-heading">
                  <div>
                    <p className="member-kicker">NEXT UP</p>
                    <h3>Upcoming deadlines</h3>
                  </div>
                  <Link to="/member/tasks">My Tasks</Link>
                </div>
                {upcomingTasks.length === 0 ? (
                  <p className="member-muted">No upcoming deadlines. You are all caught up.</p>
                ) : (
                  <div className="member-task-list">
                    {upcomingTasks.map((task) => (
                      <div className="member-task-item" key={task._id}>
                        <div>
                          <strong>{task.title}</strong>
                          <span>{task.project?.name || 'Workspace task'}</span>
                        </div>
                        <time dateTime={task.dueDate}>{formatDate(task.dueDate)}</time>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="member-panel member-recent-panel">
              <div className="member-panel-heading">
                <div>
                  <p className="member-kicker">RECENT ACTIVITY</p>
                  <h3>Recently assigned or updated</h3>
                </div>
                <Link to="/member/board">Open board</Link>
              </div>
              {recentTasks.length === 0 ? (
                <p className="member-muted">Recent task activity will appear here.</p>
              ) : (
                <div className="member-recent-list">
                  {recentTasks.map((task) => (
                    <div className="member-recent-item" key={task._id}>
                      <div>
                        <strong>{task.title}</strong>
                        <span>{task.project?.name || 'Workspace task'}</span>
                      </div>
                      <span className={`member-status member-status-${task.status}`}>
                        {statusLabels[task.status] || task.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <nav className="member-quick-links" aria-label="Member dashboard shortcuts">
              <Link to="/member/tasks"><strong>My Tasks</strong><span>Review assigned work</span></Link>
              <Link to="/member/board"><strong>Board</strong><span>See task progress</span></Link>
              <Link to="/member/projects"><strong>Projects</strong><span>Explore your projects</span></Link>
              <Link to="/member/gantt"><strong>Gantt Chart</strong><span>View project timelines</span></Link>
            </nav>
          </>
        )}
      </div>
    </WorkspaceLayout>
  );
}

export default MemberDashboard;

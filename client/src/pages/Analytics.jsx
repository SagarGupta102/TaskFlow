import { useEffect, useState } from 'react';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { getAnalyticsSummary } from '../services/api';
import './Analytics.css';

function Breakdown({ title, items, tone }) {
  const maximum = Math.max(...items.map((item) => item.count), 1);

  return (
    <section className="analytics-panel">
      <h3>{title}</h3>
      <div className="breakdown-list">
        {items.map((item) => (
          <div className="breakdown-row" key={item.name}>
            <div className="breakdown-label">
              <span>{item.name}</span>
              <strong>{item.count}</strong>
            </div>
            <div className="bar-track" aria-hidden="true">
              <span
                className={`bar-fill bar-${tone}`}
                style={{ width: `${(item.count / maximum) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Analytics() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function fetchSummary() {
      try {
        const data = await getAnalyticsSummary();
        if (active) {
          setSummary(data.summary);
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

    fetchSummary();

    return () => {
      active = false;
    };
  }, []);

  const hasData = summary && (summary.totalProjects > 0 || summary.totalTasks > 0);

  return (
    <WorkspaceLayout eyebrow="REPORTING" title="Analytics">
      <div className="page-intro analytics-intro">
        <div>
          <p className="page-kicker">WORKSPACE INSIGHTS</p>
          <h2>Understand the work in motion.</h2>
          <p>Track progress, priorities, and project health from one view.</p>
        </div>
        {summary && <span className="completion-badge">{summary.completionPercentage}% complete</span>}
      </div>

      {loading && <p className="state-message">Loading analytics...</p>}
      {!loading && error && <p className="state-message error-state">{error}</p>}
      {!loading && !error && !hasData && (
        <p className="state-message">Analytics will appear after projects and tasks are added.</p>
      )}
      {!loading && !error && hasData && (
        <>
          <section className="analytics-stat-grid" aria-label="Analytics summary">
            <div className="analytics-stat-card"><span>Total projects</span><strong>{summary.totalProjects}</strong></div>
            <div className="analytics-stat-card"><span>Total tasks</span><strong>{summary.totalTasks}</strong></div>
            <div className="analytics-stat-card"><span>Completed</span><strong>{summary.completedTasks}</strong></div>
            <div className="analytics-stat-card"><span>In progress</span><strong>{summary.inProgressTasks}</strong></div>
            <div className="analytics-stat-card"><span>To do</span><strong>{summary.todoTasks}</strong></div>
            <div className="analytics-stat-card"><span>Overdue</span><strong>{summary.overdueTasks}</strong></div>
          </section>

          <section className="analytics-panels">
            <Breakdown title="Tasks by status" items={summary.taskStatusBreakdown} tone="indigo" />
            <Breakdown title="Tasks by priority" items={summary.priorityBreakdown} tone="violet" />
            <Breakdown title="Projects by status" items={summary.projectStatusBreakdown} tone="green" />
          </section>
        </>
      )}
    </WorkspaceLayout>
  );
}

export default Analytics;

import { useEffect, useMemo, useState } from 'react';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { getGanttTimeline } from '../services/api';
import './Gantt.css';

const dayMilliseconds = 24 * 60 * 60 * 1000;

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(value) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getTaskDates(task) {
  const start = task.startDate || task.project?.startDate || task.dueDate;
  const end = task.dueDate || task.startDate || task.project?.dueDate || start;
  return { start, end };
}

function GanttBar({ row, rangeStart, rangeDays }) {
  if (!row.start || !row.end) {
    return <span className="timeline-not-set">Dates not set</span>;
  }

  const startOffset = Math.max(
    0,
    ((startOfDay(row.start) - rangeStart) / dayMilliseconds / rangeDays) * 100,
  );
  const endOffset = Math.max(
    startOffset + 1,
    ((startOfDay(row.end) - rangeStart) / dayMilliseconds / rangeDays) * 100,
  );
  const width = Math.min(100 - startOffset, endOffset - startOffset);

  return (
    <div
      className={`timeline-bar timeline-${row.kind} timeline-status-${row.status || 'planned'}`}
      style={{ left: `${startOffset}%`, width: `${Math.max(width, 1.5)}%` }}
      title={`${row.label}: ${formatDate(row.start)} - ${formatDate(row.end)}`}
    >
      <span>{row.kind === 'project' ? row.label : row.status}</span>
    </div>
  );
}

function Gantt() {
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function fetchTimeline() {
      try {
        const data = await getGanttTimeline();
        if (active) {
          setTimeline(data.timeline);
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

    fetchTimeline();

    return () => {
      active = false;
    };
  }, []);

  const projectRows = useMemo(
    () => (timeline?.projects || []).map((project) => ({
      id: `project-${project._id}`,
      kind: 'project',
      label: project.name,
      status: project.status,
      start: project.startDate,
      end: project.dueDate,
      detail: `${formatDate(project.startDate)} - ${formatDate(project.dueDate)}`,
    })),
    [timeline],
  );

  const taskRows = useMemo(
    () => (timeline?.tasks || []).map((task) => {
      const dates = getTaskDates(task);
      return {
        id: `task-${task._id}`,
        kind: 'task',
        label: task.title,
        status: task.status,
        priority: task.priority,
        assignee: task.assignee?.name || 'Unassigned',
        start: dates.start,
        end: dates.end,
        detail: `${formatDate(dates.start)} - ${formatDate(dates.end)}`,
      };
    }),
    [timeline],
  );

  const rows = [...projectRows, ...taskRows];
  const datedRows = rows.filter((row) => row.start || row.end);
  const rangeStart = datedRows.length
    ? startOfDay(new Date(Math.min(...datedRows.map((row) => new Date(row.start || row.end)))))
    : startOfDay(new Date());
  const rangeEnd = datedRows.length
    ? startOfDay(new Date(Math.max(...datedRows.map((row) => new Date(row.end || row.start)))))
    : new Date(rangeStart.getTime() + 14 * dayMilliseconds);
  const rangeDays = Math.max(1, Math.ceil((rangeEnd - rangeStart) / dayMilliseconds));
  const headerDays = Math.min(Math.max(rangeDays + 1, 7), 14);
  const headerStep = Math.max(1, Math.ceil((rangeDays + 1) / headerDays));
  const headerDates = Array.from({ length: headerDays }, (_, index) => new Date(rangeStart.getTime() + index * headerStep * dayMilliseconds));

  return (
    <WorkspaceLayout eyebrow="PLANNING" title="Gantt Chart">
      <div className="page-intro gantt-intro">
        <div>
          <p className="page-kicker">PROJECT TIMELINE</p>
          <h2>Plan the work across time.</h2>
          <p>Compare project deadlines and task progress in one timeline.</p>
        </div>
        {timeline && <span className="record-count">{rows.length} timeline items</span>}
      </div>

      {loading && <p className="state-message">Loading timeline...</p>}
      {!loading && error && <p className="state-message error-state">{error}</p>}
      {!loading && !error && rows.length === 0 && (
        <p className="state-message">No projects or tasks are available for this timeline.</p>
      )}
      {!loading && !error && rows.length > 0 && (
        <section className="gantt-panel" aria-label="Gantt timeline">
          <div className="gantt-legend">
            <span><i className="legend-swatch legend-project" />Projects</span>
            <span><i className="legend-swatch legend-task" />Tasks</span>
            <span>{formatDate(rangeStart)} - {formatDate(rangeEnd)}</span>
          </div>
          <div className="gantt-scroll">
            <div className="gantt-canvas">
              <div className="gantt-header-row">
                <div className="gantt-label-header">Timeline item</div>
                <div className="gantt-date-header" style={{ '--header-count': headerDates.length }}>
                  {headerDates.map((date) => <span key={date.toISOString()}>{formatDate(date)}</span>)}
                </div>
              </div>
              {rows.map((row, index) => (
                <div className={`gantt-row gantt-row-${row.kind}`} key={row.id}>
                  <div className="gantt-row-label">
                    <strong>{row.label}</strong>
                    <span>
                      {row.kind === 'task' ? `${row.priority} priority · ${row.assignee}` : row.status}
                    </span>
                    <small>{row.detail}</small>
                  </div>
                  <div className="gantt-track" style={{ '--row-index': index }}>
                    <GanttBar row={row} rangeStart={rangeStart} rangeDays={rangeDays} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </WorkspaceLayout>
  );
}

export default Gantt;

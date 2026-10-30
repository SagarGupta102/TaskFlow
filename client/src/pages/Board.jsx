import { useEffect, useState } from 'react';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { getTasks, updateTask } from '../services/api';
import './Board.css';

const columns = [
  { key: 'todo', label: 'To Do' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

const statuses = columns.map((column) => column.key);

function Board() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  useEffect(() => {
    let active = true;

    async function fetchTasks() {
      try {
        const data = await getTasks();
        if (active) {
          setTasks(data.tasks || []);
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

    fetchTasks();

    return () => {
      active = false;
    };
  }, []);

  async function changeStatus(taskId, status) {
    setUpdatingId(taskId);
    setError('');

    try {
      const data = await updateTask(taskId, { status });
      setTasks(tasks.map((task) => (task._id === taskId ? data.task : task)));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingId('');
    }
  }

  return (
    <WorkspaceLayout eyebrow="WORKFLOW" title="Board">
      <div className="page-intro board-intro">
        <div>
          <p className="page-kicker">KANBAN WORKFLOW</p>
          <h2>See the work at a glance.</h2>
          <p>Move each task through the workflow as progress changes.</p>
        </div>
        <span className="record-count">{tasks.length} tasks</span>
      </div>

      {loading && <p className="state-message">Loading board...</p>}
      {!loading && error && <p className="state-message error-state">{error}</p>}
      {!loading && !error && (
        <section className="board-grid" aria-label="Kanban board">
          {columns.map((column) => {
            const columnTasks = tasks.filter((task) => task.status === column.key);

            return (
              <div className="board-column" key={column.key}>
                <div className="board-column-heading">
                  <h3>{column.label}</h3>
                  <span>{columnTasks.length}</span>
                </div>
                <div className="board-column-tasks">
                  {columnTasks.length === 0 && <p className="column-empty">No tasks here.</p>}
                  {columnTasks.map((task) => (
                    <article className="board-task-card" key={task._id}>
                      <div className="board-task-topline">
                        <span className={`priority-pill priority-${task.priority}`}>{task.priority}</span>
                        <span>{task.project?.name || 'No project'}</span>
                      </div>
                      <h4>{task.title}</h4>
                      <p>{task.description || 'No description provided.'}</p>
                      <div className="board-task-footer">
                        <span>{task.assignee?.name || 'Unassigned'}</span>
                        <select
                          aria-label={`Update status for ${task.title}`}
                          value={task.status}
                          disabled={updatingId === task._id}
                          onChange={(event) => changeStatus(task._id, event.target.value)}
                        >
                          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </WorkspaceLayout>
  );
}

export default Board;

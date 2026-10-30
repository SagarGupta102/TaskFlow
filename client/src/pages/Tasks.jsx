import { useEffect, useState } from 'react';
import WorkspaceLayout from '../components/WorkspaceLayout';
import TaskComments from '../components/TaskComments';
import {
  createTask,
  deleteTask,
  getProjects,
  getTeamMembers,
  getTasks,
  updateTask,
} from '../services/api';
import './Tasks.css';

const initialForm = {
  title: '',
  description: '',
  priority: 'medium',
  startDate: '',
  dueDate: '',
  project: '',
  assignee: '',
};

const statuses = ['todo', 'in-progress', 'completed'];

function formatDate(value) {
  if (!value) return 'No due date';
  return new Date(value).toLocaleDateString();
}

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('taskflow_user') || '{}');
    } catch {
      return {};
    }
  });

  const isAdmin = user.role === 'admin';

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        const [taskData, projectData, memberData] = await Promise.all([
          getTasks(),
          getProjects(),
          getTeamMembers(),
        ]);
        if (active) {
          setTasks(taskData.tasks || []);
          setProjects(projectData.projects || []);
          setMembers(memberData.members || []);
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

    fetchData();

    return () => {
      active = false;
    };
  }, []);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');

    try {
      const data = await createTask({
        ...form,
        startDate: form.startDate || undefined,
        dueDate: form.dueDate || undefined,
        assignee: form.assignee || undefined,
      });
      setTasks([data.task, ...tasks]);
      setForm(initialForm);
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function beginEdit(task) {
    setEditingTask({
      id: task._id,
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      startDate: task.startDate ? task.startDate.slice(0, 10) : '',
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      project: task.project?._id || '',
      assignee: task.assignee?._id || '',
    });
    setFormError('');
  }

  async function handleEdit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');

    try {
      const { id, ...updates } = editingTask;
      const data = await updateTask(id, {
        ...updates,
        startDate: updates.startDate || undefined,
        dueDate: updates.dueDate || undefined,
        assignee: updates.assignee || null,
      });
      setTasks(tasks.map((task) => (task._id === id ? data.task : task)));
      setEditingTask(null);
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(taskId) {
    setFormError('');

    try {
      await deleteTask(taskId);
      setTasks(tasks.filter((task) => task._id !== taskId));
    } catch (requestError) {
      setFormError(requestError.message);
    }
  }

  async function handleStatusChange(taskId, status) {
    try {
      const data = await updateTask(taskId, { status });
      setTasks(tasks.map((task) => (task._id === taskId ? data.task : task)));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <WorkspaceLayout eyebrow="WORKSPACE" title="My Tasks">
      <div className="page-intro task-intro">
        <div>
          <p className="page-kicker">TASK TRACKER</p>
          <h2>{isAdmin ? 'Coordinate the work.' : 'Focus on your work.'}</h2>
          <p>{isAdmin ? 'Create, assign, and maintain every workspace task.' : 'Update the progress of tasks assigned to you.'}</p>
        </div>
        <span className="record-count">{tasks.length} tasks</span>
      </div>

      {isAdmin && (
        <section className="form-panel">
          <div className="section-heading">
            <div>
              <p className="page-kicker">ADMIN ACTION</p>
              <h3>Create a task</h3>
            </div>
          </div>
          <form className="task-form" onSubmit={handleCreate}>
            <label>
              Task title
              <input name="title" value={form.title} onChange={updateField} required />
            </label>
            <label>
              Project
              <select name="project" value={form.project} onChange={updateField} required>
                <option value="">Select a project</option>
                {projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}
              </select>
            </label>
            <label>
              Priority
              <select name="priority" value={form.priority} onChange={updateField}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>
              Start date
              <input name="startDate" type="date" value={form.startDate} onChange={updateField} />
            </label>
            <label>
              Due date
              <input name="dueDate" type="date" value={form.dueDate} onChange={updateField} />
            </label>
            <label className="field-wide">
              Assignee <span className="label-note">Optional</span>
              <select name="assignee" value={form.assignee} onChange={updateField}>
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
            </label>
            <label className="field-wide">
              Description
              <textarea name="description" rows="3" value={form.description} onChange={updateField} />
            </label>
            {formError && <p className="inline-error field-wide">{formError}</p>}
            <button className={`primary-button${saving ? ' is-loading' : ''}`} type="submit" disabled={saving || projects.length === 0}>
              {saving ? 'Creating...' : 'Create task'}
            </button>
          </form>
          {projects.length === 0 && <p className="form-note">Create a project before creating a task.</p>}
          {projects.length > 0 && members.length === 0 && (
            <p className="form-note">No active workspace members are available. This task will remain unassigned.</p>
          )}
        </section>
      )}

      {loading && <p className="state-message">Loading tasks...</p>}
      {!loading && error && <p className="state-message error-state">{error}</p>}
      {!loading && !error && tasks.length === 0 && <p className="state-message">No tasks are available yet.</p>}
      {!loading && !error && tasks.length > 0 && (
        <section className="task-list" aria-label="Tasks">
          {tasks.map((task) => (
            <article className="task-row" key={task._id}>
              {editingTask?.id === task._id ? (
                <form className="task-edit-form" onSubmit={handleEdit}>
                  <label>
                    Title
                    <input value={editingTask.title} onChange={(event) => setEditingTask({ ...editingTask, title: event.target.value })} required />
                  </label>
                  <label>
                    Project
                    <select value={editingTask.project} onChange={(event) => setEditingTask({ ...editingTask, project: event.target.value })} required>
                      {projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}
                    </select>
                  </label>
                  <label>
                    Status
                    <select value={editingTask.status} onChange={(event) => setEditingTask({ ...editingTask, status: event.target.value })}>
                      {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </label>
                  <label>
                    Priority
                    <select value={editingTask.priority} onChange={(event) => setEditingTask({ ...editingTask, priority: event.target.value })}>
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                    </select>
                  </label>
                  <label>
                    Start date
                    <input type="date" value={editingTask.startDate} onChange={(event) => setEditingTask({ ...editingTask, startDate: event.target.value })} />
                  </label>
                  <label>
                    Due date
                    <input type="date" value={editingTask.dueDate} onChange={(event) => setEditingTask({ ...editingTask, dueDate: event.target.value })} />
                  </label>
                  <label>
                    Assignee
                    <select value={editingTask.assignee} onChange={(event) => setEditingTask({ ...editingTask, assignee: event.target.value })}>
                      <option value="">Unassigned</option>
                      {members.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name} ({member.role})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field-wide">
                    Description
                    <textarea rows="2" value={editingTask.description} onChange={(event) => setEditingTask({ ...editingTask, description: event.target.value })} />
                  </label>
                  {formError && <p className="inline-error field-wide">{formError}</p>}
                  <div className="task-actions field-wide">
                    <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
                    <button className="secondary-button" type="button" onClick={() => setEditingTask(null)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="task-row-top">
                    <div className="task-main">
                      <div className="task-title-line">
                        <h3>{task.title}</h3>
                        <span className={`priority-pill priority-${task.priority}`}>{task.priority}</span>
                      </div>
                      <p>{task.description || 'No description provided.'}</p>
                      <div className="task-meta">
                        <span>{task.project?.name || 'Project unavailable'}</span>
                        <span>Due {formatDate(task.dueDate)}</span>
                        <span>{task.assignee?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                    <div className="task-controls">
                      {isAdmin ? (
                        <>
                          <span className={`status-pill status-${task.status}`}>{task.status}</span>
                          <button className="text-button" type="button" onClick={() => beginEdit(task)}>Edit</button>
                          <button className="danger-button" type="button" onClick={() => handleDelete(task._id)}>Delete</button>
                        </>
                      ) : (
                        <label className="status-control">
                          Status
                          <select value={task.status} onChange={(event) => handleStatusChange(task._id, event.target.value)}>
                            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                        </label>
                      )}
                    </div>
                  </div>
                  <TaskComments taskId={task._id} />
                </>
              )}
            </article>
          ))}
        </section>
      )}
    </WorkspaceLayout>
  );
}

export default Tasks;

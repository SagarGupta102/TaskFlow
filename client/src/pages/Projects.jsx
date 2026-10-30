import { useEffect, useState } from 'react';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { createProject, getProjects } from '../services/api';
import './Projects.css';

const initialForm = {
  name: '',
  description: '',
  status: 'planned',
  startDate: '',
  dueDate: '',
};

function formatDate(value) {
  if (!value) return 'No due date';
  return new Date(value).toLocaleDateString();
}

function Projects() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(initialForm);
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

  const canCreate = user.role === 'admin';

  useEffect(() => {
    let active = true;

    async function fetchProjects() {
      try {
        const data = await getProjects();
        if (active) {
          setProjects(data.projects || []);
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

    fetchProjects();

    return () => {
      active = false;
    };
  }, []);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');

    try {
      const data = await createProject({
        ...form,
        startDate: form.startDate || undefined,
        dueDate: form.dueDate || undefined,
      });
      setProjects([data.project, ...projects]);
      setForm(initialForm);
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspaceLayout eyebrow="WORKSPACE" title="Projects">
      <div className="page-intro">
        <div>
          <p className="page-kicker">PROJECT PORTFOLIO</p>
          <h2>Keep every initiative moving.</h2>
          <p>Review projects in your workspace and track their delivery dates.</p>
        </div>
        <span className="record-count">{projects.length} projects</span>
      </div>

      {canCreate && (
        <section className="form-panel">
          <div className="section-heading">
            <div>
              <p className="page-kicker">ADMIN ACTION</p>
              <h3>Create a project</h3>
            </div>
          </div>
          <form className="project-form" onSubmit={handleSubmit}>
            <label>
              Project name
              <input name="name" value={form.name} onChange={updateField} required />
            </label>
            <label>
              Status
              <select name="status" value={form.status} onChange={updateField}>
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
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
              Description
              <textarea name="description" rows="3" value={form.description} onChange={updateField} />
            </label>
            {formError && <p className="inline-error field-wide">{formError}</p>}
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create project'}
            </button>
          </form>
        </section>
      )}

      {loading && <p className="state-message">Loading projects...</p>}
      {!loading && error && <p className="state-message error-state">{error}</p>}
      {!loading && !error && projects.length === 0 && (
        <p className="state-message">No projects are available yet.</p>
      )}
      {!loading && !error && projects.length > 0 && (
        <section className="project-grid" aria-label="Projects">
          {projects.map((project) => (
            <article className="project-card" key={project._id}>
              <div className="project-card-topline">
                <span className={`status-pill status-${project.status}`}>{project.status}</span>
                <span className="project-date">Due {formatDate(project.dueDate)}</span>
              </div>
              <h3>{project.name}</h3>
              <p>{project.description || 'No description provided.'}</p>
              <div className="project-card-footer">
                <span>{project.members?.length || 0} members</span>
                <span>{project.createdBy?.name || 'Workspace project'}</span>
              </div>
            </article>
          ))}
        </section>
      )}
    </WorkspaceLayout>
  );
}

export default Projects;

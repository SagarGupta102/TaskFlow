import { useEffect, useState } from 'react';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { getTeamMembers } from '../services/api';
import './Team.css';

function Team() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function fetchMembers() {
      try {
        const data = await getTeamMembers();
        if (active) {
          setMembers(data.members || []);
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

    fetchMembers();

    return () => {
      active = false;
    };
  }, []);

  return (
    <WorkspaceLayout eyebrow="WORKSPACE" title="Team">
      <div className="page-intro team-intro">
        <div>
          <p className="page-kicker">WORKSPACE MEMBERS</p>
          <h2>Work better together.</h2>
          <p>View the active people working in your TaskFlow workspace.</p>
        </div>
        <span className="record-count">{members.length} members</span>
      </div>

      {loading && <p className="state-message">Loading team members...</p>}
      {!loading && error && <p className="state-message error-state">{error}</p>}
      {!loading && !error && members.length === 0 && (
        <p className="state-message">No active workspace members were found.</p>
      )}
      {!loading && !error && members.length > 0 && (
        <section className="team-table-wrap" aria-label="Workspace members">
          <table className="team-table">
            <thead>
              <tr>
                <th scope="col">Member</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member._id}>
                  <td>
                    <div className="team-member-name">
                      <span className="team-avatar">{member.name?.charAt(0).toUpperCase() || 'U'}</span>
                      <span>{member.name}</span>
                    </div>
                  </td>
                  <td>{member.email}</td>
                  <td><span className={`role-pill role-${member.role}`}>{member.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </WorkspaceLayout>
  );
}

export default Team;

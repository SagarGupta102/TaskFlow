import { useEffect, useState } from 'react';
import { createTaskComment, getTaskComments } from '../services/api';
import './TaskComments.css';

function formatCommentDate(value) {
  return new Date(value).toLocaleString();
}

function TaskComments({ taskId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;

    let active = true;

    async function fetchComments() {
      setLoading(true);
      setError('');

      try {
        const data = await getTaskComments(taskId);
        if (active) {
          setComments(data.comments || []);
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

    fetchComments();

    return () => {
      active = false;
    };
  }, [isOpen, taskId]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      await createTaskComment(taskId, content.trim());
      const data = await getTaskComments(taskId);
      setComments(data.comments || []);
      setContent('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="task-comments">
      <button
        className="comment-toggle"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {isOpen ? 'Hide comments' : 'View comments'}
      </button>

      {isOpen && (
        <div className="comment-panel">
          {loading && <p className="comment-state">Loading comments...</p>}
          {!loading && error && <p className="comment-error">{error}</p>}
          {!loading && !error && comments.length === 0 && (
            <p className="comment-state">No comments yet.</p>
          )}
          {!loading && comments.length > 0 && (
            <div className="comment-list">
              {comments.map((comment) => (
                <div className="comment-item" key={comment.id}>
                  <div className="comment-meta">
                    <strong>{comment.author.name}</strong>
                    <time dateTime={comment.createdAt}>{formatCommentDate(comment.createdAt)}</time>
                  </div>
                  <p>{comment.content}</p>
                </div>
              ))}
            </div>
          )}

          <form className="comment-form" onSubmit={handleSubmit}>
            <label htmlFor={`comment-${taskId}`}>Add a comment</label>
            <textarea
              id={`comment-${taskId}`}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Share an update with the team"
              rows="2"
              disabled={submitting}
            />
            <button
              className="comment-submit"
              type="submit"
              disabled={submitting || !content.trim()}
            >
              {submitting ? 'Posting...' : 'Post comment'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default TaskComments;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { registerUser } from '../services/api';
import './Login.css';
import './Register.css';

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await registerUser(name.trim(), email.trim(), password);
      navigate('/login', {
        replace: true,
        state: { successMessage: 'Registration successful. Please log in.' },
      });
    } catch (requestError) {
      setError(requestError.message || 'Unable to register. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page register-page">
      <div className="login-card">
        <div className="login-brand">
          <Logo size={52} />
          <h1>TaskFlow</h1>
          <p>Manage your work. Achieve more.</p>
        </div>

        <div className="login-heading">
          <h2>Create your account</h2>
          <p>Join your existing TaskFlow workspace as a team member.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="register-name">Full name</label>
          <input
            id="register-name"
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />

          <label htmlFor="confirm-password">Confirm password</label>
          <input
            id="confirm-password"
            type="password"
            placeholder="Enter your password again"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            required
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;

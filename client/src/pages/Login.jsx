import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Logo from '../components/Logo';
import { loginUser } from '../services/api';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [success] = useState(location.state?.successMessage || '');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginUser(email, password);

      localStorage.setItem('taskflow_token', data.token);
localStorage.setItem('taskflow_user', JSON.stringify(data.user));

if (data.user.role === 'admin') {
  navigate('/admin/dashboard');
} else {
  navigate('/member/dashboard');
}

      alert(`Welcome to TaskFlow, ${data.user.name}!`);
    } catch (err) {
      setError(err.message || 'Unable to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <Logo size={52} />
          <h1>TaskFlow</h1>
          <p>Manage your work. Achieve more.</p>
        </div>

        <div className="login-heading">
          <h2>Welcome back</h2>
          <p>Sign in to continue to your workspace.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <div className="password-input-wrapper">
  <input
    id="password"
    type={showPassword ? 'text' : 'password'}
    placeholder="Enter your password"
    value={password}
    onChange={(event) => setPassword(event.target.value)}
    required
  />

  <button
  type="button"
  className="password-toggle"
  onClick={() => setShowPassword(!showPassword)}
  aria-label={showPassword ? 'Hide password' : 'Show password'}
>
  {showPassword ? '👁️' : '🙈'}
</button>
</div>

          {error && <p className="login-error">{error}</p>}
          {success && <p className="login-success">{success}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account? <Link to="/register">Register here</Link>
        </p>

        <p className="login-footer">
          Secure workspace access powered by TaskFlow.
        </p>
      </div>
    </div>
  );
}

export default Login;

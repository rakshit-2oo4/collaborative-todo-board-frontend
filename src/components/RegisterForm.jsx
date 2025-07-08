import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Form.css';

function RegisterForm({ onRegisterSuccess, onNavigateToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    const result = await register(email, password); 
    setLoading(false);

    if (result.success) {
      setSuccess(result.message || 'Registration successful! Please log in.');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        if (onRegisterSuccess) {
          onRegisterSuccess();
        }
      }, 2000);
    } else {
      setError(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="form-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className="form">
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <div className="form-group">
          <label htmlFor="register-email">Email:</label>
          <input
            type="email"
            id="register-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="register-password">Password:</label>
          <input
            type="password"
            id="register-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirm-password">Confirm Password:</label>
          <input
            type="password"
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p>
        Already have an account?{' '}
        <button className="link-button" onClick={onNavigateToLogin} disabled={loading}>
          Login
        </button>
      </p>
    </div>
  );
}

export default RegisterForm;
// src/SignUp.js
import React, { useState } from 'react';
import axios from 'axios';
import './SignUp.css';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleRepeatPasswordChange = (e) => {
    setRepeatPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (password !== repeatPassword) {
      setError('Passwords do not match!');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/signup', {
        email,
        password,
      });

      setMessage(response.data.message);
      setEmail('');
      setPassword('');
      setRepeatPassword('');
    } catch (err) {
      setError(
        err.response?.data?.error || 'An error occurred while signing up.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <h1>Sign Up</h1>
      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter your email"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Enter your password"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="repeat-password">Repeat Password</label>
          <input
            type="password"
            id="repeat-password"
            value={repeatPassword}
            onChange={handleRepeatPasswordChange}
            placeholder="Repeat your password"
            required
          />
        </div>
        <button type="submit" className="signup-button" disabled={loading}>
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="federated-signup">
        <p>Or sign up with:</p>
        <div className="social-icons">
          <button className="social-button linkedin">LinkedIn</button>
          <button className="social-button github">GitHub</button>
          <button className="social-button google">Google</button>
          <button className="social-button apple">Apple</button>
          <button className="social-button facebook">Facebook</button>
        </div>
      </div>
    </div>
  );
}

export default SignUp;

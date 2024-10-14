import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import awsExports from './aws-exports'; // Make sure aws-exports.js is correctly configured for your Cognito

const Login = () => {  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const client = new CognitoIdentityProviderClient({ region: awsExports.aws_project_region });
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: awsExports.aws_user_pools_web_client_id,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });

    try {
      const response = await client.send(command);
      console.log('Login successful:', response);

      // Store tokens in localStorage
      localStorage.setItem('idToken', response.AuthenticationResult.IdToken);
      localStorage.setItem('accessToken', response.AuthenticationResult.AccessToken);
      localStorage.setItem('refreshToken', response.AuthenticationResult.RefreshToken);

      // Manually trigger the storage event to notify other components (e.g., Navbar)
      window.dispatchEvent(new Event('storage'));

      // Redirect to homepage after successful login
      navigate('/');
    } catch (err) {
      console.error('Error during login:', err);
      setError(err.message || 'Error during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1>Login</h1>
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default Login;

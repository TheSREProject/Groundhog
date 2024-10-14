import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CognitoIdentityProviderClient, SignUpCommand, ConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import awsmobile from './aws-exports';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [storedEmail, setStoredEmail] = useState('');
  const navigate = useNavigate();

  // Create a new Cognito Identity Provider client
  const client = new CognitoIdentityProviderClient({ region: awsmobile.aws_project_region });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (isVerifying) {
      // Confirm the verification code
      const params = {
        ClientId: awsmobile.aws_user_pools_web_client_id,
        Username: storedEmail,
        ConfirmationCode: verificationCode,
      };

      try {
        const command = new ConfirmSignUpCommand(params);
        const response = await client.send(command);
        console.log('User confirmed successfully:', response);
        setSuccess(true);
        navigate('/login');
      } catch (err) {
        setError(err.message || 'Error during verification');
      }
    } else {
      // Register the user
      const params = {
        ClientId: awsmobile.aws_user_pools_web_client_id,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'name', Value: name },
        ],
      };

      try {
        const command = new SignUpCommand(params);
        const response = await client.send(command);
        console.log('Registration successful:', response);
        setStoredEmail(email);
        setIsVerifying(true);
      } catch (err) {
        setError(err.message || 'Error during registration');
      }
    }
  };

  return (
    <div className="register-container">
      <h1>{isVerifying ? 'Verify Account' : 'Register'}</h1>
      {success ? (
        <p>Registration successful! You can now log in.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          {!isVerifying ? (
            <>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit">Register</button>
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="Verification Code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />
              <button type="submit">Verify</button>
            </>
          )}
        </form>
      )}
      {error && <p>{error}</p>}
    </div>
  );
}

export default Register;

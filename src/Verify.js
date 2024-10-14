import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CognitoIdentityProviderClient, ConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import awsmobile from './aws-exports';

function Verify() {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Create a new Cognito Identity Provider client
  const client = new CognitoIdentityProviderClient({ region: awsmobile.aws_project_region });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const params = {
      ClientId: awsmobile.aws_user_pools_web_client_id,
      Username: email,
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
  };

  return (
    <div className="verify-container">
      <h1>Verify Account</h1>
      {success ? (
        <p>Verification successful! You can now log in.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Verification Code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            required
          />
          <button type="submit">Verify</button>
        </form>
      )}
      {error && <p>{error}</p>}
    </div>
  );
}

export default Verify;

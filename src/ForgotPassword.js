import React, { useState } from 'react';
import { CognitoIdentityProviderClient, ForgotPasswordCommand, ConfirmForgotPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import awsmobile from './aws-exports';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1 for entering email, 2 for verifying code
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const client = new CognitoIdentityProviderClient({ region: awsmobile.aws_project_region });

  // Step 1: Initiate forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const command = new ForgotPasswordCommand({
        ClientId: awsmobile.aws_user_pools_web_client_id,
        Username: email,
      });
      await client.send(command);
      setStep(2); // Move to step 2 for verification
    } catch (err) {
      setError(err.message || 'Error initiating password reset');
    }
  };

  // Step 2: Confirm password reset
  const handleConfirmForgotPassword = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: awsmobile.aws_user_pools_web_client_id,
        Username: email,
        ConfirmationCode: verificationCode,
        Password: newPassword,
      });
      await client.send(command);
      setSuccess(true); // Mark success when password is reset
    } catch (err) {
      setError(err.message || 'Error confirming password reset');
    }
  };

  return (
    <div className="forgot-password-container">
      <h1>Forgot Password</h1>
      {success ? (
        <p>Password reset successful! You can now log in with your new password.</p>
      ) : (
        <>
          {step === 1 ? (
            <form onSubmit={handleForgotPassword}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit">Send Verification Code</button>
            </form>
          ) : (
            <form onSubmit={handleConfirmForgotPassword}>
              <input
                type="text"
                placeholder="Enter Verification Code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Enter New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button type="submit">Reset Password</button>
            </form>
          )}
          {error && <p className="error-message">{error}</p>}
        </>
      )}
    </div>
  );
}

export default ForgotPassword;

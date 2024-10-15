import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { CognitoIdentityProviderClient, GetUserCommand, UpdateUserAttributesCommand, ChangePasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import zxcvbn from 'zxcvbn'; // Import zxcvbn for password strength check
import awsExports from './aws-exports';
import './Account.css';

function Account() {
  const [accountData, setAccountData] = useState({
    id: '',
    name: '',
    email: '', // Non-editable
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  // Password-related states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(null); // Password strength state

  // Edit mode for the name field
  const [editName, setEditName] = useState(false);

  // AWS Cognito client
  const client = useMemo(() => new CognitoIdentityProviderClient({ region: awsExports.aws_project_region }), []);

  // Fetch account data from Cognito
  const fetchAccountData = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setError('No token found. Please log in.');
        setLoading(false);
        return;
      }

      const command = new GetUserCommand({
        AccessToken: accessToken,
      });

      const response = await client.send(command);

      const userAttributes = response.UserAttributes.reduce((acc, attribute) => {
        acc[attribute.Name] = attribute.Value;
        return acc;
      }, {});

      setAccountData({
        id: userAttributes.sub,
        name: userAttributes.name || '',
        email: userAttributes.email || '', // Non-editable email
      });

    } catch (err) {
      setError('Failed to fetch account data.');
      console.error('Error fetching account data:', err);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchAccountData();
  }, [fetchAccountData]);

  // Handle input changes for the name field
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAccountData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Handle saving changes for the name field
  const handleSaveChanges = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setError('No token found. Please log in again.');
        return;
      }

      const command = new UpdateUserAttributesCommand({
        AccessToken: accessToken,
        UserAttributes: [
          { Name: 'name', Value: accountData.name },
        ],
      });

      await client.send(command);
      setUpdateSuccess(true);
      setEditName(false);
    } catch (err) {
      console.error('Error updating account information:', err);
      if (err.name === 'NotAuthorizedException') {
        setError('Session has expired. Please log in again.');
      } else {
        setError('Failed to update account information.');
      }
    }
  };

  // Function to check password strength using zxcvbn
  const handleNewPasswordChange = (e) => {
    const passwordInput = e.target.value;
    setNewPassword(passwordInput);
    const result = zxcvbn(passwordInput);
    setPasswordStrength(result.score); // zxcvbn score is between 0 and 4
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== repeatPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setError('No token found. Please log in.');
        return;
      }

      const command = new ChangePasswordCommand({
        AccessToken: accessToken,
        PreviousPassword: currentPassword,
        ProposedPassword: newPassword,
      });

      await client.send(command);
      setPasswordChangeSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setRepeatPassword('');
      setPasswordStrength(null); // Reset password strength meter
    } catch (err) {
      setError('Failed to change password.');
    }
  };

  if (loading) return <p>Loading account data...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="account-container">
      <h1 className="account-title">Your Account</h1>
      {updateSuccess && <p className="success-message">Account updated successfully!</p>}
      {passwordChangeSuccess && <p className="success-message">Password changed successfully!</p>}

      <div className="account-card">
        {/* User ID */}
        <div className="account-field">
          <label>User ID:</label>
          <span>{accountData.id}</span>
        </div>

        {/* Email Field (Non-editable) */}
        <div className="account-field">
          <label htmlFor="email">Email:</label>
          <span>{accountData.email}</span>
        </div>

        {/* Name Field */}
        <div className="account-field">
          <label htmlFor="name">Name:</label>
          {editName ? (
            <div className="field-edit">
              <input
                type="text"
                id="name"
                name="name"
                value={accountData.name}
                onChange={handleInputChange}
                className="form-input"
              />
              <div className="field-buttons">
                <button className="save-button" onClick={handleSaveChanges}>Save</button>
                <button className="cancel-button" onClick={() => setEditName(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="field-view">
              <span>{accountData.name}</span>
              <button className="edit-button" onClick={() => setEditName(true)}>Edit</button>
            </div>
          )}
        </div>

        {/* Password Change Section */}
        <div className="password-change-section">
          <h2>Change Password</h2>
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>Current Password:</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>New Password:</label>
              <input
                type="password"
                value={newPassword}
                onChange={handleNewPasswordChange} // Track new password changes
                required
              />
              {/* Password strength meter */}
              {newPassword && (
                <div className="password-strength">
                  <meter
                    min="0"
                    max="4"
                    value={passwordStrength || 0} // Set default to 0
                    id="password-strength-meter"
                  ></meter>
                  <p>Password Strength: {['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][passwordStrength]}</p>
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Repeat New Password:</label>
              <input
                type="password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit">Change Password</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Account;

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { CognitoIdentityProviderClient, GetUserCommand, UpdateUserAttributesCommand, ChangePasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import './Account.css';

function Account() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [provider, setProvider] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatNewPassword, setRepeatNewPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  // New state variable to control visibility of both forms
  const [isFormVisible, setIsFormVisible] = useState(false);

  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');

  const client = useMemo(() => new CognitoIdentityProviderClient({ region: 'us-east-1' }), []);

  const fetchUserData = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setError('Access token not found. Please log in.');
        setLoading(false);
        return;
      }

      const command = new GetUserCommand({ AccessToken: accessToken });
      const response = await client.send(command);

      const userAttributes = response.UserAttributes.reduce((acc, attr) => {
        acc[attr.Name] = attr.Value;
        return acc;
      }, {});

      setEmail(userAttributes.email);
      setFirstName(userAttributes.given_name);
      setLastName(userAttributes.family_name);
      setNewFirstName(userAttributes.given_name);
      setNewLastName(userAttributes.family_name);

      const identities = JSON.parse(userAttributes.identities || '[]');
      if (identities.length > 0) {
        setProvider(identities[0].providerName);
      } else {
        setProvider('Cognito');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to fetch user data.');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleNameUpdate = async (e) => {
    e.preventDefault();
    try {
      const accessToken = localStorage.getItem('accessToken');
      const command = new UpdateUserAttributesCommand({
        AccessToken: accessToken,
        UserAttributes: [
          { Name: 'given_name', Value: newFirstName },
          { Name: 'family_name', Value: newLastName },
        ],
      });

      await client.send(command);
      setMessage('Name updated successfully');
      setFirstName(newFirstName);
      setLastName(newLastName);
    } catch (err) {
      console.error('Error updating user name:', err);
      setError('Failed to update user name.');
    }
  };

  const evaluatePasswordStrength = (password) => {
    if (!password) return 0;
    if (password.length < 6) return 1; // Weak
    if (password.length < 8) return 2; // Moderate
    return 3; // Strong
  };

  const handleNewPasswordChange = (e) => {
    const password = e.target.value;
    setNewPassword(password);
    setPasswordStrength(evaluatePasswordStrength(password));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== repeatNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const accessToken = localStorage.getItem('accessToken');
      const command = new ChangePasswordCommand({
        AccessToken: accessToken,
        PreviousPassword: currentPassword,
        ProposedPassword: newPassword,
      });

      await client.send(command);
      setMessage('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setRepeatNewPassword('');
    } catch (err) {
      console.error('Error changing password:', err);
      setError('Failed to change password.');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="account-container">
      <h1 className="account-title">Your Account</h1>
      <div className="account-card">
        <div className="account-info">
          <p><strong>Email:</strong> {email || 'No email available'}</p>
          <p><strong>First Name:</strong> {firstName || 'No first name available'}</p>
          <p><strong>Last Name:</strong> {lastName || 'No last name available'}</p>
        </div>

        {provider === 'Cognito' && (
          <>
            {/* Single button to toggle the visibility of the whole form */}
            <button onClick={() => setIsFormVisible(!isFormVisible)} className="toggle-button">
              {isFormVisible ? 'Hide Update Form' : 'Update Name and Password'}
            </button>

            {isFormVisible && (
              <>
                <h2>Update Name</h2>
                <form onSubmit={handleNameUpdate} className="account-form">
                  <div>
                    <label>New First Name:</label>
                    <input
                      type="text"
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label>New Last Name:</label>
                    <input
                      type="text"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                    />
                  </div>
                  <div className="form-buttons">
                    <button type="submit" className="save-button">Update Name</button>
                  </div>
                </form>

                <h2>Change Password</h2>
                <form onSubmit={handlePasswordChange} className="account-form">
                  <div>
                    <label>Current Password:</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label>New Password:</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={handleNewPasswordChange}
                    />
                    <div className="password-strength-bar">
                      <div className={`strength-${passwordStrength}`}></div>
                    </div>
                  </div>
                  <div>
                    <label>Repeat New Password:</label>
                    <input
                      type="password"
                      value={repeatNewPassword}
                      onChange={(e) => setRepeatNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="form-buttons">
                    <button type="submit" className="save-button">Change Password</button>
                  </div>
                </form>
              </>
            )}
          </>
        )}

        {message && <p className="success-message">{message}</p>}
      </div>
    </div>
  );
}

export default Account;

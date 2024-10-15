import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { CognitoIdentityProviderClient, GetUserCommand, UpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
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

      const response = await client.send(command);
      console.log('Account updated successfully:', response);

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

  if (loading) return <p>Loading account data...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="account-container">
      <h1 className="account-title">Your Account</h1>
      {updateSuccess && <p className="success-message">Account updated successfully!</p>}

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
      </div>
    </div>
  );
}

export default Account;

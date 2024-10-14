import React, { useEffect, useState } from 'react';
import { CognitoIdentityProviderClient, GetUserCommand, UpdateUserAttributesCommand } from "@aws-sdk/client-cognito-identity-provider";
import awsmobile from './aws-exports';
import './Account.css';

function Account() {
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Individual edit modes for each field
  const [editName, setEditName] = useState(false);
  const [editEmail, setEditEmail] = useState(false);

  const fetchAccountData = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken'); // Get access token from localStorage

      if (!accessToken) {
        setError('No token found. Please log in.');
        setLoading(false);
        return;
      }

      const client = new CognitoIdentityProviderClient({ region: awsmobile.aws_project_region });
      const command = new GetUserCommand({
        AccessToken: accessToken,
      });

      const response = await client.send(command);

      setAccountData({
        id: response.Username,
        name: response.UserAttributes.find(attr => attr.Name === 'name')?.Value || '',
        email: response.UserAttributes.find(attr => attr.Name === 'email')?.Value || '',
      });
    } catch (err) {
      setError('Failed to fetch account data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAccountData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const client = new CognitoIdentityProviderClient({ region: awsmobile.aws_project_region });
      
      const command = new UpdateUserAttributesCommand({
        AccessToken: accessToken,
        UserAttributes: [
          { Name: 'name', Value: accountData.name },
          { Name: 'email', Value: accountData.email },
        ],
      });

      const result = await client.send(command);

      setUpdateSuccess(true);
      setEditName(false);
      setEditEmail(false);
      console.log('User attributes updated:', result);

      // Optionally refetch the updated account data
      fetchAccountData();
    } catch (err) {
      setError('Failed to update account information.');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAccountData();
  }, []);

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

        {/* Email Field */}
        <div className="account-field">
          <label htmlFor="email">Email:</label>
          {editEmail ? (
            <div className="field-edit">
              <input
                type="email"
                id="email"
                name="email"
                value={accountData.email}
                onChange={handleInputChange}
                className="form-input"
              />
              <div className="field-buttons">
                <button className="save-button" onClick={handleSaveChanges}>Save</button>
                <button className="cancel-button" onClick={() => setEditEmail(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="field-view">
              <span>{accountData.email}</span>
              <button className="edit-button" onClick={() => setEditEmail(true)}>Edit</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Account;

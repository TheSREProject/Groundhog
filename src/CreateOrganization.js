import React, { useState } from 'react';
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import './CreateOrganization.css';

function CreateOrganization() {
  const [organizationName, setOrganizationName] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);

  // Handler for creating an organization
  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      // Fetch Cognito user information
      const client = new CognitoIdentityProviderClient({ region: 'us-east-1' });
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        setError('Access token not found. Please log in.');
        return;
      }

      const command = new GetUserCommand({ AccessToken: accessToken });
      const response = await client.send(command);

      const userAttributes = response.UserAttributes.reduce((acc, attr) => {
        acc[attr.Name] = attr.Value;
        return acc;
      }, {});

      const cognitoUserId = userAttributes.sub; // Cognito user ID
      const userEmail = userAttributes.email;
      const userName = userAttributes.name || '';

      // Prepare data for the API call
      const apiUrl = 'https://uuevsfl6hd.execute-api.us-east-1.amazonaws.com/dev/organizations';
      const data = {
        organization_name: organizationName,
        description: description,
        cognito_user_id: cognitoUserId,
        name: userName,
        email: userEmail,
      };

      // Make the API call to create the organization
      const createResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create organization');
      }

      const result = await createResponse.json();
      setMessage(`Organization "${result.organization.name}" created successfully!`);

      // After successfully creating the organization, fetch the updated list of organizations
      await fetchOrganizations(cognitoUserId);

    } catch (err) {
      console.error('Error creating organization:', err);
      setError('Error creating organization. Please try again.');
    }
  };

  // Function to fetch user organizations from the backend and store them in localStorage
  const fetchOrganizations = async (cognitoUserId) => {
    try {
      const apiUrl = `https://fbodckimai.execute-api.us-east-1.amazonaws.com/dev/?cognito_user_id=${cognitoUserId}`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const result = await response.json();
      console.log('Organizations fetched:', result.organizations);

      // Store the updated organizations in localStorage
      localStorage.setItem('organizations', JSON.stringify(result.organizations || []));
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError('Error fetching organizations');
    }
  };

  return (
    <div className="create-organization-container">
      <h1>Create Organization</h1>
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleCreate}>
        <div>
          <label>Organization Name:</label>
          <input
            type="text"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Description:</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <button type="submit">Create Organization</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

export default CreateOrganization;

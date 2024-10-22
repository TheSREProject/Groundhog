import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate from React Router
import { AuthContext } from './AuthContext';
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

function Home() {
  const { authenticated } = useContext(AuthContext);
  const [organizations, setOrganizations] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Initialize useNavigate

  // Function to fetch user data from Cognito and store it in localStorage
  const fetchUserData = useCallback(async () => {
    try {
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

      // Store user details in localStorage
      localStorage.setItem('name', userAttributes.name);
      localStorage.setItem('email', userAttributes.email);
      localStorage.setItem('cognito_user_id', userAttributes.sub);

      console.log('User data stored in localStorage:', {
        name: userAttributes.name,
        email: userAttributes.email,
        cognito_user_id: userAttributes.sub,
      });

      // After storing user data, fetch user organizations
      fetchOrganizations(userAttributes.sub);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to fetch user data.');
    }
  }, []);

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

      // Store organizations in state and localStorage
      setOrganizations(result.organizations || []);
      localStorage.setItem('organizations', JSON.stringify(result.organizations || []));
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError('Error fetching organizations');
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem('cognito_user_id');

    if (authenticated && !userId) {
      fetchUserData();  // Fetch user data and organizations if the user is authenticated
    }

    if (authenticated && userId) {
      const storedOrganizations = localStorage.getItem('organizations');
      if (storedOrganizations) {
        setOrganizations(JSON.parse(storedOrganizations));  // Load organizations from localStorage
      } else {
        fetchOrganizations(userId);  // Fetch organizations if not found in localStorage
      }
    }
  }, [authenticated, fetchUserData]);

  // Handler for the Create Organization button
  const handleCreateOrganization = () => {
    navigate('/organization');  // Navigate to the /organization route
  };

  return (
    <div className="home-container">
      <h1>Home Page</h1>
      <p>Welcome to the Home page of our React app!</p>

      {error && <p className="error-message">{error}</p>}

      {/* Only show the Create Organization button if no organizations exist */}
      {organizations.length === 0 && authenticated && (
        <button className="create-organization-button" onClick={handleCreateOrganization}>
          Create Organization
        </button>
      )}
    </div>
  );
}

export default Home;

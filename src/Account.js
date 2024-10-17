import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

function Account() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize the client using useMemo to ensure it does not change on each render
  const client = useMemo(() => new CognitoIdentityProviderClient({ region: 'us-east-1' }), []);

  // Fetch user data from Cognito
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
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to fetch user data.');
    } finally {
      setLoading(false);
    }
  }, [client]); // Use 'client' as a dependency

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="account-container">
      <h1 className="account-title">Your Account</h1>
      <div className="account-info">
        <p><strong>Email:</strong> {email || 'No email available'}</p>
        <p><strong>First Name:</strong> {firstName || 'No first name available'}</p>
        <p><strong>Last Name:</strong> {lastName || 'No last name available'}</p>
      </div>
    </div>
  );
}

export default Account;

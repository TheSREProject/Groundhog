// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import { CognitoIdentityProviderClient, InitiateAuthCommand, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

export const useAuth = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const clientId = 'YOUR_COGNITO_CLIENT_ID'; // Replace with your Cognito app client ID
      const client = new CognitoIdentityProviderClient({ region: 'us-east-1' });

      if (!refreshToken) {
        throw new Error('No refresh token available.');
      }

      const command = new InitiateAuthCommand({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: clientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      });

      const response = await client.send(command);
      const newAccessToken = response.AuthenticationResult.AccessToken;

      // Update the access token in local storage and state
      localStorage.setItem('accessToken', newAccessToken);
      setAccessToken(newAccessToken);
      console.log('Access token refreshed');
      return newAccessToken;
    } catch (err) {
      console.error('Error refreshing access token:', err);
      setAuthenticated(false);
      setError('Failed to refresh access token. Please log in again.');
      return null;
    }
  }, []);

  const fetchUserData = useCallback(async (token) => {
    try {
      const client = new CognitoIdentityProviderClient({ region: 'us-east-1' });

      if (!token) {
        setAuthenticated(false);
        return;
      }

      const command = new GetUserCommand({ AccessToken: token });
      const response = await client.send(command);
      const userAttributes = response.UserAttributes.reduce((acc, attr) => {
        acc[attr.Name] = attr.Value;
        return acc;
      }, {});

      localStorage.setItem('name', userAttributes.name);
      localStorage.setItem('email', userAttributes.email);
      localStorage.setItem('cognito_user_id', userAttributes.sub);

      setAuthenticated(true);
      setAccessToken(token); // Save valid token to state

    } catch (err) {
      if (err.name === 'NotAuthorizedException') {
        // Token expired, refresh token
        const newToken = await refreshAccessToken();
        if (newToken) {
          fetchUserData(newToken); // Retry after refreshing token
        }
      } else {
        console.error('Error fetching user data:', err);
        setAuthenticated(false);
        setError('Failed to fetch user data.');
      }
    } finally {
      setLoading(false);
    }
  }, [refreshAccessToken]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUserData(token); // Fetch user data if access token is present
    } else {
      setAuthenticated(false);
      setLoading(false);
    }
  }, [fetchUserData]);

  return {
    authenticated,
    loading,
    error,
    accessToken,
    refreshAccessToken,
  };
};

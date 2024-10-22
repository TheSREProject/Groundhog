import React, { createContext, useState, useEffect, useCallback } from 'react';
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { useAuth } from './hooks/useAuth'; // Use the custom hook for token management

// Create AuthContext
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false); // Track if user is authenticated
  const [loading, setLoading] = useState(true); // Track loading state
  const [error, setError] = useState(null); // Track error state

  // Use the custom hook for managing the access token and refreshing it
  const { accessToken, refreshAccessToken } = useAuth();

  // Function to fetch user data from Cognito and update the authenticated state
  const fetchUserData = useCallback(async (token) => {
    try {
      const client = new CognitoIdentityProviderClient({ region: 'us-east-1' });
      const command = new GetUserCommand({ AccessToken: token });
      const response = await client.send(command);

      const userAttributes = response.UserAttributes.reduce((acc, attr) => {
        acc[attr.Name] = attr.Value;
        return acc;
      }, {});

      // Store user details in localStorage
      localStorage.setItem('name', userAttributes.name);
      localStorage.setItem('email', userAttributes.email);
      localStorage.setItem('cognito_user_id', userAttributes.sub);

      setAuthenticated(true); // Set authenticated to true
    } catch (err) {
      if (err.name === 'NotAuthorizedException') {
        // Token expired, refresh token
        const newToken = await refreshAccessToken();
        if (newToken) {
          fetchUserData(newToken); // Retry after refreshing token
        } else {
          setAuthenticated(false);
          setError('Failed to refresh token.');
        }
      } else {
        console.error('Error fetching user data:', err);
        setError('Failed to fetch user data.');
      }
    } finally {
      setLoading(false); // Ensure loading state is updated
    }
  }, [refreshAccessToken]);

  // Function to check authentication status based on token presence
  const checkAuthentication = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUserData(token); // Fetch user data if access token is present
    } else {
      setAuthenticated(false);
      setLoading(false);
    }
  }, [fetchUserData]);

  // Function to log in and update the authenticated state
  const login = async () => {
    checkAuthentication(); // Check authentication immediately after login
  };

  // Function to log out and clear all tokens
  const logout = () => {
    // Clear all tokens and user data from local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    localStorage.removeItem('cognito_user_id');

    setAuthenticated(false); // Immediately set authenticated state to false
  };

  // Check authentication on initial load
  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  // Return loading screen while the authentication status is being determined
  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <AuthContext.Provider value={{ authenticated, login, logout, error, accessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

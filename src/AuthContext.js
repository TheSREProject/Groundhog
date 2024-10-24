import React, { createContext, useState, useEffect, useCallback } from 'react';
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { useAuth } from './hooks/useAuth';
import Cookies from 'js-cookie';

// Create AuthContext
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const { refreshAccessToken } = useAuth();

  // Function to add the user to the database via API Gateway
  const addUserToDatabase = async (name, email, cognito_user_id) => {
    const apiUrl = 'https://4txa8358m9.execute-api.us-east-1.amazonaws.com/dev/';
    const payload = { name, email, cognito_user_id };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to add user to the database. Status: ${response.statusText}`);
      }

      Cookies.set('userAdded', 'true', { secure: true, sameSite: 'Strict' });
    } catch (error) {
      console.error('Error adding user to the database:', error);
    }
  };

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

      Cookies.set('name', userAttributes.name, { secure: true, sameSite: 'Strict' });
      Cookies.set('email', userAttributes.email, { secure: true, sameSite: 'Strict' });
      Cookies.set('cognito_user_id', userAttributes.sub, { secure: true, sameSite: 'Strict' });

      const userAddedFlag = Cookies.get('userAdded');
      if (!userAddedFlag) {
        await addUserToDatabase(userAttributes.name, userAttributes.email, userAttributes.sub);
      }

      setAuthenticated(true); // Set authenticated to true
    } catch (err) {
      if (err.name === 'NotAuthorizedException') {
        const newToken = await refreshAccessToken();
        if (newToken) {
          fetchUserData(newToken); // Retry after refreshing token
        } else {
          setAuthenticated(false);
        }
      } else {
        console.error('Error fetching user data:', err);
      }
    }
  }, [refreshAccessToken]);

  // Function to check authentication status based on token presence
  const checkAuthentication = useCallback(async () => {
    const token = Cookies.get('accessToken');
    if (token) {
      await fetchUserData(token);
    } else {
      setAuthenticated(false);
    }
  }, [fetchUserData]);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  const logout = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('name');
    Cookies.remove('email');
    Cookies.remove('cognito_user_id');
    Cookies.remove('userAdded'); // Clear the user added flag
    setAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ authenticated, setAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

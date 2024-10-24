import { useCallback } from 'react';
import Cookies from 'js-cookie';
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

export const useFetchUserData = (setAuthenticated, setLoading, setError, refreshAccessToken) => {
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

      // Store user details in Cookies
      Cookies.set('name', userAttributes.name, { secure: true, sameSite: 'Strict' });
      Cookies.set('email', userAttributes.email, { secure: true, sameSite: 'Strict' });
      Cookies.set('cognito_user_id', userAttributes.sub, { secure: true, sameSite: 'Strict' });

      setAuthenticated(true);
    } catch (err) {
      if (err.name === 'NotAuthorizedException') {
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
  }, [setAuthenticated, setLoading, setError, refreshAccessToken]);

  return { fetchUserData };
};

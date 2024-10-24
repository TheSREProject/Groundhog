// src/hooks/useRefreshToken.js
import { useCallback } from 'react';
import Cookies from 'js-cookie';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';

export const useRefreshToken = (setAccessToken, setAuthenticated, setError) => {
  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = Cookies.get('refreshToken'); // Get refresh token from cookies
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

      // Set access token in cookies
      Cookies.set('accessToken', newAccessToken, { secure: true, sameSite: 'Strict' });
      setAccessToken(newAccessToken);
      console.log('Access token refreshed');
      return newAccessToken;
    } catch (err) {
      console.error('Error refreshing access token:', err);
      setAuthenticated(false);
      setError('Failed to refresh access token. Please log in again.');
      return null;
    }
  }, [setAccessToken, setAuthenticated, setError]);

  return { refreshAccessToken };
};

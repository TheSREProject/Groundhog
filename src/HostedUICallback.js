import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import awsExports from './aws-exports';
import Cookies from 'js-cookie';

const HostedUICallback = () => {
  const { setAuthenticated } = useContext(AuthContext); // Use setAuthenticated directly
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTokens = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        try {
          const response = await fetch(
            `https://${awsExports.oauth.domain}/oauth2/token`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: awsExports.aws_user_pools_web_client_id,
                code,
                redirect_uri: awsExports.oauth.redirectSignIn.split(',')[1],
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to exchange code for tokens: ${response.statusText}`);
          }

          const tokens = await response.json();

          // Store tokens in cookies
          Cookies.set('accessToken', tokens.access_token, { secure: true, sameSite: 'Strict' });
          Cookies.set('refreshToken', tokens.refresh_token, { secure: true, sameSite: 'Strict' });
          Cookies.set('idToken', tokens.id_token, { secure: true, sameSite: 'Strict' });

          setAuthenticated(true); // Set authenticated to true immediately after storing tokens
          navigate('/'); // Redirect after authentication
        } catch (error) {
          console.error('Error exchanging code for tokens:', error);
        }
      }
    };

    fetchTokens();
  }, [setAuthenticated, navigate]);

  return <div>Processing authentication...</div>;
};

export default HostedUICallback;

import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import awsExports from './aws-exports';

const HostedUICallback = () => {
  const { login } = useContext(AuthContext);
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
                redirect_uri: awsExports.oauth.redirectSignIn.split(',')[0], // Use the [1] redirect URL for production
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to exchange code for tokens: ${response.statusText}`);
          }

          const tokens = await response.json();

          localStorage.setItem('idToken', tokens.id_token);
          localStorage.setItem('accessToken', tokens.access_token);
          localStorage.setItem('refreshToken', tokens.refresh_token);

          login();
          navigate('/');
        } catch (error) {
          console.error('Error exchanging code for tokens:', error);
        }
      }
    };

    fetchTokens();
  }, [login, navigate]);

  return <div>Processing authentication...</div>;
};

export default HostedUICallback;

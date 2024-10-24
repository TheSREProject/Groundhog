import { useState, useEffect } from 'react';
import { useRefreshToken } from './useRefreshToken';
import { useFetchUserData } from './useFetchUserData';
import Cookies from 'js-cookie';

export const useAuth = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  const { refreshAccessToken } = useRefreshToken(setAccessToken, setAuthenticated, setError);
  const { fetchUserData } = useFetchUserData(setAuthenticated, setLoading, setError, refreshAccessToken);

  useEffect(() => {
    const token = Cookies.get('accessToken'); // Use Cookies
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

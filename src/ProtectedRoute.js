import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie'; // Import Cookies

const ProtectedRoute = ({ element }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = Cookies.get('accessToken'); // Check Cookies instead of localStorage
      setAuthenticated(!!token);
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  return authenticated ? element : <Navigate to="/auth" />; // Redirect to /auth for login/register
};

export default ProtectedRoute;

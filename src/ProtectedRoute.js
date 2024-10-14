import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ element }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state to delay rendering

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken'); // Fetch token from localStorage

      if (token) {
        setAuthenticated(true); // User is authenticated
      } else {
        setAuthenticated(false); // No token found, user is not authenticated
      }
      setLoading(false); // Token check is complete
    };

    checkAuth();
  }, []);

  if (loading) {
    return <p>Loading...</p>; // Display loading while checking authentication
  }

  if (!authenticated) {
    return <Navigate to="/login" />; // Redirect to login if user is not authenticated
  }

  return element;
};

export default ProtectedRoute;

// src/ProtectedRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Auth } from 'aws-amplify';

const ProtectedRoute = ({ element }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await Auth.currentAuthenticatedUser(); // Check if a user is authenticated
        setAuthenticated(true);
      } catch (error) {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
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

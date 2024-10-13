import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

function ProtectedRoute({ element }) {
  const { token } = useContext(AuthContext);

  // If there is no token, redirect to the login page
  return token ? element : <Navigate to="/login" />;
}

export default ProtectedRoute;

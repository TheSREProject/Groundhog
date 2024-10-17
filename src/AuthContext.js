import React, { createContext, useState, useEffect } from 'react';

// Create AuthContext
export const AuthContext = createContext();

// AuthProvider component to wrap your app and provide the auth state
export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);

  // Check if the user is authenticated (e.g., based on token presence)
  const checkAuthentication = () => {
    const accessToken = localStorage.getItem('accessToken');
    setAuthenticated(!!accessToken); // Set authenticated state based on token presence
  };

  // Function to log in and update the authenticated state
  const login = () => {
    checkAuthentication(); // After login, check and update the auth state
  };

  // Function to log out and update the authenticated state
  const logout = () => {
    setAuthenticated(false);
  };

  useEffect(() => {
    checkAuthentication(); // Check authentication on initial load
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

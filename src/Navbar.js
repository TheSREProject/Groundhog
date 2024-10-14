import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CognitoIdentityProviderClient, GlobalSignOutCommand } from "@aws-sdk/client-cognito-identity-provider";
import awsmobile from './aws-exports';
import './Navbar.css';

function Navbar() {
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Create the Cognito client with useMemo to prevent re-creation on each render
  const client = useMemo(() => new CognitoIdentityProviderClient({ region: awsmobile.aws_project_region }), []);

  const checkAuth = () => {
    const accessToken = localStorage.getItem('accessToken');
    setAuthenticated(!!accessToken);
  };

  const handleLogout = async () => {
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      console.error('No access token found. Cannot sign out.');
      setAuthenticated(false);
      localStorage.clear();
      navigate('/login');
      return;
    }

    try {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken,
      });

      await client.send(command);
      console.log('Logout successful');
      
      // Clear tokens from local storage
      localStorage.clear();
      setAuthenticated(false);
      navigate('/login');
    } catch (err) {
      if (err.name === 'NotAuthorizedException') {
        console.warn('Access token is invalid or expired. Logging out locally.');
        localStorage.clear();
        setAuthenticated(false);
        navigate('/login');
      } else {
        console.error('Error signing out:', err);
      }
    }
  };

  // Listen to localStorage changes for login/logout events
  useEffect(() => {
    checkAuth();

    const handleStorageChange = () => {
      checkAuth(); // Update authentication state when tokens are added/removed from localStorage
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <h2>MyApp</h2>
      </div>
      <ul className="navbar-links">
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/contact">Contact</Link>
        </li>
        {authenticated ? (
          <>
            <li>
              <Link to="/account">Account</Link>
            </li>
            <li>
              <button onClick={handleLogout} className="logout-button">Logout</button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/register">Register</Link>
            </li>
            <li>
              <Link to="/login">Login</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;

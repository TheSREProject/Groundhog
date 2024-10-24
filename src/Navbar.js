import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { useLogout } from './hooks/useLogout';
import Cookies from 'js-cookie';
import awsExports from './aws-exports';
import './Navbar.css';

function Navbar() {
  const { authenticated } = useContext(AuthContext); // No need to import setAuthenticated anymore
  const { logout } = useLogout();
  const [isAuthenticated, setIsAuthenticated] = useState(authenticated);

  // Update local state when authenticated changes
  useEffect(() => {
    const token = Cookies.get('accessToken');
    setIsAuthenticated(!!token);
  }, [authenticated]);

  const handleHostedUISignIn = () => {
    const clientId = awsExports.aws_user_pools_web_client_id;
    const redirectUri = encodeURIComponent(awsExports.oauth.redirectSignIn.split(',')[1]);
    const scope = 'email+openid+profile+aws.cognito.signin.user.admin+phone';

    window.location.href = `https://${awsExports.oauth.domain}/login?response_type=code&client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}`;
  };

  const handleHostedUISignOut = () => {
    const clientId = awsExports.aws_user_pools_web_client_id;
    const signOutUri = `https://${awsExports.oauth.domain}/logout?client_id=${clientId}&logout_uri=${awsExports.oauth.redirectSignOut.split(',')[1]}`;

    logout(); // Clear cookies and update state
    window.location.href = signOutUri;
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <h2>MyApp</h2>
      </div>
      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/contact">Contact</Link></li>
        {isAuthenticated ? (
          <>
            <li><Link to="/account">Account</Link></li>
            <li>
              <button onClick={handleHostedUISignOut} className="logout-button">
                Logout
              </button>
            </li>
          </>
        ) : (
          <li>
            <button onClick={handleHostedUISignIn} className="login-button">
              Register / Login
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;

import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import awsExports from './aws-exports';
import './Navbar.css';

function Navbar() {
  const { authenticated, logout } = useContext(AuthContext);

  const handleHostedUISignIn = () => {
    const clientId = awsExports.aws_user_pools_web_client_id;
    encodeURIComponent(awsExports.oauth.redirectSignIn.split(',')[1]);
    // Define the scope correctly
    const scope = 'email+openid+profile+aws.cognito.signin.user.admin+phone';

    // Include the scope variable in the URL
    const hostedUiUrl = `https://${awsExports.oauth.domain}/login?response_type=code&client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}`;

    // Redirect to the Hosted UI for sign-in
    window.location.href = hostedUiUrl;
  };

  const handleHostedUISignOut = () => {
    const clientId = awsExports.aws_user_pools_web_client_id;
    const signOutUri = `https://${awsExports.oauth.domain}/logout?client_id=${clientId}&logout_uri=http://localhost:3000/`;
    
    // Clear tokens and global state
    localStorage.clear();
    logout();

    // Redirect to the Cognito Hosted UI logout endpoint
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
        {authenticated ? (
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

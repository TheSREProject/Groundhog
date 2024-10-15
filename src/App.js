// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';
import Navbar from './Navbar';
import Home from './Home';
import Account from './Account';
import Contact from './Contact';
import Register from './Register';
import Verify from './Verify';
import Login from './Login';  // Import the Login component
import ForgotPassword from './ForgotPassword';  // Import the ForgotPassword component
import './App.css';

Amplify.configure(awsExports);

function App() {
  const [authenticated, setAuthenticated] = useState(false); // Track auth state

  return (
    <GoogleReCaptchaProvider reCaptchaKey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}>
      <Router>
        <div className="app-container">
          {/* Pass authenticated state and setAuthenticated function to Navbar */}
          <Navbar authenticated={authenticated} setAuthenticated={setAuthenticated} />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/login" element={<Login setAuthenticated={setAuthenticated} />} />  {/* Pass setAuthenticated */}
              <Route path="/account" element={<Account />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />  {/* Add ForgotPassword route */}
            </Routes>
          </main>
        </div>
      </Router>
    </GoogleReCaptchaProvider>
  );
}

export default App;

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';
import Navbar from './Navbar';
import Home from './Home';
import Account from './Account';
import Contact from './Contact';
import HostedUICallback from './HostedUICallback'; 
import { AuthProvider } from './AuthContext'; 
import './App.css';

Amplify.configure(awsExports);

function RootRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');  // Check for 'code' in the root URL

    if (code) {
      navigate(`/auth/callback?code=${code}`);  // Redirect to /auth/callback
    }
  }, [navigate]);

  return <Home />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/account" element={<Account />} />
              <Route path="/auth/callback" element={<HostedUICallback />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

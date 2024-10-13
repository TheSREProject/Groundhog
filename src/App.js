// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import Navbar from './Navbar';
import Home from './Home';
import Login from './Login';
import Account from './Account';
import Contact from './Contact';
import Register from './Register';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from './AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <GoogleReCaptchaProvider reCaptchaKey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}>
        <Router>
          <div className="app-container">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                <Route path="/account" element={<ProtectedRoute element={<Account />} />} />
              </Routes>
            </main>
          </div>
        </Router>
      </GoogleReCaptchaProvider>
    </AuthProvider>
  );
}

export default App;

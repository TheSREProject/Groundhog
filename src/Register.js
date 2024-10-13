// src/Register.js
import React, { useState } from 'react';
import { Auth } from 'aws-amplify'; // Import Auth from Amplify
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import zxcvbn from 'zxcvbn'; // Password strength library
import './Register.css';

function Register() {
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState(''); // Organization is now optional
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordVisibleConfirm, setPasswordVisibleConfirm] = useState(false); // For confirm password
  const [step, setStep] = useState(1); // Multi-step form tracker
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { executeRecaptcha } = useGoogleReCaptcha();
  const passwordStrength = zxcvbn(password);

  const handleNextStep = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }
    if (!executeRecaptcha) {
      setError('reCAPTCHA not ready');
      return;
    }

    // Proceed to the next step (payment info)
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const recaptchaToken = await executeRecaptcha('register');
      setLoading(true);

      // Use Amplify Auth to sign up the user
      await Auth.signUp({
        username: email,
        password,
        attributes: {
          email,
          name,
          'custom:organization': organization || null, // Store organization if provided
        },
      });

      setSuccess(true);
      // Reset form fields
      setName('');
      setOrganization('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h1>Register</h1>
      {success ? (
        <p>Registration successful! Please check your email to confirm your account.</p>
      ) : (
        <form className="register-form" onSubmit={step === 1 ? handleNextStep : handleSubmit}>
          {step === 1 && (
            <>
              {/* Step 1: User Information */}
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="organization">Organization (Optional)</label>
                <input
                  type="text"
                  id="organization"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Enter your organization (if any)"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength="8"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setPasswordVisible(!passwordVisible);
                    }}
                  >
                    {passwordVisible ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="password-strength">
                  <meter value={passwordStrength.score / 4} max="1"></meter>
                  <p>
                    {passwordStrength.score === 0 && 'Very Weak'}
                    {passwordStrength.score === 1 && 'Weak'}
                    {passwordStrength.score === 2 && 'Fair'}
                    {passwordStrength.score === 3 && 'Good'}
                    {passwordStrength.score === 4 && 'Strong'}
                  </p>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={passwordVisibleConfirm ? 'text' : 'password'}
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setPasswordVisibleConfirm(!passwordVisibleConfirm);
                    }}
                  >
                    {passwordVisibleConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <button type="submit" className="register-button">
                Next
              </button>
            </>
          )}

          {step === 2 && (
            <>
              {/* Step 2: Payment Information (optional) */}
              <div className="form-group">
                <label htmlFor="card-number">Card Number</label>
                <input
                  type="text"
                  id="card-number"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="expiration-date">Expiration Date</label>
                <input
                  type="text"
                  id="expiration-date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  placeholder="MM/YY"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="cvv">CVV</label>
                <input
                  type="text"
                  id="cvv"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="register-button" disabled={loading}>
                {loading ? 'Processing...' : 'Submit'}
              </button>
            </>
          )}

          {error && <p className="error-message">{error}</p>}
        </form>
      )}
    </div>
  );
}

export default Register;

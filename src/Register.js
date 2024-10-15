import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleReCaptcha } from 'react-google-recaptcha-v3'; // Import Google reCAPTCHA
import axios from 'axios'; // Axios to make API calls
import zxcvbn from 'zxcvbn'; // Import zxcvbn for password strength check
import { CognitoIdentityProviderClient, SignUpCommand, ConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import awsmobile from './aws-exports';
import './Register.css'; // Import CSS for styling

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState(''); // Added state for repeat password
  const [passwordStrength, setPasswordStrength] = useState(null); // Password strength state
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [storedEmail, setStoredEmail] = useState('');
  const navigate = useNavigate();

  const client = new CognitoIdentityProviderClient({ region: awsmobile.aws_project_region });

  // Set up state to capture the reCAPTCHA token
  const [captchaToken, setCaptchaToken] = useState(null);

  // Callback function to get the reCAPTCHA token
  const handleVerifyCaptcha = (token) => {
    setCaptchaToken(token); // Save token in state
  };

  // Function to check password strength using zxcvbn
  const handlePasswordChange = (e) => {
    const passwordInput = e.target.value;
    setPassword(passwordInput);
    const result = zxcvbn(passwordInput);
    setPasswordStrength(result.score); // zxcvbn score is between 0 and 4
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Check if passwords match before proceeding with registration
    if (!isVerifying && password !== repeatPassword) {
      setError('Passwords do not match');
      return;
    }

    // Check if we are in verification mode
    if (isVerifying) {
      try {
        // Confirm the verification code
        const params = {
          ClientId: awsmobile.aws_user_pools_web_client_id,
          Username: storedEmail,
          ConfirmationCode: verificationCode,
        };
        const command = new ConfirmSignUpCommand(params);
        const response = await client.send(command);
        console.log('User confirmed successfully:', response);
        setSuccess(true);
        navigate('/login');
      } catch (err) {
        setError(err.message || 'Error during verification');
      }
    } else {
      // Check if we have the reCAPTCHA token before registration
      if (!captchaToken) {
        setError('Please complete the reCAPTCHA validation');
        return;
      }

      try {
        // Step 1: Send reCAPTCHA token to the backend to verify it
        const recaptchaResponse = await axios.post(
          'https://vx0d3cpt5d.execute-api.us-east-1.amazonaws.com/dev/recaptcha', 
          { token: captchaToken }, // Send the reCAPTCHA token for verification
          {
            headers: {
              'Content-Type': 'application/json', // Ensure the correct headers
            },
          }
        );

        if (!recaptchaResponse.data.success) {
          setError('reCAPTCHA verification failed.');
          return;
        }

        // Step 2: Register the user (after reCAPTCHA verification)
        const params = {
          ClientId: awsmobile.aws_user_pools_web_client_id,
          Username: email,
          Password: password,
          UserAttributes: [
            { Name: 'email', Value: email },
            { Name: 'name', Value: name },
          ],
        };
        const command = new SignUpCommand(params);
        const response = await client.send(command);
        console.log('Registration successful:', response);
        setStoredEmail(email);
        setIsVerifying(true);
      } catch (err) {
        setError(err.message || 'Error during registration');
      }
    }
  };

  return (
    <div className="register-container">
      <GoogleReCaptcha onVerify={handleVerifyCaptcha} /> {/* Add reCAPTCHA verification */}
      <h1>{isVerifying ? 'Verify Account' : 'Register'}</h1>
      {success ? (
        <p>Registration successful! You can now log in.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          {!isVerifying ? (
            <>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={handlePasswordChange} // Check password strength on change
                required
              />
              {/* Display password strength meter */}
              {password && (
                <div className="password-strength">
                  <meter
                    min="0"
                    max="4"
                    value={passwordStrength || 0} // Set default to 0
                    id="password-strength-meter"
                  ></meter>
                  <p>Password Strength: {['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][passwordStrength]}</p>
                </div>
              )}
              <input
                type="password"
                placeholder="Repeat Password" // Input for repeat password
                value={repeatPassword} // Bind to state
                onChange={(e) => setRepeatPassword(e.target.value)} // Update repeat password state
                required
              />
              <button type="submit">Register</button>
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="Verification Code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />
              <button type="submit">Verify</button>
            </>
          )}
        </form>
      )}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default Register;

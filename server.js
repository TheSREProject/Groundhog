require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5000;
const SECRET_KEY = process.env.SECRET_KEY;

app.use(cors());
app.use(bodyParser.json());

const users = [
  {
    id: uuidv4(),
    name: 'John Doe',
    email: 'john@example.com',
    organization: 'Example Corp',
    organizationId: uuidv4(),
    password: '12345678',
    paymentInfo: {
      cardNumber: '4111111111111111',
      expirationDate: '12/23',
      cvv: '123',
    },
  },
];

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Authenticating token:', token);

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.log('Invalid token:', err);
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user; // Attaching user to request
    console.log('Token authenticated for user:', user.email);
    next();
  });
}

// Helper function to mask card number
function maskCardNumber(cardNumber) {
  return cardNumber.replace(/\d(?=\d{4})/g, '*');
}

// Account-specific data endpoint
app.get('/api/account', authenticateToken, (req, res) => {
  const userEmail = req.user.email;
  console.log('Fetching account data for:', userEmail);

  const user = users.find((u) => u.email === userEmail);

  if (!user) {
    console.log('User not found:', userEmail);
    return res.status(404).json({ error: 'User not found' });
  }

  const maskedCardNumber = maskCardNumber(user.paymentInfo.cardNumber);
  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
    organization: user.organization,
    organizationId: user.organizationId,
    paymentInfo: {
      cardNumber: maskedCardNumber,
      expirationDate: user.paymentInfo.expirationDate,
    },
  };

  console.log('Returning account data for:', userEmail);
  return res.status(200).json(userData);
});

// Update user account information
app.put('/api/account', authenticateToken, (req, res) => {
  const userEmail = req.user.email;
  const { name, email, organization } = req.body;
  console.log(`Updating account for user: ${userEmail} with data:`, req.body);

  const userIndex = users.findIndex((u) => u.email === userEmail);

  if (userIndex === -1) {
    console.log('User not found:', userEmail);
    return res.status(404).json({ error: 'User not found' });
  }

  users[userIndex].name = name || users[userIndex].name;

  // If the email is changed, issue a new token
  if (email && email !== users[userIndex].email) {
    users[userIndex].email = email;
    const newToken = jwt.sign({ email: email }, SECRET_KEY, { expiresIn: '1h' });

    console.log(`Email updated for user: ${email}. Issuing new token.`);
    return res.status(200).json({ message: 'Account updated successfully!', token: newToken });
  }

  // Update organization and generate new organization ID if organization changes
  if (organization) {
    if (users[userIndex].organization !== organization) {
      users[userIndex].organization = organization;
      users[userIndex].organizationId = uuidv4();
      console.log(`Organization updated. New Organization ID: ${users[userIndex].organizationId}`);
    }
  }

  console.log(`Account updated for user: ${userEmail}`);
  return res.status(200).json({
    message: 'Account updated successfully!',
    organizationId: users[userIndex].organizationId,
  });
});

// Register endpoint with reCAPTCHA verification
app.post('/api/register', async (req, res) => {
  const { name, organization, email, password, recaptchaToken, paymentInfo } = req.body;

  console.log('Registering new user with data:', {
    name,
    organization,
    email,
    paymentInfo: { ...paymentInfo, cardNumber: maskCardNumber(paymentInfo.cardNumber) }, // Masked in logs
  });

  if (!name || !email || !password || !paymentInfo) {
    console.log('Registration failed: missing fields');
    return res.status(400).json({ error: 'All fields are required' });
  }

  const existingUser = users.find((u) => u.email === email);
  if (existingUser) {
    console.log('Registration failed: user already exists', email);
    return res.status(400).json({ error: 'User already exists' });
  }

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.SECRET_KEY}&response=${recaptchaToken}`
    );

    const { success, score } = response.data;
    console.log('reCAPTCHA verification result:', response.data);

    if (!success || score < 0.5) {
      console.log('reCAPTCHA verification failed');
      return res.status(400).json({ error: 'Failed reCAPTCHA verification' });
    }

    const newUser = {
      id: uuidv4(),
      name,
      organization: organization || null,
      email,
      password,
      organizationId: organization ? uuidv4() : null,
      paymentInfo: {
        cardNumber: maskCardNumber(paymentInfo.cardNumber), // Masked in response and logs
        expirationDate: paymentInfo.expirationDate,
        cvv: paymentInfo.cvv,
      },
    };

    users.push(newUser);
    console.log('User registered successfully:', email);

    return res.status(201).json({ message: 'User created successfully!' });
  } catch (error) {
    console.log('reCAPTCHA verification failed:', error);
    return res.status(500).json({ error: 'reCAPTCHA verification failed' });
  }
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  console.log(`Attempting login for: ${email}`);

  const user = users.find((u) => u.email === email && u.password === password);

  if (user) {
    const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: '1h' });
    console.log('Login successful for:', email);
    return res.status(200).json({ message: 'Login successful!', token });
  } else {
    console.log('Login failed: invalid email or password');
    return res.status(401).json({ error: 'Invalid email or password' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

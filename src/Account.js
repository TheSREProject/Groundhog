import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Account.css';

function Account() {
  const [accountData, setAccountData] = useState({
    id: '',
    name: '',
    email: '',
    organization: '',
    organizationId: '',
    paymentInfo: {
      cardNumber: '',
      expirationDate: '',
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Individual edit modes for each field
  const [editName, setEditName] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [editOrganization, setEditOrganization] = useState(false);

  // Fetch account data from backend
  const fetchAccountData = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('No token found. Please log in.');
        setLoading(false);
        return;
      }

      const response = await axios.get('http://localhost:5000/api/account', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAccountData(response.data);
    } catch (err) {
      setError('Failed to fetch account data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAccountData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.put(
        'http://localhost:5000/api/account',
        {
          name: accountData.name,
          email: accountData.email,
          organization: accountData.organization,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUpdateSuccess(true);
      setEditName(false);
      setEditEmail(false);
      setEditOrganization(false);

      // If the response includes a new token (due to email change), update it in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('Updated token after email change.');
      }

      // Re-fetch the updated account data to reflect changes
      fetchAccountData();
    } catch (err) {
      setError('Failed to update account information.');
      console.error(err);
    }
  };

  if (loading) return <p>Loading account data...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="account-container">
      <h1 className="account-title">Your Account</h1>
      {updateSuccess && <p className="success-message">Account updated successfully!</p>}

      <div className="account-card">
        {/* User ID */}
        <div className="account-field">
          <label>User ID:</label>
          <span>{accountData.id}</span>
        </div>

        {/* Organization ID */}
        <div className="account-field">
          <label>Organization ID:</label>
          <span>{accountData.organizationId}</span>
        </div>

        {/* Name Field */}
        <div className="account-field">
          <label htmlFor="name">Name:</label>
          {editName ? (
            <div className="field-edit">
              <input
                type="text"
                id="name"
                name="name"
                value={accountData.name}
                onChange={handleInputChange}
                className="form-input"
              />
              <div className="field-buttons">
                <button className="save-button" onClick={handleSaveChanges}>Save</button>
                <button className="cancel-button" onClick={() => setEditName(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="field-view">
              <span>{accountData.name}</span>
              <button className="edit-button" onClick={() => setEditName(true)}>Edit</button>
            </div>
          )}
        </div>

        {/* Email Field */}
        <div className="account-field">
          <label htmlFor="email">Email:</label>
          {editEmail ? (
            <div className="field-edit">
              <input
                type="email"
                id="email"
                name="email"
                value={accountData.email}
                onChange={handleInputChange}
                className="form-input"
              />
              <div className="field-buttons">
                <button className="save-button" onClick={handleSaveChanges}>Save</button>
                <button className="cancel-button" onClick={() => setEditEmail(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="field-view">
              <span>{accountData.email}</span>
              <button className="edit-button" onClick={() => setEditEmail(true)}>Edit</button>
            </div>
          )}
        </div>

        {/* Organization Field */}
        <div className="account-field">
          <label htmlFor="organization">Organization:</label>
          {editOrganization ? (
            <div className="field-edit">
              <input
                type="text"
                id="organization"
                name="organization"
                value={accountData.organization}
                onChange={handleInputChange}
                className="form-input"
              />
              <div className="field-buttons">
                <button className="save-button" onClick={handleSaveChanges}>Save</button>
                <button className="cancel-button" onClick={() => setEditOrganization(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="field-view">
              <span>{accountData.organization}</span>
              <button className="edit-button" onClick={() => setEditOrganization(true)}>Edit</button>
            </div>
          )}
        </div>

        {/* Payment Info Display */}
        <div className="account-field">
          <label>Card Number:</label>
          <span>{accountData.paymentInfo.cardNumber}</span>
        </div>
        <div className="account-field">
          <label>Expiration Date:</label>
          <span>{accountData.paymentInfo.expirationDate}</span>
        </div>
      </div>
    </div>
  );
}

export default Account;

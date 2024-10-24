import React, { useEffect, useState } from 'react';
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import OrganizationModal from './OrganizationModal';
import Cookies from 'js-cookie';
import './Account.css';

function Account() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [organizations, setOrganizations] = useState([]); 
  const [popoverOrg, setPopoverOrg] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch user data from Cognito
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const accessToken = Cookies.get('accessToken'); // Use Cookies instead of localStorage
        if (!accessToken) {
          console.error('Access token not found.');
          setLoading(false);
          return;
        }

        const client = new CognitoIdentityProviderClient({ region: 'us-east-1' });
        const command = new GetUserCommand({ AccessToken: accessToken });
        const response = await client.send(command);

        const userAttributes = response.UserAttributes.reduce((acc, attr) => {
          acc[attr.Name] = attr.Value;
          return acc;
        }, {});

        setEmail(userAttributes.email);
        setName(userAttributes.name);
        setUserId(userAttributes.sub);  // Store cognito_user_id here
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch organizations from the backend once userId is available
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!userId) {
        console.error('User ID is missing. Cannot fetch organizations.');
        return;
      }

      try {
        const apiUrl = `https://fbodckimai.execute-api.us-east-1.amazonaws.com/dev/?cognito_user_id=${userId}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error('Failed to fetch organizations');
        }

        const result = await response.json();
        setOrganizations(result.organizations || []); // Update state with organizations
        Cookies.set('organizations', JSON.stringify(result.organizations), { secure: true, sameSite: 'Strict' });
      } catch (err) {
        console.error('Error fetching organizations:', err);
      }
    };

    // Fetch organizations if userId is available
    if (userId) {
      fetchOrganizations();
    }
  }, [userId]);

  const handleOrgClick = (org) => {
    setPopoverOrg(org);
    setMessage('');
  };

  const closeModal = () => {
    setPopoverOrg(null);
  };

  return (
    <div className="account-container">
      <h1 className="account-title">Your Account</h1>
      <div className="account-card">
        {loading ? (
          <p>Loading user information...</p>
        ) : (
          <div className="account-info">
            <p><strong>Name:</strong> {name || 'No name available'}</p>
            <p><strong>Email:</strong> {email || 'No email available'}</p>
            <p><strong>User ID:</strong> {userId || 'No user ID available'}</p>
          </div>
        )}

        {organizations.length > 0 && (
          <div className="organization-list-container">
            <h2>Your Organizations</h2>
            <ul className="organization-links">
              {organizations.map((org, index) => (
                <li key={index}>
                  <button onClick={() => handleOrgClick(org)} className="org-link">
                    {org.organization_name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {popoverOrg && (
          <OrganizationModal 
            organization={popoverOrg} 
            closeModal={closeModal}
            setMessage={setMessage} 
            userId={userId} 
            organizations={organizations} 
            setOrganizations={setOrganizations} 
          />
        )}

        {message && <p className="success-message">{message}</p>}
      </div>
    </div>
  );
}

export default Account;

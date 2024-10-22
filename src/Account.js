import React, { useEffect, useState } from 'react';
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import OrganizationPopover from './OrganizationPopover'; // Import OrganizationPopover only
import './Account.css';

function Account() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [organizations, setOrganizations] = useState([]); // Holds fetched organizations
  const [popoverOrg, setPopoverOrg] = useState(null); // State to manage pop-over visibility
  const [message, setMessage] = useState(''); // Holds success/error messages
  const [loading, setLoading] = useState(true); // Track loading state

  // Fetch user data from Cognito
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const accessToken = localStorage.getItem('accessToken');
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
        setUserId(userAttributes.sub);
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch organizations from localStorage
  useEffect(() => {
    const storedOrganizations = localStorage.getItem('organizations');
    if (storedOrganizations) {
      setOrganizations(JSON.parse(storedOrganizations)); // Parse JSON string from local storage
    }
  }, []);

  // Function to handle organization click and display popover
  const handleOrgClick = (org) => {
    setPopoverOrg(org);
    setMessage(''); // Clear any previous messages
  };

  // Close the popover
  const closePopover = () => {
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

        {/* Organization Information Table */}
        {organizations.length > 0 && (
          <div className="organization-table-container">
            <h2>Your Organizations</h2>
            <table className="organization-table">
              <thead>
                <tr>
                  <th>Organization Name</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org, index) => (
                  <tr key={index}>
                    <td>
                      <button onClick={() => handleOrgClick(org)} className="org-link">
                        {org.organization_name}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Popover for Organization Details */}
        {popoverOrg && (
          <OrganizationPopover 
            organization={popoverOrg} 
            closePopover={closePopover} 
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

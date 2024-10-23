import React, { useState, useEffect, useCallback } from 'react';
import AddUserForm from './AddUserForm'; // Import AddUserForm correctly
import './OrganizationPopover.css'; // Import the CSS file for styling

function OrganizationPopover({ organization, closePopover, setMessage, userId, organizations, setOrganizations }) {
  const [isEditing, setIsEditing] = useState(false); // Track if editing mode is active
  const [newDescription, setNewDescription] = useState(organization.description); // Editable description
  const [isAddingUser, setIsAddingUser] = useState(false); // Show add user form
  const [organizationUsers, setOrganizationUsers] = useState([]); // State for storing organization users
  const [loadingUsers, setLoadingUsers] = useState(true); // Track loading state for users
  const [isEditingUsers, setIsEditingUsers] = useState(false); // Track user role editing state
  const [updatedRoles, setUpdatedRoles] = useState({}); // Track updated roles for users
  const [currentOwnerId, setCurrentOwnerId] = useState(null); // Track current organization owner
  const [isOriginalOwner, setIsOriginalOwner] = useState(false); // Track if logged-in user is/was the original owner

  // Get cognito_user_id from localStorage (logged-in user's ID)
  const cognitoUserId = localStorage.getItem('cognito_user_id');

  // Synchronize newDescription with the passed organization description when the component is updated
  useEffect(() => {
    setNewDescription(organization.description);
  }, [organization.description]);

  // Fetch users belonging to the organization
  const fetchOrganizationUsers = useCallback(async () => {
    const apiUrl = `https://p0qzdvvj17.execute-api.us-east-1.amazonaws.com/dev/?organization_name=${organization.organization_name}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizationUsers(data.users || []); // Set users array
        setLoadingUsers(false);

        // Find the current owner
        const owner = data.users.find(user => user.role_name === 'Organization_Owner');
        if (owner) {
          setCurrentOwnerId(owner.user_id);
          if (owner.cognito_user_id === cognitoUserId) {
            setIsOriginalOwner(true); // The logged-in user is the original owner
          }
        }
      } else {
        setMessage('Failed to load users.');
        setLoadingUsers(false);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('An error occurred while fetching users.');
      setLoadingUsers(false);
    }
  }, [organization.organization_name, setMessage, cognitoUserId]);

  // Fetch users when the popover is opened
  useEffect(() => {
    fetchOrganizationUsers();
  }, [fetchOrganizationUsers]);

  // Handle saving the updated description
  const handleSaveDescription = async () => {
    const apiUrl = 'https://kfjut85n37.execute-api.us-east-1.amazonaws.com/dev/';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_name: organization.organization_name,
          new_description: newDescription,
          cognito_user_id: userId,
        }),
      });

      if (response.ok) {
        setMessage('Description updated successfully.');

        // Update the organization description in the parent component state
        const updatedOrganizations = organizations.map((org) => {
          if (org.organization_name === organization.organization_name) {
            return { ...org, description: newDescription }; // Update description locally
          }
          return org;
        });

        // Update organizations in the parent component
        setOrganizations(updatedOrganizations);

        // Reflect the new description immediately in the popover
        setNewDescription(newDescription);
      } else {
        setMessage('Failed to update description.');
      }
    } catch (error) {
      console.error('Error updating description:', error);
      setMessage('An error occurred while updating.');
    }

    setIsEditing(false); // Exit editing mode
  };

  // Handle role changes
  const handleRoleChange = (userId, newRole) => {
    setUpdatedRoles({
      ...updatedRoles,
      [userId]: newRole,
    });
  };

  // Submit updated roles
  const handleSubmitRoles = async () => {
    const apiUrl = 'https://7euu9aq3j0.execute-api.us-east-1.amazonaws.com/dev/'; // Update with your endpoint

    try {
      for (const userId in updatedRoles) {
        const user = organizationUsers.find((u) => u.user_id === parseInt(userId));
        if (!user) continue;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organization_name: organization.organization_name,
            cognito_user_id: cognitoUserId, // Now using cognito_user_id from localStorage
            email: user.email,
            role_name: updatedRoles[userId], // New role for the user
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update user roles');
        }

        // If a new owner is selected, set the currentOwnerId
        if (updatedRoles[userId] === 'Organization_Owner') {
          setCurrentOwnerId(parseInt(userId));
        }
      }

      setMessage('User roles updated successfully.');
      setIsEditingUsers(false);
      fetchOrganizationUsers(); // Refresh users after update
    } catch (err) {
      setMessage('Failed to update user roles.');
    }
  };

  // Cancel role changes
  const handleCancelEditRoles = () => {
    setIsEditingUsers(false);
    setUpdatedRoles({});
  };

  return (
    <div className="popover">
      <div className="popover-content">
        <h3>{organization.organization_name}</h3>
        <p><strong>Description:</strong></p>
        {isEditing ? (
          <div>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="description-input"
            />
            <div className="form-buttons">
              <button onClick={handleSaveDescription} className="save-button">
                Save
              </button>
              <button onClick={() => setIsEditing(false)} className="cancel-edit-button">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p>{newDescription}</p>
        )}
        <p><strong>User Role:</strong> {organization.role_name}</p>

        {/* Show organization users */}
        <h4>Organization Users:</h4>
        {loadingUsers ? (
          <p>Loading users...</p>
        ) : organizationUsers.length > 0 ? (
          <ul className="no-bullets">
            {organizationUsers.map((user) => (
              <li key={user.cognito_user_id}>
                {user.email} - {isEditingUsers ? (
                  <select
                    value={updatedRoles[user.user_id] || user.role_name}
                    onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="User">User</option>
                    {/* Only allow one user to be Organization_Owner */}
                    <option 
                      value="Organization_Owner" 
                      disabled={
                        currentOwnerId && currentOwnerId !== user.user_id && !isOriginalOwner
                      }
                    >
                      Organization_Owner
                    </option>
                  </select>
                ) : (
                  user.role_name
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No users found for this organization.</p>
        )}

        {isOriginalOwner && (
          <>
            <button onClick={() => setIsEditing(true)} className="edit-button">
              Edit Description
            </button>
            {!isAddingUser ? (
              <button onClick={() => setIsAddingUser(true)} className="add-user-button">
                Add User
              </button>
            ) : (
              <AddUserForm 
                organization={organization} 
                setMessage={setMessage} 
                fetchOrganizationUsers={fetchOrganizationUsers}
                onCancel={() => setIsAddingUser(false)}  // Pass the cancel function
              />
            )}

            {!isEditingUsers ? (
              <button onClick={() => setIsEditingUsers(true)} className="edit-user-roles-button">
                Edit User Roles
              </button>
            ) : (
              <>
                <button onClick={handleSubmitRoles} className="submit-roles-button">
                  Submit
                </button>
                <button onClick={handleCancelEditRoles} className="cancel-roles-button">
                  Cancel
                </button>
              </>
            )}
          </>
        )}
        <button onClick={closePopover} className="close-button">Close</button>
      </div>
    </div>
  );
}

export default OrganizationPopover;

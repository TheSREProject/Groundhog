import React, { useState, useEffect, useCallback } from 'react';
import './OrganizationModal.css';
import OrganizationUserList from './OrganizationUserList';
import ActionButtons from './ActionButtons';
import DescriptionEditor from './DescriptionEditor';
import AddUserForm from './AddUserForm';

function OrganizationModal({
  organization,
  closeModal,
  setMessage,
  userId,
  organizations,
  setOrganizations
}) {
  const [isAddingUser, setIsAddingUser] = useState(false); // Control AddUserForm visibility
  const [isEditingUsers, setIsEditingUsers] = useState(false); // Control Edit User Role visibility
  const [organizationUsers, setOrganizationUsers] = useState([]);
  const [updatedRoles, setUpdatedRoles] = useState({});
  const [currentOwnerId, setCurrentOwnerId] = useState(null);
  const [isOriginalOwner, setIsOriginalOwner] = useState(false); // Check if user is original owner
  const [userRole, setUserRole] = useState('User'); // Store the logged-in user's role

  const cognitoUserId = localStorage.getItem('cognito_user_id');

  const fetchOrganizationUsers = useCallback(async () => {
    const apiUrl = `https://p0qzdvvj17.execute-api.us-east-1.amazonaws.com/dev/?organization_name=${organization.organization_name}&cognito_user_id=${cognitoUserId}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizationUsers(data.users || []);

        const owner = data.users.find((user) => user.role_name === 'Organization_Owner');
        if (owner) {
          setCurrentOwnerId(owner.user_id);
          if (owner.cognito_user_id === cognitoUserId) {
            setIsOriginalOwner(true); // Set original owner status
          }
        }

        // Find the logged-in user's role in this organization
        const loggedInUser = data.users.find((user) => user.cognito_user_id === cognitoUserId);
        if (loggedInUser) {
          setUserRole(loggedInUser.role_name); // Set the user's role
        }

      } else if (response.status === 403) {
        setOrganizationUsers([]);
      } else {
        setMessage('Failed to load users.');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('An error occurred while fetching users.');
    }
  }, [organization.organization_name, setMessage, cognitoUserId]);

  useEffect(() => {
    fetchOrganizationUsers();
  }, [fetchOrganizationUsers]);

  const handleRoleChange = (userId, newRole) => {
    setUpdatedRoles({
      ...updatedRoles,
      [userId]: newRole,
    });
  };

  const handleSubmitRoles = async () => {
    const apiUrl = 'https://7euu9aq3j0.execute-api.us-east-1.amazonaws.com/dev/';

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
            cognito_user_id: cognitoUserId,
            email: user.email,
            role_name: updatedRoles[userId],
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update user roles');
        }

        if (updatedRoles[userId] === 'Organization_Owner') {
          setCurrentOwnerId(parseInt(userId));
        }
      }

      setMessage('User roles updated successfully.');
      setIsEditingUsers(false);
      fetchOrganizationUsers();
    } catch (err) {
      setMessage('Failed to update user roles.');
    }
  };

  const handleCancelEditRoles = () => {
    setIsEditingUsers(false);
    setUpdatedRoles({});
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>{organization.organization_name}</h3>

        {/* Only allow the owner or admin to edit description */}
        {(userRole === 'Organization_Owner' || userRole === 'Administrator') && (
          <DescriptionEditor
            organization={organization}
            setMessage={setMessage}
            userId={userId}
            organizations={organizations}
            setOrganizations={setOrganizations}
          />
        )}

        {/* Organization User List */}
        <OrganizationUserList
          organizationUsers={organizationUsers}
          isEditingUsers={isEditingUsers}
          updatedRoles={updatedRoles}
          handleRoleChange={handleRoleChange}
          currentOwnerId={currentOwnerId}
          isOriginalOwner={isOriginalOwner}
        />

        {/* Render AddUserForm when isAddingUser is true */}
        {isAddingUser ? (
          <AddUserForm
            organization={organization}
            setMessage={setMessage}
            fetchOrganizationUsers={fetchOrganizationUsers} // Refresh users after adding
            onCancel={() => setIsAddingUser(false)} // Close the form on cancel
          />
        ) : (
          <ActionButtons
            isOriginalOwner={isOriginalOwner}
            isAddingUser={isAddingUser}
            setIsAddingUser={setIsAddingUser} // Show the AddUserForm when clicked
            isEditingUsers={isEditingUsers}
            setIsEditingUsers={setIsEditingUsers} // Show the role editor when clicked
            handleSubmitRoles={handleSubmitRoles} // Handle role submission
            handleCancelEditRoles={handleCancelEditRoles} // Handle canceling role editing
          />
        )}

        <button onClick={closeModal} className="close-button">
          Close
        </button>
      </div>
    </div>
  );
}

export default OrganizationModal;

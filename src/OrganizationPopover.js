import React, { useState, useEffect, useCallback } from 'react';
import './OrganizationPopover.css';
import OrganizationUserList from './OrganizationUserList';
import ActionButtons from './ActionButtons';
import DescriptionEditor from './DescriptionEditor';
import AddUserForm from './AddUserForm'; // Import AddUserForm

function OrganizationPopover({ organization, closePopover, setMessage, userId, organizations, setOrganizations }) {
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [organizationUsers, setOrganizationUsers] = useState([]);
  const [isEditingUsers, setIsEditingUsers] = useState(false);
  const [updatedRoles, setUpdatedRoles] = useState({});
  const [currentOwnerId, setCurrentOwnerId] = useState(null);
  const [isOriginalOwner, setIsOriginalOwner] = useState(false);

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
            setIsOriginalOwner(true);
          }
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
    <div className="popover">
      <div className="popover-content">
        <h3>{organization.organization_name}</h3>

        {/* DescriptionEditor handles description changes */}
        <DescriptionEditor
          organization={organization}
          setMessage={setMessage}
          userId={userId}
          organizations={organizations}
          setOrganizations={setOrganizations}
        />

        {/* Organization User List */}
        <OrganizationUserList
          organizationUsers={organizationUsers}
          isEditingUsers={isEditingUsers}
          updatedRoles={updatedRoles}
          handleRoleChange={handleRoleChange}
          currentOwnerId={currentOwnerId}
          isOriginalOwner={isOriginalOwner}
        />

        {/* Conditionally render the AddUserForm when isAddingUser is true */}
        {isAddingUser ? (
          <AddUserForm
            organization={organization}
            setMessage={setMessage}
            fetchOrganizationUsers={fetchOrganizationUsers} // Pass fetchOrganizationUsers prop to refresh user list
            onCancel={() => setIsAddingUser(false)} // Pass onCancel prop to close the form
          />
        ) : (
          <ActionButtons
            isOriginalOwner={isOriginalOwner}
            isAddingUser={isAddingUser}
            setIsAddingUser={setIsAddingUser}
            isEditingUsers={isEditingUsers}
            setIsEditingUsers={setIsEditingUsers}
            handleSubmitRoles={handleSubmitRoles}
            handleCancelEditRoles={handleCancelEditRoles}
          />
        )}

        <button onClick={closePopover} className="close-button">Close</button>
      </div>
    </div>
  );
}

export default OrganizationPopover;

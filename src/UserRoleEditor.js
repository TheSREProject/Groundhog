import React from 'react';

function UserRoleEditor({
  organizationUsers,
  updatedRoles,
  handleRoleChange,
  handleSubmitRoles,
  handleCancelEditRoles,
  isEditingUsers,
  currentOwnerId,
  isOriginalOwner,
}) {
  return (
    <>
      {organizationUsers.length > 0 ? (
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
                  <option
                    value="Organization_Owner"
                    disabled={currentOwnerId && currentOwnerId !== user.user_id && !isOriginalOwner}
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

      {isEditingUsers && (
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
  );
}

export default UserRoleEditor;

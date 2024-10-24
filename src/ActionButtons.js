import React from 'react';

function ActionButtons({
  isOriginalOwner,
  isAddingUser,
  setIsAddingUser,
  isEditingUsers,
  setIsEditingUsers,
  handleSubmitRoles,
  handleCancelEditRoles,
}) {
  return (
    <>
      {isOriginalOwner && (
        <div className="action-buttons-container">
          {/* Add User Button */}
          {!isAddingUser ? (
            <button onClick={() => setIsAddingUser(true)} className="add-user-button">
              Add User
            </button>
          ) : (
            <button onClick={() => setIsAddingUser(false)} className="cancel-add-user-button">
              Cancel
            </button>
          )}

          {/* Edit User Roles Button */}
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
        </div>
      )}
    </>
  );
}

export default ActionButtons;

import React, { useState, useEffect } from 'react';
import './DescriptionEditor.css';  // Import the CSS file here

function DescriptionEditor({
  organization,
  setMessage,
  userId,
  organizations,
  setOrganizations,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [newDescription, setNewDescription] = useState(organization.description);

  // Synchronize newDescription with the passed organization description when the component updates
  useEffect(() => {
    setNewDescription(organization.description);
  }, [organization.description]);

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

        const updatedOrganizations = organizations.map((org) => {
          if (org.organization_name === organization.organization_name) {
            return { ...org, description: newDescription };
          }
          return org;
        });

        setOrganizations(updatedOrganizations);
        setNewDescription(newDescription);
      } else {
        setMessage('Failed to update description.');
      }
    } catch (error) {
      console.error('Error updating description:', error);
      setMessage('An error occurred while updating.');
    }

    setIsEditing(false);
  };

  return (
    <div>
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
        <>
          <p>{newDescription}</p>
          {/* Replacing <a> with <button> styled like a link */}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="edit-link-button"
          >
            Edit Description
          </button>
        </>
      )}
    </div>
  );
}

export default DescriptionEditor;

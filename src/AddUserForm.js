import React, { useState } from 'react';
import './AddUserForm.css'; // Import the CSS file

function AddUserForm({ organization, setMessage, fetchOrganizationUsers, onCancel }) { // Add fetchOrganizationUsers prop
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('User');
  const [error, setError] = useState(null);

  const handleAddUser = async (e) => {
    e.preventDefault();
    const apiUrl = 'https://1zvdmv1qbj.execute-api.us-east-1.amazonaws.com/dev/'; // Ensure this is the correct URL
    
    const data = {
      email,
      organization_name: organization.organization_name,
      role_name: role,
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to add user');
      }

      setMessage('User added successfully.');
      setEmail('');
      setRole('User');
      
      // Fire the fetchOrganizationUsers to refresh the user list after adding a user
      await fetchOrganizationUsers();
      
      onCancel(); // Close the form after adding user
    } catch (err) {
      setError('Failed to add user. Please try again.');
    }
  };

  return (
    <div className="add-user-form-container">
      <form onSubmit={handleAddUser}>
        <div>
          <label htmlFor="email">User Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="role">Role:</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="Administrator">Administrator</option>
            <option value="User">User</option>
          </select>
        </div>
        <div className="form-buttons">
          <button type="submit" className="submit-user-button">
            Add User
          </button>
          <button
            type="button"
            className="cancel-user-button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
}

export default AddUserForm;

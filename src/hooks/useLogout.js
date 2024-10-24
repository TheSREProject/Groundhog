// src/hooks/useLogout.js
import Cookies from 'js-cookie';

export const useLogout = () => {
  const logout = () => {
    // Remove all cookies related to authentication
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('name');
    Cookies.remove('email');
    Cookies.remove('cognito_user_id');

    console.log('User logged out, cookies cleared.');
    // Optionally, you can redirect the user to a login or home page after logout
    window.location.href = '/'; // Redirect to home page or login
  };

  return { logout };
};

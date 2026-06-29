'use strict';

const { setToken } = require('../utils/api');

let currentUser = null;

const setCurrentUser = (user) => {
    currentUser = user;
};

const getCurrentUser = () => currentUser;

const handleLoginSuccess = (data, app) => {
    app.state('accessToken', data.accessToken);
    setToken(data.accessToken);
    setCurrentUser(data.user);
    
    app.state('isLoggedIn', true);
    app.state('user_name', data.user.name);
    app.state('user_ext', data.user.extension);
    
    // Clear errors if any
    app.state('auth_error', '');
    
    // Navigate to Main Dashboard
    app.navigate('MainDashboard');
};

const handleLogout = (app) => {
    setToken(null);
    setCurrentUser(null);
    app.state('isLoggedIn', false);
    app.navigate('LoginScreen');
};

module.exports = {
    setCurrentUser,
    getCurrentUser,
    handleLoginSuccess,
    handleLogout
};

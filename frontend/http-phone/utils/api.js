'use strict';

const os = require('os');

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '127.0.0.1';
}

const LOCAL_IP = getLocalIP();
const BASE_URL = `http://${LOCAL_IP}:3000/api`;

let accessToken = null;

const setToken = (token) => {
    accessToken = token;
};

const getToken = () => {
    if (global.dolphinApp) {
        const activeDeviceId = global.dolphinApp.framework.deviceContextStore.getStore();
        if (activeDeviceId) {
            return global.dolphinApp.getState('accessToken') || accessToken;
        }
    }
    return accessToken;
};

const apiFetch = async (endpoint, options = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        let data;
        try {
            data = await response.json();
        } catch (e) {
            data = {};
        }
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error(`[API Error] ${endpoint}:`, error.message);
        throw error;
    }
};

module.exports = {
    apiFetch,
    setToken,
    getToken,
    BASE_URL
};

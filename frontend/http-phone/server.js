'use strict';

/**
 * server.js — optional server-side logic for Dolphin dev server.
 * This file is auto-loaded by `dolphin dev` if present.
 *
 * @param {DolphinServer} server - The running DolphinServer instance
 */
module.exports = function(server) {
    // Handle custom server-side events here
    server.on('deviceAction', ({ id, action, value }) => {
        console.log(`[server.js] Action from ${id}: ${action} = ${value}`);
    });
};

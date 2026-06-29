'use strict';

/**
 * Store barrel — app-level state management.
 * Uses Dolphin's lightweight BinStore under the hood.
 */

const globalDefaults = {
    isLoggedIn: false,
    auth_error: '',
    login_email: '',
    login_pass: '',
    reg_name: '',
    reg_ext: '',
    reg_email: '',
    reg_pass: '',
    user_id: '',
    user_name: 'User',
    user_ext: 'N/A',
    accessToken: '',
    ws_status: 'offline',
    phone_number: '',
    device_carrier: 'Searching...',
    device_sim: 'N/A',
    call_mode: 'dolphin',
    call_mode_label: 'Dolphin Call',
    call_status: 'idle',
    call_partner_ext: '',
    call_partner_name: '',
    call_direction: 'outbound',
    call_duration_str: '00:00',
    call_log_id: '',
    conversations: [],
    groups: [],
    directory_users: [],
    contact_list_type: 'dolphin',
    sim_contacts: [],
    sim_contacts_loading: false,
    chat_partner_id: '',
    chat_partner_name: '',
    chat_partner_ext: '',
    chat_input_text: '',
    current_messages: [],
    chat_group_id: '',
    chat_group_name: '',
    group_chat_input_text: '',
    current_group_messages: [],
    new_group_name: '',
    new_group_desc: '',
    new_group_member_ids: [],
    create_group_error: '',
    meeting_room_id: ''
};

function initializeStore(app) {
    if (app.framework && app.framework._globalState) {
        Object.assign(app.framework._globalState, globalDefaults);
    }
}

function initializeDeviceContext(app, deviceId) {
    if (!deviceId) return;
    app.framework.deviceContextStore.run(deviceId, () => {
        Object.entries(globalDefaults).forEach(([key, val]) => {
            app.state(key, val);
        });
    });
}

module.exports = {
    globalDefaults,
    initializeStore,
    initializeDeviceContext
};

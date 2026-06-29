'use strict';

/**
 * Pages barrel — export all screens from one place.
 * Import example: const { HomeScreen } = require('./pages');
 */

const { HomeScreen } = require('./HomeScreen');
const { LoginScreen } = require('./LoginScreen');
const { RegisterScreen } = require('./RegisterScreen');
const { MainDashboard } = require('./MainDashboard');
const { ChatListScreen } = require('./ChatListScreen');
const { ContactsScreen } = require('./ContactsScreen');
const { MeetingsScreen } = require('./MeetingsScreen');
const { DirectChatScreen } = require('./DirectChatScreen');
const { GroupChatScreen } = require('./GroupChatScreen');
const { CreateGroupScreen } = require('./CreateGroupScreen');
const { VideoCallScreen } = require('./VideoCallScreen');
const { ContactDetailScreen } = require('./ContactDetailScreen');

module.exports = {
    HomeScreen,
    LoginScreen,
    RegisterScreen,
    MainDashboard,
    ChatListScreen,
    ContactsScreen,
    MeetingsScreen,
    DirectChatScreen,
    GroupChatScreen,
    CreateGroupScreen,
    VideoCallScreen,
    ContactDetailScreen
};

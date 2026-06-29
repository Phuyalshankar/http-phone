'use strict';

const Dolphin = require('dolphin-native');
const { WsIndicator } = require('../components/WsIndicator');

const ChatListScreen = () => {
    const conversations = Dolphin.getState('conversations') || [];
    const groups = Dolphin.getState('groups') || [];

    return (
        <div title="Chats" type="Screen" id="ChatListScreen" className="flex-column bg-gradient-slate-252-slate-254-90 h-full w-full justify-between framer-spring">
            {/* Main Content Area */}
            <div className="flex-column flex-1 w-full">
                {/* Header */}
                <div className="flex-row justify-between items-center bg-slate-252 p-4 border-b border-slate-240">
                    <div className="flex-row items-center">
                        <span className="text-xl font-bold text-white">Chats</span>
                        <WsIndicator />
                    </div>
                    <button className="bg-green-128 text-white text-sm font-semibold px-3 py-1 rounded-lg" action="app:go_to_create_group">
                        + New Group
                    </button>
                </div>

                {/* Content list */}
                <div className="flex-1 p-4 scrollable flex-column gap-4 framer-slide-up">
                    {/* Groups Section */}
                    <div className="flex-column gap-2">
                        <span className="text-xs font-bold text-slate-100 tracking-wider uppercase mb-1">Group Chats ({groups.length})</span>
                        {groups.length === 0 ? (
                            <div className="bg-slate-252 p-4 rounded-xl border border-slate-240 justify-center items-center">
                                <span className="text-sm text-slate-100">No groups joined yet</span>
                            </div>
                        ) : (
                            <div className="flex-column gap-2">
                                {groups.map(group => (
                                    <div 
                                        key={group.id} 
                                        className="flex-row items-center p-3 bg-slate-252 rounded-xl border border-slate-240 justify-between"
                                        action="app:open_group_chat"
                                        value={group.id}
                                    >
                                        <div className="flex-column flex-1">
                                            <span className="text-sm font-bold text-white">{group.name}</span>
                                            <span className="text-xs text-slate-100">{group.description || 'No description'}</span>
                                        </div>
                                        <span className="text-slate-100 text-xs">👥</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Direct Chats Section */}
                    <div className="flex-column gap-2">
                        <span className="text-xs font-bold text-slate-100 tracking-wider uppercase mb-1">Direct Messages ({conversations.length})</span>
                        {conversations.length === 0 ? (
                            <div className="bg-slate-252 p-4 rounded-xl border border-slate-240 justify-center items-center">
                                <span className="text-sm text-slate-100">No active chats</span>
                            </div>
                        ) : (
                            <div className="flex-column gap-2">
                                {conversations.map(chat => (
                                    <div 
                                        key={chat.partner.id} 
                                        className="flex-row items-center p-3 bg-slate-252 rounded-xl border border-slate-240 gap-3"
                                        action="app:open_direct_chat"
                                        value={chat.partner.id}
                                    >
                                        {/* Avatar circle */}
                                        <div className="w-10 h-10 rounded-full bg-slate-240 justify-center items-center">
                                            <span className="text-sm text-white font-bold">{chat.partner.name.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div className="flex-column flex-1">
                                            <div className="flex-row justify-between items-center">
                                                <span className="text-sm font-bold text-white">{chat.partner.name}</span>
                                                <span className="text-xs text-slate-100">Ext: {chat.partner.extension}</span>
                                            </div>
                                            <span className="text-xs text-slate-100 truncate">{chat.lastMessage ? chat.lastMessage.content : ''}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Persistent Bottom TabBar (Scrollable) */}
            <div className="flex-row bg-slate-252 border-t border-slate-240 h-16 items-center scroll-x">
                <div type="Container" className="flex-column items-center flex-1 py-2" action="app:go_to_dialer">
                    <span className="text-xl text-slate-100">📞</span>
                    <span className="text-xs text-slate-100 mt-1">Dialer</span>
                </div>
                <div type="Container" className="flex-column items-center flex-1 py-2" action="app:go_to_chats">
                    <span className="text-xl text-green-128">💬</span>
                    <span className="text-xs text-green-128 font-semibold mt-1">Chats</span>
                </div>
                <div type="Container" className="flex-column items-center flex-1 py-2" action="app:go_to_contacts">
                    <span className="text-xl text-slate-100">👤</span>
                    <span className="text-xs text-slate-100 mt-1">Contacts</span>
                </div>
                <div type="Container" className="flex-column items-center flex-1 py-2" action="app:go_to_meetings">
                    <span className="text-xl text-slate-100">📹</span>
                    <span className="text-xs text-slate-100 mt-1">Meetings</span>
                </div>
            </div>
        </div>
    );
};

module.exports = { ChatListScreen };

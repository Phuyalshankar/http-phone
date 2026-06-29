'use strict';

const Dolphin = require('dolphin-native');
const { WsIndicator } = require('../components/WsIndicator');

const MeetingsScreen = () => {
    return (
        <div title="Meetings" type="Screen" id="MeetingsScreen" className="flex-column bg-gradient-slate-252-slate-254-90 h-full w-full justify-between framer-spring">
            {/* Main Content Area */}
            <div className="flex-column flex-1 w-full justify-center">
                {/* Header */}
                <div className="flex-row justify-between items-center bg-slate-252 p-4 border-b border-slate-240">
                    <div className="flex-row items-center">
                        <span className="text-xl font-bold text-white">Video Meetings</span>
                        <WsIndicator />
                    </div>
                </div>

                {/* Form Box */}
                <div className="flex-1 p-6 flex-column justify-center gap-6 framer-slide-up">
                    <div className="bg-slate-252 p-6 rounded-2xl border border-slate-240 flex-column gap-4">
                        <span className="text-lg font-bold text-white text-center">Join or Create Room</span>
                        <p className="text-xs text-slate-100 text-center">Enter a Room ID to start or connect to a WebRTC video conference call</p>
                        
                        <input 
                            type="text" 
                            stateKey="meeting_room_id" 
                            placeholder="Enter Room ID (e.g. room123)" 
                            className="w-full p-3 bg-slate-240 text-white rounded-lg border border-slate-180 text-center text-lg font-semibold"
                        />
                        
                        <div className="flex-column gap-2 mt-2">
                            <button 
                                className="bg-green-128 text-white font-bold p-3 rounded-lg text-center" 
                                action="app:join_meeting"
                            >
                                Join Meeting Room
                            </button>
                            <button 
                                className="bg-blue-128 text-white font-bold p-3 rounded-lg text-center" 
                                action="app:create_meeting"
                            >
                                Create Instant Room
                            </button>
                        </div>
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
                    <span className="text-xl text-slate-100">💬</span>
                    <span className="text-xs text-slate-100 mt-1">Chats</span>
                </div>
                <div type="Container" className="flex-column items-center flex-1 py-2" action="app:go_to_contacts">
                    <span className="text-xl text-slate-100">👤</span>
                    <span className="text-xs text-slate-100 mt-1">Contacts</span>
                </div>
                <div type="Container" className="flex-column items-center flex-1 py-2" action="app:go_to_meetings">
                    <span className="text-xl text-green-128">📹</span>
                    <span className="text-xs text-green-128 font-semibold mt-1">Meetings</span>
                </div>
            </div>
        </div>
    );
};

module.exports = { MeetingsScreen };

'use strict';

const Dolphin = require('dolphin-native');
const { WsIndicator } = require('../components/WsIndicator');

const DirectChatScreen = () => {
    const messages = Dolphin.getState('current_messages') || [];
    const partnerName = Dolphin.getState('chat_partner_name') || 'Chat';
    const partnerExt = Dolphin.getState('chat_partner_ext') || '';
    const userId = Dolphin.getState('user_id') || '';

    return (
        <div title="Direct Chat" type="Screen" id="DirectChatScreen" className="flex-column bg-gradient-slate-252-slate-254-90 h-full w-full justify-between framer-spring">
            {/* Header */}
            <div className="flex-row justify-between items-center bg-slate-252 p-4 border-b border-slate-240">
                <div className="flex-row items-center gap-3">
                    <div className="items-center justify-center p-2" action="nav:ChatListScreen">
                        <span className="text-white text-lg font-bold">◀</span>
                    </div>
                    <div className="flex-column">
                        <span className="text-sm font-bold text-white">{partnerName}</span>
                        <span className="text-xs text-slate-100">Ext: {partnerExt}</span>
                    </div>
                    <WsIndicator />
                </div>

                <div className="flex-row gap-2">
                    <div className="bg-slate-240 rounded-lg p-2 items-center justify-center" action="app:start_call" value={partnerExt}>
                        <span className="text-white">📞</span>
                    </div>
                    <div className="bg-slate-240 rounded-lg p-2 items-center justify-center" action="app:start_video_call" value={partnerExt}>
                        <span className="text-white">📹</span>
                    </div>
                </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 p-4 scrollable flex-column gap-3 framer-slide-up">
                {messages.length === 0 ? (
                    <div className="flex-1 justify-center items-center">
                        <span className="text-xs text-slate-100">No messages yet. Send a message to start!</span>
                    </div>
                ) : (
                    <div className="flex-column gap-2">
                        {messages.map(msg => {
                            const isMe = msg.senderId === userId;
                            return (
                                <div 
                                    key={msg.id} 
                                    className={`flex-column max-w-xs p-3 rounded-2xl ${
                                        isMe 
                                            ? 'bg-green-128 text-white align-self-end rounded-tr-none' 
                                            : 'bg-slate-240 text-white align-self-start rounded-tl-none'
                                    }`}
                                >
                                    <span className="text-sm">{msg.content}</span>
                                    <span className="text-slate-100 text-xxs mt-1 align-self-end">
                                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Input Bar */}
            <div className="bg-slate-252 p-3 border-t border-slate-240 flex-row gap-2 items-center">
                <input 
                    type="text" 
                    stateKey="chat_input_text" 
                    placeholder="Type a message..." 
                    className="flex-1 p-3 bg-slate-240 text-white rounded-xl border border-slate-180 text-sm"
                />
                <div 
                    className="bg-green-128 rounded-xl px-4 py-3 items-center justify-center" 
                    action="app:send_direct_message"
                >
                    <span className="text-white font-semibold text-sm">Send</span>
                </div>
            </div>
        </div>
    );
};

module.exports = { DirectChatScreen };

'use strict';

const Dolphin = require('dolphin-native');
const { WsIndicator } = require('../components/WsIndicator');

const ContactDetailScreen = () => {
    const contact = Dolphin.getState('selected_contact') || {};
    const isSim = contact._source === 'sim';

    const avatarInitial = (contact.name || '?').charAt(0).toUpperCase();
    const primaryNumber = isSim ? contact.phone : contact.extension;

    return (
        <div title="Contact Detail" type="Screen" id="ContactDetailScreen" className="flex-column bg-slate-50 h-full w-full framer-slide-left">
            {/* Header (Material Light App Bar) */}
            <div className="flex-row items-center bg-white p-4 shadow-sm z-10 justify-between">
                <div className="flex-row items-center">
                    <button 
                        className="flex justify-center items-center p-2 rounded-full bg-slate-100 mr-4"
                        action="nav:ContactsScreen"
                    >
                        <span className="text-slate-600 text-xl font-bold">←</span>
                    </button>
                    <span className="text-xl font-bold text-slate-900">Contact Info</span>
                </div>
                <WsIndicator />
            </div>

            <div className="flex-1 scrollable flex-column items-center pt-8 px-4">
                {/* Profile Picture */}
                <div className="flex-row justify-center w-full mb-4">
                    <div className="flex-row w-32 h-32 rounded-full bg-blue-100 justify-center items-center shadow-sm border border-blue-200">
                        <span className="text-5xl text-blue-600 font-bold text-center">{avatarInitial}</span>
                    </div>
                </div>

                {/* Name & Number */}
                <span className="text-2xl font-bold text-slate-900 mb-1 text-center">{contact.name || 'Unknown'}</span>
                <span className="text-sm font-medium text-slate-800 mb-8 bg-slate-200 px-3 py-1 rounded-full text-center">{isSim ? 'SIM Contact' : 'Dolphin Directory'}</span>

                {/* Action Buttons (Floating Action Button Style) */}
                <div className="flex-row gap-8 mb-8">
                    {/* Call Action */}
                    <div className="flex-column items-center gap-2">
                        <button 
                            className="w-16 h-16 rounded-full bg-green-500 justify-center items-center shadow-md"
                            action={`app:start_call:${primaryNumber}`}
                        >
                            <span className="text-white text-2xl">📞</span>
                        </button>
                        <span className="text-sm font-semibold text-slate-600">Call</span>
                    </div>

                    {/* Chat Action (Dolphin only) */}
                    {!isSim && (
                        <div className="flex-column items-center gap-2">
                            <button 
                                className="w-16 h-16 rounded-full bg-blue-500 justify-center items-center shadow-md"
                                action={`app:open_direct_chat:${contact.id}`}
                            >
                                <span className="text-white text-2xl">💬</span>
                            </button>
                            <span className="text-sm font-semibold text-slate-600">Message</span>
                        </div>
                    )}

                    {/* Video Call Action (Dolphin only) */}
                    {!isSim && (
                        <div className="flex-column items-center gap-2">
                            <button 
                                className="w-16 h-16 rounded-full bg-purple-500 justify-center items-center shadow-md"
                                action={`app:start_video_call:${contact.extension}`}
                            >
                                <span className="text-white text-2xl">📹</span>
                            </button>
                            <span className="text-sm font-semibold text-slate-600">Video</span>
                        </div>
                    )}
                </div>

                {/* Details Card */}
                <div className="w-full bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex-column gap-5 mt-2">
                    <div className="flex-column">
                        <span className="text-xs font-bold text-blue-500 mb-1 uppercase tracking-wide">Phone Number</span>
                        <span className="text-lg text-slate-800 font-medium">{contact.phone || 'N/A'}</span>
                    </div>
                    {!isSim && (
                        <div className="flex-column">
                            <span className="text-xs font-bold text-blue-500 mb-1 uppercase tracking-wide">Extension Number</span>
                            <span className="text-lg text-slate-800 font-bold">{contact.extension || 'N/A'}</span>
                        </div>
                    )}
                    {!isSim && contact.email && (
                        <div className="flex-column">
                            <span className="text-xs font-bold text-blue-500 mb-1 uppercase tracking-wide">Email</span>
                            <span className="text-lg text-slate-800 font-medium">{contact.email}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

module.exports = { ContactDetailScreen };

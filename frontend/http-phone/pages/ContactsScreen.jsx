'use strict';

const Dolphin = require('dolphin-native');
const { WsIndicator } = require('../components/WsIndicator');

const ContactsScreen = () => {
    const contacts = Dolphin.getState('directory_users') || [];
    const isSimSelected = Dolphin.getState('contact_list_type') === 'sim';

    return (
        <div title="Contacts" type="Screen" id="ContactsScreen" className="flex-column bg-slate-100 h-full w-full justify-between framer-spring">
            {/* Main Content Area */}
            <div className="flex-column flex-1 w-full">
                {/* Header (Material Primary App Bar) */}
                <div className="flex-row justify-between items-center bg-blue-600 p-4 shadow-md z-10">
                    <div className="flex-row items-center">
                        <span className="text-xl font-bold text-white">Contacts</span>
                        <WsIndicator />
                    </div>
                    {isSimSelected && (
                        <button 
                            className="bg-white text-blue-600 text-sm font-bold rounded-lg px-3 py-1 shadow-sm"
                            action="app:refresh_sim_contacts"
                        >
                            ↻ Reload
                        </button>
                    )}
                </div>

                {/* Material UI Tabs */}
                <div className="flex-row bg-white shadow-sm z-0">
                    <div 
                        type="Container"
                        className={`flex-1 py-3 items-center justify-center border-b-2 ${
                            !isSimSelected ? 'border-blue-600' : 'border-transparent'
                        }`}
                        action="app:show_dolphin_contacts"
                    >
                        <span className={`text-sm font-bold ${!isSimSelected ? 'text-blue-600' : 'text-slate-500'}`}>Dolphin Contacts</span>
                    </div>
                    <div 
                        type="Container"
                        className={`flex-1 py-3 items-center justify-center border-b-2 ${
                            isSimSelected ? 'border-blue-600' : 'border-transparent'
                        }`}
                        action="app:show_sim_contacts"
                    >
                        <span className={`text-sm font-bold ${isSimSelected ? 'text-blue-600' : 'text-slate-500'}`}>SIM Contacts</span>
                    </div>
                </div>

                {/* List Container */}
                <div className="flex-1 p-3 scrollable flex-column framer-slide-up">
                    {isSimSelected ? (
                        // SIM Contacts List
                        Dolphin.getState('sim_contacts_loading') ? (
                            <div className="bg-white p-6 rounded-2xl shadow-sm justify-center items-center mt-2">
                                <span className="text-sm text-slate-500 font-medium">Reading device contacts...</span>
                            </div>
                        ) : (Dolphin.getState('sim_contacts') || []).length === 0 ? (
                            <div className="bg-white p-6 rounded-2xl shadow-sm justify-center items-center mt-2">
                                <span className="text-sm text-slate-500 font-medium">No SIM contacts found.</span>
                            </div>
                        ) : (
                            <div type="Container" className="flex-column gap-3">
                                {(Dolphin.getState('sim_contacts') || []).map((contact, index) => (
                                    <div 
                                        type="Container"
                                        key={`sim-${index}`} 
                                        className="flex-row items-center p-3 bg-white rounded-2xl shadow-sm w-full justify-between border border-slate-200 active:bg-slate-50"
                                        action={`app:view_contact:sim-${index}`}
                                    >
                                        <div className="flex-row items-center">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 justify-center items-center mr-4">
                                                <span className="text-lg text-blue-600 font-bold">{(contact.name || '?').charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div className="flex-column">
                                                <span className="text-base font-bold text-slate-900">{contact.name}</span>
                                                <span className="text-sm text-slate-500 mt-1">{contact.phone}</span>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-slate-50 justify-center items-center">
                                            <span className="text-blue-600 font-bold text-lg">›</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        // Dolphin Contacts List
                        contacts.length === 0 ? (
                            <div className="bg-white p-6 rounded-2xl shadow-sm justify-center items-center mt-2">
                                <span className="text-sm text-slate-500 font-medium">Loading directory...</span>
                            </div>
                        ) : (
                            <div type="Container" className="flex-column gap-3">
                                {contacts.map(contact => (
                                    <div 
                                        type="Container"
                                        key={contact.id} 
                                        className="flex-row items-center p-3 bg-white rounded-2xl shadow-sm w-full justify-between border border-slate-200 active:bg-slate-50"
                                        action={`app:view_contact:dolphin-${contact.id}`}
                                    >
                                        <div className="flex-row items-center">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 justify-center items-center mr-4">
                                                <span className="text-lg text-blue-600 font-bold">{contact.name.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div className="flex-column">
                                                <span className="text-base font-bold text-slate-900">{contact.name}</span>
                                                <span className="text-sm text-slate-500 mt-1">Ext: {contact.extension}</span>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-slate-50 justify-center items-center">
                                            <span className="text-blue-600 font-bold text-lg">›</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Persistent Bottom TabBar (Material Style) */}
            <div className="flex-row bg-white border-t border-slate-200 h-16 items-center shadow-md pb-1 z-10">
                <div type="Container" className="flex-column items-center flex-1 py-2" action="app:go_to_dialer">
                    <span className="text-xl text-slate-400">📞</span>
                    <span className="text-xs text-slate-400 font-medium mt-1">Dialer</span>
                </div>
                <div type="Container" className="flex-column items-center flex-1 py-2" action="app:go_to_chats">
                    <span className="text-xl text-slate-400">💬</span>
                    <span className="text-xs text-slate-400 font-medium mt-1">Chats</span>
                </div>
                <div type="Container" className="flex-column items-center flex-1 py-2" action="app:go_to_contacts">
                    <span className="text-xl text-blue-600">👤</span>
                    <span className="text-xs text-blue-600 font-bold mt-1">Contacts</span>
                </div>
                <div type="Container" className="flex-column items-center flex-1 py-2" action="app:go_to_meetings">
                    <span className="text-xl text-slate-400">📹</span>
                    <span className="text-xs text-slate-400 font-medium mt-1">Meetings</span>
                </div>
            </div>
        </div>
    );
};

module.exports = { ContactsScreen };

'use strict';

const Dolphin = require('dolphin-native');

const CreateGroupScreen = () => {
    const contacts = Dolphin.getState('directory_users') || [];
    const selectedIds = Dolphin.getState('new_group_member_ids') || [];
    const errorMsg = Dolphin.getState('create_group_error') || '';

    return (
        <div title="Create Group" type="Screen" id="CreateGroupScreen" className="flex-column bg-gradient-slate-252-slate-254-90 h-full w-full justify-between framer-spring">
            {/* Header */}
            <div className="flex-row justify-between items-center bg-slate-252 p-4 border-b border-slate-240">
                <div className="flex-row items-center gap-3">
                    <button className="items-center justify-center p-2 text-white text-lg font-bold bg-transparent" action="nav:ChatListScreen">◀</button>
                    <span className="text-xl font-bold text-white">Create Group</span>
                </div>
                <button className="bg-green-128 rounded-lg px-4 py-1 text-white text-sm font-semibold" action="app:submit_create_group">Done</button>
            </div>

            {/* Content Form */}
            <div className="flex-1 p-4 scrollable flex-column gap-4 framer-slide-up">
                {/* Form fields */}
                <div className="bg-slate-252 p-4 rounded-xl border border-slate-240 flex-column gap-3">
                    <span className="text-sm font-bold text-white">Group Details</span>
                    
                    <input 
                        type="text" 
                        stateKey="new_group_name" 
                        placeholder="Group Name (Required)" 
                        className="w-full p-3 bg-slate-240 text-white rounded-lg border border-slate-180 text-sm"
                    />
                    
                    <input 
                        type="text" 
                        stateKey="new_group_desc" 
                        placeholder="Description (Optional)" 
                        className="w-full p-3 bg-slate-240 text-white rounded-lg border border-slate-180 text-sm"
                    />

                    {errorMsg.length > 0 && (
                        <span className="text-xs text-red-500">{errorMsg}</span>
                    )}
                </div>

                {/* Member selection */}
                <div className="flex-column gap-2">
                    <span className="text-xs font-bold text-slate-100 tracking-wider uppercase mb-1">
                        Select Members ({selectedIds.length} Selected)
                    </span>
                    
                    <div className="flex-column gap-2">
                        {contacts.map(contact => {
                            const isSelected = selectedIds.includes(contact.id);
                            return (
                                <div 
                                    key={contact.id} 
                                    className="flex-row items-center p-3 bg-slate-252 rounded-xl border border-slate-240 justify-between"
                                >
                                    <div className="flex-row items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-240 justify-center items-center">
                                            <span className="text-sm text-white font-bold">{contact.name.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div className="flex-column">
                                            <span className="text-sm font-bold text-white">{contact.name}</span>
                                            <span className="text-xs text-slate-100">Ext: {contact.extension || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <button 
                                        className={`rounded-lg px-3 py-2 text-xs font-bold ${
                                            isSelected 
                                                ? 'bg-blue-128 text-white' 
                                                : 'bg-slate-240 text-slate-100'
                                        }`} 
                                        action="app:toggle_new_group_member" 
                                        value={contact.id}
                                    >
                                        {isSelected ? '✓ Selected' : '+ Add'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

module.exports = { CreateGroupScreen };

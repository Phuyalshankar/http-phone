'use strict';

const Dolphin = require('dolphin-native');

const WsIndicator = () => {
    const status = Dolphin.getState('ws_status') || 'disconnected';
    console.log(`[WsIndicator Render] status = ${status}`);
    
    let color = 'bg-red-128'; // disconnected (Dolphin Native red)
    if (status === 'connected') color = 'bg-green-128'; // Dolphin Native green
    else if (status === 'connecting') color = 'bg-yellow-128'; // Dolphin Native yellow

    return (
        <div type="Container" className="flex-row items-center gap-1 bg-white px-2 py-1 rounded-full border border-slate-200 shadow-sm ml-2">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-xs text-slate-500 font-bold uppercase" style={{ fontSize: '10px' }}>
                {status === 'connected' ? 'Online' : status === 'connecting' ? 'Connecting' : 'Offline'}
            </span>
        </div>
    );
};

module.exports = { WsIndicator };

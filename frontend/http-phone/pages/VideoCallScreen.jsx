'use strict';

const Dolphin = require('dolphin-native');
const { WebRTCAudio } = Dolphin;

const VideoCallScreen = () => {
    const callStatus  = Dolphin.getState('call_status')       || 'idle';
    const partnerName = Dolphin.getState('call_partner_name') || 'Unknown';
    const partnerExt  = Dolphin.getState('call_partner_ext')  || '';
    const durationStr = Dolphin.getState('call_duration_str') || '00:00';

    const isIncoming  = callStatus === 'incoming';
    const isOutgoing  = callStatus === 'outgoing';
    const isConnected = callStatus === 'connected';
    const isIdle      = callStatus === 'idle';

    return (
        <div title="Video Call" type="Screen" id="VideoCallScreen"
             className="bg-slate-900 h-full w-full flex-column">

            {/* ══════════════ INCOMING ══════════════ */}
            {isIncoming && (
                <div type="Container" className="flex-column flex-1 w-full justify-between">

                    {/* Top header */}
                    <div className="flex-column items-center mt-16 px-8">
                        <span className="text-slate-400 text-xs font-bold">INCOMING CALL</span>
                        <span className="text-white text-3xl font-black mt-3">{partnerName}</span>
                        <span className="text-green-400 text-base font-bold mt-2">Ext {partnerExt}</span>
                    </div>

                    {/* Avatar */}
                    <div className="flex-column flex-1 items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-green-700 items-center justify-center mb-3">
                            <span className="text-4xl">📞</span>
                        </div>
                        <span className="text-slate-400 text-sm">Ringing...</span>
                    </div>

                    {/* Accept / Decline row */}
                    <div className="flex-row justify-around items-center mb-16 px-12">

                        <div className="flex-column items-center">
                            <button id="btn_reject_call"
                                className="w-16 h-16 rounded-full bg-red-600 items-center justify-center"
                                action="app:reject_call">
                                <span className="text-white text-2xl font-bold">✕</span>
                            </button>
                            <span className="text-red-400 text-xs font-bold mt-2">DECLINE</span>
                        </div>

                        <div className="flex-column items-center">
                            <button id="btn_accept_call"
                                className="w-16 h-16 rounded-full bg-green-600 items-center justify-center"
                                action="app:accept_call">
                                <span className="text-white text-2xl font-bold">✓</span>
                            </button>
                            <span className="text-green-400 text-xs font-bold mt-2">ACCEPT</span>
                        </div>

                    </div>
                </div>
            )}

            {/* ══════════════ OUTGOING ══════════════ */}
            {isOutgoing && (
                <div type="Container" className="flex-column flex-1 w-full justify-between">

                    {/* Top header */}
                    <div className="flex-column items-center mt-16 px-8">
                        <span className="text-blue-400 text-xs font-bold">CALLING...</span>
                        <span className="text-white text-3xl font-black mt-3">{partnerName}</span>
                        <span className="text-blue-300 text-base font-bold mt-2">Ext {partnerExt}</span>
                    </div>

                    {/* Avatar */}
                    <div className="flex-column flex-1 items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-blue-700 items-center justify-center mb-3">
                            <span className="text-4xl">📞</span>
                        </div>
                        <span className="text-slate-400 text-sm">Waiting for answer...</span>
                    </div>

                    {/* End call */}
                    <div className="flex-column items-center mb-16">
                        <button id="btn_hangup_outgoing"
                            className="w-16 h-16 rounded-full bg-red-600 items-center justify-center"
                            action="app:hang_up_call">
                            <span className="text-white text-2xl font-bold">✕</span>
                        </button>
                        <span className="text-red-400 text-xs font-bold mt-2">END CALL</span>
                    </div>

                </div>
            )}

            {/* ══════════════ CONNECTED ══════════════ */}
            {isConnected && (
                <div type="Container" className="flex-column flex-1 w-full justify-between bg-black">

                    {/* Top info bar */}
                    <div className="flex-row justify-between items-center bg-slate-900 px-4 py-3 border-b border-slate-700">
                        <div className="flex-column">
                            <span className="text-white text-base font-bold">{partnerName}</span>
                            <span className="text-green-400 text-sm font-bold mt-1">● {durationStr}</span>
                        </div>
                        <span className="text-slate-400 text-xs">Ext {partnerExt}</span>
                    </div>

                    {/* Video area */}
                    <div className="flex-1 bg-slate-900 items-center justify-center">
                        <span className="text-slate-600 text-sm">Video Stream</span>
                        <WebRTCAudio stateKey="webrtc_audio" config="active" />
                    </div>

                    {/* Controls */}
                    <div className="flex-row justify-around items-center bg-slate-900 border-t border-slate-700 py-5 px-8">

                        <div className="flex-column items-center">
                            <button id="btn_mute"
                                className="w-12 h-12 rounded-full bg-slate-700 items-center justify-center">
                                <span className="text-white text-xl">🎙️</span>
                            </button>
                            <span className="text-slate-400 text-xs mt-1">Mute</span>
                        </div>

                        <div className="flex-column items-center">
                            <button id="btn_hangup_connected"
                                className="w-16 h-16 rounded-full bg-red-600 items-center justify-center"
                                action="app:hang_up_call">
                                <span className="text-white text-2xl font-bold">✕</span>
                            </button>
                            <span className="text-red-400 text-xs font-bold mt-1">END CALL</span>
                        </div>

                        <div className="flex-column items-center">
                            <button id="btn_speaker"
                                className="w-12 h-12 rounded-full bg-slate-700 items-center justify-center"
                                action="app:toggle_speaker">
                                <span className="text-white text-xl">{(Dolphin.getState('call_speaker') === 'on') ? '🔊' : '📱'}</span>
                            </button>
                            <span className="text-slate-400 text-xs mt-1">{(Dolphin.getState('call_speaker') === 'on') ? 'Speaker' : 'Earpiece'}</span>
                        </div>

                    </div>
                </div>
            )}

            {/* ══════════════ IDLE ══════════════ */}
            {isIdle && (
                <div type="Container" className="flex-column flex-1 w-full items-center justify-center px-8">
                    <span className="text-4xl">📵</span>
                    <span className="text-slate-400 text-base mt-3">No active call</span>
                    <button id="btn_back_from_call"
                        className="bg-slate-700 mt-6 px-6 py-3 rounded-xl"
                        action="nav:MainDashboard">
                        <span className="text-white font-bold">Go Back</span>
                    </button>
                </div>
            )}

        </div>
    );
};

module.exports = { VideoCallScreen };

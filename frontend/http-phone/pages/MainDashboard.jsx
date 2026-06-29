'use strict';

const Dolphin = require('dolphin-native');
const { WsIndicator } = require('../components/WsIndicator');

const MainDashboard = () => {
    const phoneNumber   = Dolphin.getState('phone_number')    || '';
    const userName      = Dolphin.getState('user_name')       || 'User';
    const userExt       = Dolphin.getState('user_ext')        || 'N/A';
    const carrier       = Dolphin.getState('device_carrier')  || 'Searching...';
    const sim           = Dolphin.getState('device_sim')      || 'N/A';
    const callModeLabel = Dolphin.getState('call_mode_label') || 'Dolphin Call';

    return (
        <div title="Dialer" type="Screen" id="MainDashboard"
             className="bg-slate-900 h-full w-full flex-column justify-between">

            {/* ── Top Bar ── */}
            <div className="flex-row items-center bg-slate-800 px-4 py-3 border-b border-slate-700 justify-between">
                <div className="flex-column">
                    <span className="text-white text-sm font-bold">{userName}</span>
                    <span className="text-slate-400 text-xs">Ext: {userExt}</span>
                </div>
                <div className="flex-row items-center">
                    <WsIndicator />
                    <button className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded ml-2" action="logout_submit">
                        Logout
                    </button>
                </div>
                <div className="flex-column items-end">
                    <span className="text-slate-400 text-xs">{carrier}</span>
                    <span className="text-slate-400 text-xs">SIM: {sim}</span>
                </div>
            </div>

            {/* ── Number Display ── */}
            <div className="flex-column items-center px-6 pt-5 pb-3">
                <div className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-5 py-4 flex-row items-center justify-center min-h-14">
                    <span className="text-white text-3xl font-bold text-center">{phoneNumber}</span>
                    <span className="text-blue-500 text-3xl font-bold ml-1 animate-pulse">|</span>
                </div>
                <div type="Container"
                     className="flex-row mt-3 px-5 py-2 bg-blue-900 rounded-full items-center"
                     action="app:toggle_call_mode">
                    <span className="text-blue-200 text-xs font-bold">Mode: {callModeLabel}</span>
                </div>
            </div>

            {/* ── Keypad ── */}
            <div className="flex-column flex-1 px-8 justify-center">

                {/* Row 1 */}
                <div className="flex-row justify-center gap-6 mb-6">
                    <button id="key_1" className="w-16 h-16 rounded-full bg-slate-700 items-center justify-center" action="dial_key:1">
                        <span className="text-white text-2xl font-bold">1</span>
                    </button>
                    <button id="key_2" className="w-16 h-16 rounded-full bg-slate-700 items-center justify-center" action="dial_key:2">
                        <span className="text-white text-2xl font-bold">2</span>
                    </button>
                    <button id="key_3" className="w-16 h-16 rounded-full bg-slate-700 items-center justify-center" action="dial_key:3">
                        <span className="text-white text-2xl font-bold">3</span>
                    </button>
                </div>

                {/* Row 2 */}
                <div className="flex-row justify-center gap-6 mb-6">
                    <button id="key_4" className="w-16 h-16 rounded-full bg-slate-700 items-center justify-center" action="dial_key:4">
                        <span className="text-white text-2xl font-bold">4</span>
                    </button>
                    <button id="key_5" className="w-16 h-16 rounded-full bg-slate-700 items-center justify-center" action="dial_key:5">
                        <span className="text-white text-2xl font-bold">5</span>
                    </button>
                    <button id="key_6" className="w-16 h-16 rounded-full bg-slate-700 items-center justify-center" action="dial_key:6">
                        <span className="text-white text-2xl font-bold">6</span>
                    </button>
                </div>

                {/* Row 3 */}
                <div className="flex-row justify-center gap-6 mb-6">
                    <button id="key_7" className="w-16 h-16 rounded-full bg-slate-700 items-center justify-center" action="dial_key:7">
                        <span className="text-white text-2xl font-bold">7</span>
                    </button>
                    <button id="key_8" className="w-16 h-16 rounded-full bg-slate-700 items-center justify-center" action="dial_key:8">
                        <span className="text-white text-2xl font-bold">8</span>
                    </button>
                    <button id="key_9" className="w-16 h-16 rounded-full bg-slate-700 items-center justify-center" action="dial_key:9">
                        <span className="text-white text-2xl font-bold">9</span>
                    </button>
                </div>

                {/* Row 4 */}
                <div className="flex-row justify-center gap-6 mb-6">
                    <button id="key_star" className="w-16 h-16 rounded-full bg-slate-700 items-center justify-center" action="dial_key:*">
                        <span className="text-white text-2xl font-bold">*</span>
                    </button>
                    <button id="key_0" className="w-16 h-16 rounded-full bg-slate-700 items-center justify-center" action="dial_key:0">
                        <span className="text-white text-2xl font-bold">0</span>
                    </button>
                    <button id="key_hash" className="w-16 h-16 rounded-full bg-slate-700 items-center justify-center" action="dial_key:#">
                        <span className="text-white text-2xl font-bold">#</span>
                    </button>
                </div>

                {/* Row 5 — Actions */}
                <div className="flex-row justify-center items-center gap-6 mt-2">

                    {/* Video call */}
                    <button
                         className="w-16 h-16 rounded-full bg-indigo-700 items-center justify-center"
                         action="app:dial_video_call">
                        <span className="text-white text-2xl">📹</span>
                    </button>

                    {/* Audio call — bigger */}
                    <button
                         className="w-20 h-20 rounded-full bg-green-600 items-center justify-center"
                         action="app:dial_audio_call">
                        <span className="text-white text-3xl">📞</span>
                    </button>

                    {/* Backspace */}
                    <button
                         className="w-16 h-16 rounded-full bg-slate-700 items-center justify-center"
                         action="dial_backspace">
                        <span className="text-white text-2xl">⌫</span>
                    </button>

                </div>
            </div>

            {/* ── Bottom Tab Bar ── */}
            <div className="flex-row bg-slate-800 border-t border-slate-700 h-16 items-center">
                <div type="Container" className="flex-column items-center flex-1 py-2" action="app:go_to_dialer">
                    <span className="text-green-400 text-xl">📞</span>
                    <span className="text-green-400 text-xs font-bold mt-1">Dialer</span>
                </div>
                <div type="Container" className="flex-column items-center flex-1 py-2" action="app:go_to_chats">
                    <span className="text-slate-400 text-xl">💬</span>
                    <span className="text-slate-400 text-xs mt-1">Chats</span>
                </div>
                <div type="Container" className="flex-column items-center flex-1 py-2" action="app:go_to_contacts">
                    <span className="text-slate-400 text-xl">👤</span>
                    <span className="text-slate-400 text-xs mt-1">Contacts</span>
                </div>
                <div type="Container" className="flex-column items-center flex-1 py-2" action="app:go_to_meetings">
                    <span className="text-slate-400 text-xl">📹</span>
                    <span className="text-slate-400 text-xs mt-1">Meetings</span>
                </div>
            </div>

        </div>
    );
};

module.exports = { MainDashboard };
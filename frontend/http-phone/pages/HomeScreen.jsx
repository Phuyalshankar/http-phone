'use strict';

/**
 * HomeScreen — defined using standard HTML elements.
 * Compiled directly into Titan binary and rendered as Native Android Views.
 * Supports Bootstrap, TailwindCSS, and DolphinCSS classes.
 */
const HomeScreen = () => {
    return (
        <div title="Home" type="Screen" id="HomeScreen" className="flex-column bg-light h-full w-full">
            <div type="AppBar" title="http-phone" className="bg-primary text-white p-4 shadow" />
            
            <div className="p-4 flex-column gap-4 scrollable flex-1">
                <div className="card bg-white p-4 rounded-2xl shadow">
                    <h1 className="text-xl text-slate-900 mb-2">Welcome to http-phone!</h1>
                    <p className="text-muted">This layout is written in standard HTML div tags and compiled directly to high-speed native Android views.</p>
                </div>
                
                <div className="card bg-white p-4 rounded-2xl shadow">
                    <h2 className="text-lg text-slate-900 mb-3">Bootstrap & Tailwind Ready</h2>
                    <p className="text-muted mb-4">Fully compatible with standard Bootstrap classes (card, btn, bg-primary) and Tailwind utility classes.</p>
                    <button className="btn btn-primary p-3 rounded-xl text-white" action="nav:LoginScreen">
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
};

module.exports = { HomeScreen };

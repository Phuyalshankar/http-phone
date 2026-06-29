const LoginScreen = () => {
    return (
        <div title="Login" type="Screen" id="LoginScreen" scrollable="true" className="p-4 flex-column" items="center">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Welcome Back ??</h1>
            
            <div className="flex-column gap-4 w-full">
                <input inputType="email" stateKey="login_email" className="w-full" placeholder="Email Address"></input>
                <input inputType="password" stateKey="login_pass" className="w-full" placeholder="Password"></input>
                <span stateKey="auth_error" className="text-primary text-sm mt-2 font-bold text-center"></span>
                <button className="w-full mt-4 bg-primary text-white" action="login_submit">Login</button>
            </div>
            
            <button className="mt-6 text-primary" action="nav:RegisterScreen">Create New Account</button>
        </div>
    );
};
module.exports = { LoginScreen };
const RegisterScreen = () => {
    return (
        <div title="Register" type="Screen" id="RegisterScreen" scrollable="true" className="p-4 flex-column" items="center">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Create Account</h1>
            
            <div className="flex-column gap-4 w-full">
                <input inputType="text" stateKey="reg_name" className="w-full" placeholder="Full Name"></input>
                <input inputType="text" stateKey="reg_ext" className="w-full" placeholder="Extension Number"></input>
                <input inputType="email" stateKey="reg_email" className="w-full" placeholder="Email Address"></input>
                <input inputType="password" stateKey="reg_pass" className="w-full" placeholder="Password"></input>
                <span stateKey="auth_error" className="text-primary text-sm mt-2 font-bold text-center"></span>
                <button className="w-full mt-4 bg-primary text-white" action="register_submit">Register</button>
            </div>
            
            <button className="mt-6 text-primary" action="nav:LoginScreen">Back to Login</button>
        </div>
    );
};
module.exports = { RegisterScreen };
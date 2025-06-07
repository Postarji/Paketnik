import { useContext, useState, useRef } from 'react';
import { UserContext } from '../userContext';
import { Navigate } from 'react-router-dom';

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const userContext = useContext(UserContext);

    // Za zajem slike s kamero pri prijavi
    const videoRefLogin = useRef(null);
    const [streamLogin, setStreamLogin] = useState(null);
    const [showCameraForLogin, setShowCameraForLogin] = useState(false);
    const [loginStatus, setLoginStatus] = useState('');

    async function Login(e) {
        e.preventDefault();
        setError("");
        
        try {
            const res = await fetch("http://localhost:3001/users/login", {
                method: "POST",
                credentials: "include",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                userContext.setUserContext(data);
            } else {
                setPassword("");
                const errorData = await res.json();
                setError(errorData.message || "Invalid username or password");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        }
    }

    return (
        <div className="container mt-4">
            <div className="form-container fade-in">
                <h2 className="text-center mb-4">Login</h2>
                <form onSubmit={Login}>
                    {userContext.user ? <Navigate replace to="/" /> : ""}
                    <div className="form-group">
                        <input
                            type="text"
                            className="form-control"
                            name="username"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="password"
                            className="form-control"
                            name="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    {error && (
                        <div className="alert alert-danger mb-3" role="alert">
                            {error}
                        </div>
                    )}
                    <button type="submit" className="btn btn-primary w-100">
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
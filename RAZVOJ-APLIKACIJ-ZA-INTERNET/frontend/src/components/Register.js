import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    async function Register(e) {
        e.preventDefault();
        const res = await fetch("http://localhost:3001/users", {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                username: username,
                password: password
            })
        });
        const data = await res.json();
        if (data._id !== undefined) {
            navigate('/login');
        } else {
            setUsername("");
            setPassword("");
            setEmail("");
            setError("Registration failed");
        }
    }

    return (
        <div className="container mt-4">
            <div className="form-container fade-in">
                <h2 className="text-center mb-4">Register</h2>
                <form onSubmit={Register}>
                    <div className="form-group">
                        <input
                            type="email"
                            className="form-control"
                            name="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="text"
                            className="form-control"
                            name="username"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
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
                            required
                        />
                    </div>
                    {error && (
                        <div className="alert alert-danger mb-3" role="alert">
                            {error}
                        </div>
                    )}
                    <button type="submit" className="btn btn-primary w-100">
                        Register
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Register;
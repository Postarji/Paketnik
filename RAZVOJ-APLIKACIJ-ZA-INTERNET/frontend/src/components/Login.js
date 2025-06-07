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

    const startCameraForLogin = async () => {
        if (!username) {
            setError("Najprej vnesite uporabniško ime.");
            return;
        }
        setError("");
        setLoginStatus("Pripravljam kamero...");
        setShowCameraForLogin(true);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStreamLogin(mediaStream);
            if (videoRefLogin.current) {
                videoRefLogin.current.srcObject = mediaStream;
            }
            setLoginStatus("Kamera aktivna. Pripravljeni na zajem za prijavo.");
        } catch (err) {
            console.error("Error accessing camera for login:", err);
            setLoginStatus("Napaka pri dostopu do kamere: " + err.message);
            setShowCameraForLogin(false);
        }
    };

    const stopCameraForLogin = () => {
        if (streamLogin) {
            streamLogin.getTracks().forEach(track => track.stop());
            setStreamLogin(null);
            if(videoRefLogin.current) videoRefLogin.current.srcObject = null;
        }
    };

     const captureAndLoginWithFace = async () => {
        if (videoRefLogin.current && username) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRefLogin.current.videoWidth;
            canvas.height = videoRefLogin.current.videoHeight;
            canvas.getContext('2d').drawImage(videoRefLogin.current, 0, 0);
            setLoginStatus("Zajemam sliko za prijavo...");

            const imageDataB64 = canvas.toDataURL('image/jpeg'); // Dobimo base64 string

            setLoginStatus("Pošiljam podatke za prijavo z obrazom...");
            try {
                const response = await fetch("http://localhost:3001/users/login-face-webcam", {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: username,
                        imageDataB64: imageDataB64
                    })
                });
                const data = await response.json();
                if (response.ok && data._id) {
                    userContext.setUserContext(data);
                    setLoginStatus("Uspešna prijava z obrazom!");
                    setShowCameraForLogin(false);
                } else {
                    setError("Prijava z obrazom ni uspela: " + (data.message || response.statusText));
                    setLoginStatus("");
                }
            } catch (error) {
                console.error("Error logging in with face:", error);
                setError("Napaka na strani odjemalca pri prijavi z obrazom: " + error.message);
                setLoginStatus("");
            } finally {
                stopCameraForLogin();
                 // setShowCameraForLogin(false); // Že zgoraj, če uspe
            }
        } else {
            setError("Uporabniško ime manjka ali kamera ni pripravljena.");
            setLoginStatus("");
        }
    };


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
import { useContext, useState, useRef } from 'react';
import { UserContext } from '../userContext';
import { Navigate } from 'react-router-dom';

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const userContext = useContext(UserContext);    // For capturing image with camera during login
    const videoRefLogin = useRef(null);
    const [streamLogin, setStreamLogin] = useState(null);
    const [showCameraForLogin, setShowCameraForLogin] = useState(false);
    const [loginStatus, setLoginStatus] = useState('');    async function handlePasswordLogin(e) { // renamed for clarity
        e.preventDefault();
        setError("");
        setLoginStatus("Logging in with password...");
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
            const data = await res.json();            if (data && data._id) { 
                userContext.setUserContext(data);
                setLoginStatus("Login successful!");
            } else {
                // This probably won't happen if res.ok is true and backend returns proper JSON
                setPassword("");
                setError("Unexpected response from server after successful login.");
                setLoginStatus("");
            }
        } else {
            // Handle errors if res.ok is not true (e.g. status 401, 400, 500)
            setPassword(""); // Clear password
            let errorMessage = "Incorrect username or password."; // Default message
            try {
                const errorData = await res.json(); // Try to read JSON error body
                if (errorData && errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (jsonError) {
                // If response body is not JSON, is empty, or other error occurs while reading
                console.error("Could not parse error response JSON or other error:", jsonError);
                // errorMessage remains default, or set it to something more general
                // errorMessage = "Error occurred while processing server response.";
            }
            setError(errorMessage);
            setLoginStatus("");
        }
    } catch (err) { // This catch handles errors from the fetch call itself (e.g. network errors)
        console.error("Network or other error during password login:", err); 
        setError("Network error or connection problem to server. Please try again.");
        setLoginStatus("");
    }
}    const startCameraForLogin = async () => {
        if (!username) {
            setError("Please enter username first.");
            return;
        }
        setError("");
        setLoginStatus("Preparing camera...");
        setShowCameraForLogin(true);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStreamLogin(mediaStream);
            if (videoRefLogin.current) {
                videoRefLogin.current.srcObject = mediaStream;
            }
            setLoginStatus("Camera active. Ready to capture for login.");
        } catch (err) {
            console.error("Error accessing camera for login:", err);
            setLoginStatus("Error accessing camera: " + err.message);
            setShowCameraForLogin(false);
        }
    };

    const stopCameraForLogin = () => {
        if (streamLogin) {
            streamLogin.getTracks().forEach(track => track.stop());
            setStreamLogin(null);
            if(videoRefLogin.current) videoRefLogin.current.srcObject = null;
        }
    };     const captureAndLoginWithFace = async () => {
        if (videoRefLogin.current && username) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRefLogin.current.videoWidth;
            canvas.height = videoRefLogin.current.videoHeight;
            canvas.getContext('2d').drawImage(videoRefLogin.current, 0, 0);
            setLoginStatus("Capturing image for login...");

            const imageDataB64 = canvas.toDataURL('image/jpeg'); // Get base64 string

            setLoginStatus("Sending face login data...");
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
                    setLoginStatus("Successful face login!");
                    setShowCameraForLogin(false);
                } else {
                    setError("Face login failed: " + (data.message || response.statusText));
                    setLoginStatus("");
                }
            } catch (error) {
                console.error("Error logging in with face:", error);
                setError("Client-side error during face login: " + error.message);
                setLoginStatus("");
            } finally {
                stopCameraForLogin();
                 // setShowCameraForLogin(false); // Already above if successful
            }
        } else {
            setError("Username is missing or camera is not ready.");
            setLoginStatus("");
        }
    };

    if (userContext.user) {
        return <Navigate replace to="/" />;
    }

    return (        <div className="container mt-4">
            {/* Modal window for camera during login */}
            {showCameraForLogin && (
                <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: "rgba(0,0,0,0.5)"}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Face Login</h5>
                                <button type="button" className="btn-close" onClick={() => { setShowCameraForLogin(false); stopCameraForLogin(); }}></button>
                            </div>
                            <div className="modal-body text-center">
                                <video ref={videoRefLogin} autoPlay playsInline muted width="320" height="240" style={{border: "1px solid #ccc"}}></video>
                                {streamLogin && (
                                     <button className="btn btn-success mt-2" onClick={captureAndLoginWithFace}>
                                        Capture Face and Login
                                    </button>
                                )}
                                {!streamLogin && <p>Please allow camera access.</p>}
                                <p className="mt-2">{loginStatus}</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowCameraForLogin(false); stopCameraForLogin(); }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="form-container fade-in">
                <h2 className="text-center mb-4">Login</h2>
                <form onSubmit={handlePasswordLogin}>
                    {userContext.user ? <Navigate replace to="/" /> : ""}
                    <div className="form-group">
                        <input
                            type="text"
                            className="form-control"
                            name="username"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => { setUsername(e.target.value); setError(""); }}
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="password"
                            className="form-control"
                            name="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        />
                    </div>
                    {error && (
                        <div className="alert alert-danger mb-3" role="alert">
                            {error}
                        </div>
                    )}
                    {!showCameraForLogin && loginStatus && <p className="text-info">{loginStatus}</p>}
                    <button type="submit" className="btn btn-primary w-100">
                        Login with password
                    </button>                </form>
                {/* Button for face login */}
                <button 
                    className="btn btn-outline-primary w-100 mt-3"
                    onClick={startCameraForLogin}
                    disabled={!username} // Enable only when username is entered
                >
                    <i className="bi bi-camera-fill me-2"></i>
                    Face Login (Computer Camera)
                </button>
                {!username && <small className="form-text text-muted d-block text-center mt-2">Please enter username first to use face login.</small>}
            </div>
        </div>
    );
}

export default Login;
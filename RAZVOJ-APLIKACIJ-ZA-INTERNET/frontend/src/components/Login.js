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

    async function handlePasswordLogin(e) { // preimenovala za jasnost
        e.preventDefault();
        setError("");
        setLoginStatus("Prijavljam z geslom...");
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
            if (data && data._id) { 
                userContext.setUserContext(data);
                setLoginStatus("Uspešna prijava!");
            } else {
                // To se verjetno ne bo zgodilo, če je res.ok true in backend vrne pravilen JSON
                setPassword("");
                setError("Nepričakovan odgovor od strežnika po uspešni prijavi.");
                setLoginStatus("");
            }
        } else {
            // Obravnava napak, če res.ok ni true (npr. status 401, 400, 500)
            setPassword(""); // Počisti geslo
            let errorMessage = "Napačno uporabniško ime ali geslo."; // Privzeto sporočilo
            try {
                const errorData = await res.json(); // Poskusi prebrati JSON telo napake
                if (errorData && errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (jsonError) {
                // Če telo odgovora ni JSON, je prazno, ali pride do druge napake pri branju
                console.error("Could not parse error response JSON or other error:", jsonError);
                // errorMessage ostane privzet, ali pa ga nastavite na nekaj bolj splošnega
                // errorMessage = "Prišlo je do napake pri obdelavi odgovora strežnika.";
            }
            setError(errorMessage);
            setLoginStatus("");
        }
    } catch (err) { // Ta catch lovi napake pri samem fetch klicu (npr. mrežne napake)
        console.error("Network or other error during password login:", err); 
        setError("Mrežna napaka ali težava s povezavo do strežnika. Poskusite znova.");
        setLoginStatus("");
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

    if (userContext.user) {
        return <Navigate replace to="/" />;
    }

    return (
        <div className="container mt-4">
            {/* Modalno okno za kamero pri prijavi */}
            {showCameraForLogin && (
                <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: "rgba(0,0,0,0.5)"}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Prijava z obrazom</h5>
                                <button type="button" className="btn-close" onClick={() => { setShowCameraForLogin(false); stopCameraForLogin(); }}></button>
                            </div>
                            <div className="modal-body text-center">
                                <video ref={videoRefLogin} autoPlay playsInline muted width="320" height="240" style={{border: "1px solid #ccc"}}></video>
                                {streamLogin && (
                                     <button className="btn btn-success mt-2" onClick={captureAndLoginWithFace}>
                                        Zajemi obraz in se prijavi
                                    </button>
                                )}
                                {!streamLogin && <p>Prosimo, dovolite dostop do kamere.</p>}
                                <p className="mt-2">{loginStatus}</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowCameraForLogin(false); stopCameraForLogin(); }}>
                                    Prekliči
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
                    </button>
                </form>
                {/* Gumb za prijavo z obrazom */}
                <button 
                    className="btn btn-info w-100"
                    onClick={startCameraForLogin}
                    disabled={!username} // Omogoči šele, ko je vneseno uporabniško ime
                >
                    Prijava z obrazom (računalnik)
                </button>
                {!username && <small className="form-text text-muted d-block text-center">Za prijavo z obrazom najprej vnesite uporabniško ime.</small>}
            </div>
        </div>
    );
}

export default Login;
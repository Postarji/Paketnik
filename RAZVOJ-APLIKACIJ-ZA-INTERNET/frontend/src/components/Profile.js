import { useContext, useEffect, useState, useRef} from 'react';
import { UserContext } from '../userContext';
import { Navigate, Link } from 'react-router-dom';

// URL Python API-ja
const PYTHON_API_URL = "http://localhost:8080"; // TODO

function Profile() {
    const userContext = useContext(UserContext);    const [profile, setProfile] = useState({});
    const [userPhotos, setUserPhotos] = useState([]);
    const [boxes, setBoxes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'boxes'

    // Za zajem slike s kamero
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    
    useEffect(() => {
        const getProfile = async function() {
            try {
                const [profileRes, photosRes, boxesRes] = await Promise.all([
                    // Fetch user profile
                    fetch("http://localhost:3001/users/profile", {
                        credentials: "include"
                    }),
                    // Fetch photos
                    fetch("http://localhost:3001/photos", {
                        credentials: "include"
                    }),
                    // Fetch user's boxes
                    fetch("http://localhost:3001/boxes", {
                        credentials: "include"
                    })
                ]);                // Convert responses to JSON
                const profileData = await profileRes.json();
                const photosData = await photosRes.json();
                const boxesData = await boxesRes.json();

                // Save profile data
                if (profileData && profileData._id) {
                    setProfile(profileData);
                    userContext.setUserContext(profileData); //posodobi context tukaj
                    setUserPhotos(photosData.filter(photo => 
                        photo.postedBy?._id === profileData._id
                    ));
                    setBoxes(boxesData);
                } else {
                    console.error('Invalid profile data received');
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setLoading(false);
            }
        };
        getProfile();
    }, []);

    const getImageUrl = (photo) => {
        // If path already contains the full URL, use it
        if (photo.path.startsWith('http')) {
            return photo.path;
        }
        // If path starts with /images/, remove the leading slash
        const imagePath = photo.path.startsWith('/images/') 
            ? photo.path.substring(1) 
            : photo.path.startsWith('images/') 
                ? photo.path 
                : `images/${photo.path}`;
        return `http://localhost:3001/${imagePath}`;
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setStatusMessage("Kamera aktivna. Pripravljeni na zajem.");
        } catch (err) {
            console.error("Error accessing camera:", err);
            setStatusMessage("Napaka pri dostopu do kamere: " + err.message);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            if(videoRef.current) videoRef.current.srcObject = null;
        }
    };

    const handleEnableWebcam2FA = () => {
        setShowCameraModal(true);
        startCamera();
    };

    const captureAndRegisterFace = async () => {
        if (videoRef.current && userContext.user?.username) { // Uporabimo username ali _id
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
            setStatusMessage("Zajemam sliko...");

            canvas.toBlob(async (blob) => {
                const formData = new FormData();
                formData.append('file', blob, `${userContext.user.username}_web_reg.jpg`);
                setStatusMessage("Pošiljam sliko na API...");
                try {
                    const response = await fetch(`${PYTHON_API_URL}/web_register_face/${userContext.user.username}`, {
                        method: 'POST',
                        body: formData,
                        // Brez 'Content-Type' glave, brskalnik jo nastavi pravilno za FormData
                    });
                    const data = await response.json();
                    if (response.ok) {
                        setStatusMessage("Obraz uspešno registriran! " + (data.message || ""));
                        // Mogoče posodobite stanje uporabnika, da ima nastavljen Face ID
                    } else {
                        setStatusMessage("Napaka pri registraciji obraza: " + (data.detail || response.statusText));
                    }
                } catch (error) {
                    console.error("Error registering face:", error);
                    setStatusMessage("Napaka na strani odjemalca pri registraciji: " + error.message);
                } finally {
                    stopCamera();
                    setShowCameraModal(false); // Zapri modalno okno
                }
            }, 'image/jpeg');
        } else {
            setStatusMessage("Uporabnik ni prijavljen ali kamera ni pripravljena.");
        }
    };

    const handleRequestPhone2FASetup = async () => {
        if (!userContext.user?._id) {
            setStatusMessage("Uporabnik ni prijavljen.");
            return;
        }
        setStatusMessage("Pošiljam zahtevo za nastavitev 2FA preko telefona...");
        try {
            const response = await fetch("http://localhost:3001/users/request-phone-2fa-setup", {
                method: "POST",
                credentials: "include", // Pomembno za pošiljanje piškotka seje
                headers: { 'Content-Type': 'application/json' },
                // Telo ni potrebno, ker Node.js backend dobi userId iz seje
            });
            const data = await response.json();
            if (response.ok) {
                setStatusMessage(data.message || "Zahteva uspešno poslana. Sledite navodilom na mobilni napravi.");
            } else {
                setStatusMessage("Napaka pri pošiljanju zahteve: " + (data.message || response.statusText));
            }
        } catch (error) {
            console.error("Error requesting phone 2FA setup:", error);
            setStatusMessage("Napaka na strani odjemalca: " + error.message);
        }
    };


    if (!userContext.user) {
        return <Navigate replace to="/login" />;
    }

    if (loading && !profile._id) { // Prilagojeno, da ne kaže nalaganja, če profil že imamo
        return (
            <div className="container mt-4">
                <div className="d-flex justify-content-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Preveri ali je profil._id definiran pred prikazom
    if (!profile._id && !loading) {
        // če fetch ne uspe ali uporabnik ni avtoriziran
        console.warn("Profile data is not available, user might be logged out or fetch failed.");
        // Consider redirecting to login if profile fetch fails consistently
        // return <Navigate replace to="/login" />; // za strožje preusmerjanje
        return <div className="container mt-4"><p>Could not load profile. Please try logging in again.</p></div>
    }

    const totalLikes = userPhotos.reduce((sum, photo) => 
        sum + (photo.likes?.length || 0), 0
    );

    return (
        <div className="container mt-4">
            {/* Modalno okno za kamero */}
            {showCameraModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: "rgba(0,0,0,0.5)"}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Nastavi 2FA z Web kamero</h5>
                                <button type="button" className="btn-close" onClick={() => { setShowCameraModal(false); stopCamera(); }}></button>
                            </div>
                            <div className="modal-body text-center">
                                <video ref={videoRef} autoPlay playsInline muted width="320" height="240" style={{border: "1px solid #ccc"}}></video>
                                {stream && (
                                     <button className="btn btn-success mt-2" onClick={captureAndRegisterFace}>
                                        Zajemi in shrani obraz
                                    </button>
                                )}
                                {!stream && <p>Prosimo, dovolite dostop do kamere.</p>}
                                <p className="mt-2">{statusMessage}</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowCameraModal(false); stopCamera(); }}>
                                    Prekliči
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="row">
                {/* Profile Information */}
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-body">
                            <h2 className="card-title">{profile.username}</h2>
                            <p className="card-text">
                                <i className="bi bi-envelope"></i> {profile.email}
                            </p>
                            <div className="stats mt-3">
                                <div className="row text-center">
                                    <div className="col">
                                        <h5>{userPhotos.length}</h5>
                                        <small>Posts</small>
                                    </div>
                                    <div className="col">
                                        <h5>{totalLikes}</h5>
                                        <small>Total Likes</small>
                                    </div>
                                </div>
                            </div>
                            {/* GUMBI ZA 2FA */}
                            <div className="mt-4">
                                <h5>Nastavitve 2FA</h5>
                                <button 
                                    className="btn btn-info w-100 mb-2"
                                    onClick={handleEnableWebcam2FA}
                                >
                                    Nastavi 2FA z računalniško kamero
                                </button>
                                <button 
                                    className="btn btn-warning w-100"
                                    onClick={handleRequestPhone2FASetup}
                                >
                                    Zahtevaj nastavitev 2FA preko telefona
                                </button>
                                {statusMessage && !showCameraModal && <p className="mt-2 text-muted small">{statusMessage}</p>}
                            </div>
                        </div>
                    </div>
                </div>
                        

                {/* Content Area */}
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header">
                            <ul className="nav nav-tabs card-header-tabs">
                                <li className="nav-item">
                                    <button 
                                        className={`nav-link ${activeTab === 'posts' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('posts')}
                                    >
                                        My Posts
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button 
                                        className={`nav-link ${activeTab === 'boxes' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('boxes')}
                                    >
                                        My Boxes
                                    </button>
                                </li>
                            </ul>
                        </div>
                        <div className="card-body">
                            {activeTab === 'posts' ? (
                                <div className="row row-cols-1 row-cols-md-2 g-4">
                                    {userPhotos.map(photo => (
                                        <div key={photo._id} className="col">
                                            <div className="card h-100">
                                                <img 
                                                    src={getImageUrl(photo)}
                                                    className="card-img-top"
                                                    alt={photo.name}
                                                    style={{ height: '200px', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        console.error('Error loading image:', getImageUrl(photo));
                                                        e.target.src = 'https://via.placeholder.com/300?text=Book+Image+Not+Available';
                                                    }}
                                                />
                                                <div className="card-body">
                                                    <h5 className="card-title">{photo.name}</h5>
                                                    <p className="card-text">{photo.message}</p>
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <small className="text-muted">
                                                            {new Date(photo.createdAt).toLocaleDateString()}
                                                        </small>
                                                        <div>
                                                            <span className="me-2">
                                                                <i className="bi bi-heart-fill text-danger"></i>
                                                                {photo.likes?.length || 0}
                                                            </span>
                                                            <Link to={`/photo/${photo._id}`} className="btn btn-sm btn-primary">
                                                                View
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {userPhotos.length === 0 && (
                                        <div className="col-12 text-center">
                                            <p>No posts yet.</p>
                                            <Link to="/publish" className="btn btn-primary">
                                                Create your first post
                                            </Link>
                                        </div>
                                    )}
                                </div>                            ) : (
                                <div className="boxes-grid">
                                    {boxes.length > 0 ? (
                                        <div className="row row-cols-1 row-cols-md-2 g-4">
                                            {boxes.map(box => (
                                                <div key={box._id} className="col">
                                                    <div className="card h-100">
                                                        <div className="card-body">
                                                            <h5 className="card-title">{box.name}</h5>
                                                            <p className="card-text">
                                                                <small className="text-muted">
                                                                    Location: {box.location || 'Not specified'}
                                                                </small>
                                                            </p>
                                                            <p className="card-text">
                                                                <small className="text-muted">
                                                                    Shared with: {box.allowedUsers.length} users
                                                                </small>
                                                            </p>
                                                        </div>
                                                        <div className="card-footer bg-transparent">
                                                            <div className="d-flex justify-content-between">
                                                                <Link to={`/boxes/${box._id}/logs`} 
                                                                      className="btn btn-outline-primary btn-sm">
                                                                    <i className="bi bi-clock-history me-1"></i>
                                                                    View Logs
                                                                </Link>
                                                                <Link to={`/boxes/${box._id}/edit`} 
                                                                      className="btn btn-outline-secondary btn-sm">
                                                                    <i className="bi bi-pencil me-1"></i>
                                                                    Edit
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <p className="text-muted">You don't have any parcel lockers yet.</p>
                                            <Link to="/boxes/add" className="btn btn-primary">
                                                Add Your First Box
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
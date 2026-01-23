import { useContext, useEffect, useState, useRef} from 'react';
import { UserContext } from '../userContext';
import { Navigate, Link } from 'react-router-dom';

// URL Python API-ja
const PYTHON_API_URL = "http://localhost:8080"; // TODO

function Profile() {
    const userContext = useContext(UserContext);
    const [profile, setProfile] = useState({});
    const [userPhotos, setUserPhotos] = useState([]);
    const [boxes, setBoxes] = useState([]);
    const [availableBoxes, setAvailableBoxes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'boxes'
    const [selectedPosts, setSelectedPosts] = useState([]);
    const [showBoxSelection, setShowBoxSelection] = useState(false);
    // For capturing image with camera
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
                ]);
                // Convert responses to JSON
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

    // --- FIX 1: Point to the Decompression API Endpoint ---
    const getImageUrl = (photo) => {
        if (photo.path.startsWith('http')) {
            return photo.path;
        }
        // Extract just the filename (e.g. remove "images/")
        const filename = photo.path.split('/').pop();

        // Point to the new route that handles decompression
        return `http://localhost:3001/photos/image/${filename}`;
    };

    // Handle post selection
    const handlePostSelection = (postId, isSelected) => {
        if (isSelected) {
            setSelectedPosts(prev => [...prev, postId]);
        } else {
            setSelectedPosts(prev => prev.filter(id => id !== postId));
        }
    };

    // Handle "Put in Box" button click
    const handlePutInBox = async () => {
        if (selectedPosts.length === 0) {
            alert('Please select at least one post/book first.');
            return;
        }

        try {
            console.log('Fetching available boxes...');
            const response = await fetch('http://localhost:3001/boxes/available-boxes', {
                credentials: 'include'
            });

            console.log('Response status:', response.status);
            if (response.ok) {
                const availableBoxesData = await response.json();
                setAvailableBoxes(availableBoxesData);
                setShowBoxSelection(true);
            } else {
                const errorData = await response.json();
                console.error('Error response:', errorData);
                alert(`Failed to fetch available boxes: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error fetching available boxes:', error);
            alert('Error fetching available boxes: ' + error.message);
        }
    };

    // Handle adding books to a specific box
    const handleAddToBox = async (boxId) => {
        try {
            const response = await fetch(`http://localhost:3001/boxes/${boxId}/books`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    postIds: selectedPosts
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Successfully added ${selectedPosts.length} book(s) to the box!`);
                setSelectedPosts([]);
                setShowBoxSelection(false);
                // Refresh boxes to show updated status
                const boxesRes = await fetch("http://localhost:3001/boxes", {
                    credentials: "include"
                });
                if (boxesRes.ok) {
                    const boxesData = await boxesRes.json();
                    setBoxes(boxesData);
                }
            } else {
                alert(data.message || 'Failed to add books to box');
            }
        } catch (error) {
            console.error('Error adding books to box:', error);
            alert('Error adding books to box');
        }
    };

    // Get available space in a box
    const getAvailableSpace = (box) => {
        const capacity = box.capacity || 5;
        const currentBooks = box.currentBooks ? box.currentBooks.length : 0;
        return capacity - currentBooks;
    };

    // Check if box can accommodate selected posts
    const canAccommodateSelection = (box) => {
        return getAvailableSpace(box) >= selectedPosts.length;
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setStatusMessage("Camera active. Ready to capture.");
        } catch (err) {
            console.error("Error accessing camera:", err);
            setStatusMessage("Error accessing camera: " + err.message);
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
        if (videoRef.current && userContext.user?.username) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
            setStatusMessage("Capturing image...");

            canvas.toBlob(async (blob) => {
                const formData = new FormData();
                formData.append('file', blob, `${userContext.user.username}_web_reg.jpg`);
                setStatusMessage("Sending image to API...");
                try {
                    const response = await fetch(`${PYTHON_API_URL}/web_register_face/${userContext.user.username}`, {
                        method: 'POST',
                        body: formData,
                    });
                    const data = await response.json();
                    if (response.ok) {
                        setStatusMessage("Face successfully registered! " + (data.message || ""));
                    } else {
                        setStatusMessage("Error registering face: " + (data.detail || response.statusText));
                    }
                } catch (error) {
                    console.error("Error registering face:", error);
                    setStatusMessage("Client-side error during registration: " + error.message);
                } finally {
                    stopCamera();
                    setShowCameraModal(false);
                }
            }, 'image/jpeg');
        } else {
            setStatusMessage("User not logged in or camera not ready.");
        }
    };

    const handleRequestPhone2FASetup = async () => {
        if (!userContext.user?._id) {
            setStatusMessage("User not logged in.");
            return;
        }
        setStatusMessage("Sending request for phone 2FA setup...");
        try {
            const response = await fetch("http://localhost:3001/users/request-phone-2fa-setup", {
                method: "POST",
                credentials: "include",
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (response.ok) {
                setStatusMessage(data.message || "Request sent successfully. Follow instructions on your mobile device.");
            } else {
                setStatusMessage("Error sending request: " + (data.message || response.statusText));
            }
        } catch (error) {
            console.error("Error requesting phone 2FA setup:", error);
            setStatusMessage("Client-side error: " + error.message);
        }
    };

    if (!userContext.user) {
        return <Navigate replace to="/login" />;
    }

    if (loading && !profile._id) {
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

    if (!profile._id && !loading) {
        console.warn("Profile data is not available, user might be logged out or fetch failed.");
        return <div className="container mt-4"><p>Could not load profile. Please try logging in again.</p></div>
    }

    const totalLikes = userPhotos.reduce((sum, photo) =>
        sum + (photo.likes?.length || 0), 0
    );

    return (
        <div className="container mt-4">
            {/* Camera modal window */}
            {showCameraModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: "rgba(0,0,0,0.5)"}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Setup 2FA with Web Camera</h5>
                                <button type="button" className="btn-close" onClick={() => { setShowCameraModal(false); stopCamera(); }}></button>
                            </div>
                            <div className="modal-body text-center">
                                <video ref={videoRef} autoPlay playsInline muted width="320" height="240" style={{border: "1px solid #ccc"}}></video>
                                {stream && (
                                    <button className="btn btn-success mt-2" onClick={captureAndRegisterFace}>
                                        Capture and Save Face
                                    </button>
                                )}
                                {!stream && <p>Please allow camera access.</p>}
                                <p className="mt-2">{statusMessage}</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowCameraModal(false); stopCamera(); }}>
                                    Cancel
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
                            {/* 2FA BUTTONS */}
                            <div className="mt-4">
                                <h5 className="mb-3">2FA Settings</h5>
                                <button
                                    className="btn btn-outline-success w-100 mb-2 d-flex align-items-center justify-content-center"
                                    onClick={handleEnableWebcam2FA}
                                >
                                    <i className="bi bi-camera-video me-2"></i>
                                    Setup 2FA with Computer Camera
                                </button>
                                <button
                                    className="btn btn-outline-warning w-100 d-flex align-items-center justify-content-center"
                                    onClick={handleRequestPhone2FASetup}
                                >
                                    <i className="bi bi-phone me-2"></i>
                                    Request 2FA Setup via Phone
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
                                <div>
                                    {selectedPosts.length > 0 && (
                                        <div className="alert alert-info d-flex justify-content-between align-items-center mb-4">
                                            <span>
                                                <i className="bi bi-check-circle me-2"></i>
                                                {selectedPosts.length} book(s) selected
                                            </span>
                                            <div>
                                                <button
                                                    className="btn btn-primary me-2"
                                                    onClick={handlePutInBox}
                                                >
                                                    <i className="bi bi-box me-1"></i>
                                                    Put in Box
                                                </button>
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => setSelectedPosts([])}
                                                >
                                                    Clear Selection
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="row row-cols-1 row-cols-md-2 g-4">
                                        {userPhotos.map(photo => (
                                            <div key={photo._id} className="col">
                                                <div className={`card h-100 position-relative ${selectedPosts.includes(photo._id) ? 'border-primary' : ''}`}>
                                                    <div className="position-absolute top-0 start-0 p-3" style={{ zIndex: 10 }}>
                                                        <div className="form-check">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id={`post-${photo._id}`}
                                                                checked={selectedPosts.includes(photo._id)}
                                                                onChange={(e) => handlePostSelection(photo._id, e.target.checked)}
                                                                style={{
                                                                    width: '20px',
                                                                    height: '20px',
                                                                    backgroundColor: selectedPosts.includes(photo._id) ? 'var(--primary-color)' : 'white',
                                                                    borderColor: 'var(--primary-color)',
                                                                    borderWidth: '2px'
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* --- FIX 2: Updated Image Tag with Safe Fallback --- */}
                                                    <img
                                                        src={getImageUrl(photo)}
                                                        className="card-img-top"
                                                        alt={photo.name}
                                                        style={{ height: '200px', objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            // Stop the loop!
                                                            e.target.onerror = null;
                                                            // Use Base64 placeholder (gray square)
                                                            e.target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUW0RjgAAAAASUVORK5CYII=';
                                                            e.target.style.backgroundColor = '#f0f0f0';
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
                                    </div>
                                </div>
                            ) : (
                                <div className="boxes-grid">
                                    {boxes.length > 0 ? (
                                        <div className="row row-cols-1 row-cols-md-2 g-4">
                                            {boxes.map(box => (
                                                <div key={box._id} className="col">
                                                    <div className="card h-100">
                                                        <div className="card-header d-flex justify-content-between align-items-center">
                                                            <span>
                                                                <i className={`bi ${box.status === 'available' ? 'bi-check-circle text-success' : box.status === 'occupied' ? 'bi-archive text-warning' : 'bi-tools text-danger'} me-2`}></i>
                                                                {box.status.charAt(0).toUpperCase() + box.status.slice(1)}
                                                            </span>
                                                            <span className="badge bg-secondary">
                                                                {box.currentBooks ? box.currentBooks.length : 0}/{box.capacity || 5}
                                                            </span>
                                                        </div>
                                                        <div className="card-body">
                                                            <h5 className="card-title">{box.name}</h5>
                                                            <p className="card-text">
                                                                <small className="text-muted">
                                                                    <i className="bi bi-geo-alt me-1"></i>
                                                                    {box.location || 'Not specified'}
                                                                </small>
                                                            </p>
                                                            <p className="card-text">
                                                                <small className="text-muted">
                                                                    <i className="bi bi-people me-1"></i>
                                                                    Shared with: {box.allowedUsers.length} users
                                                                </small>
                                                            </p>

                                                            {/* Current Books */}
                                                            {box.currentBooks && box.currentBooks.length > 0 && (
                                                                <div className="mt-3">
                                                                    <h6 className="text-primary">
                                                                        <i className="bi bi-book me-1"></i>
                                                                        Current Books:
                                                                    </h6>
                                                                    <div className="d-flex flex-wrap gap-1">
                                                                        {box.currentBooks.map((book, index) => (
                                                                            <span key={index} className="badge bg-light text-dark border">
                                                                                {book.postId?.name || 'Unknown Book'}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
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

            {/* Box Selection Modal */}
            {showBoxSelection && (
                <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: "rgba(0,0,0,0.5)"}}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="bi bi-box me-2"></i>
                                    Choose a Box for Your Books
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowBoxSelection(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-info">
                                    <i className="bi bi-info-circle me-2"></i>
                                    You have selected <strong>{selectedPosts.length}</strong> book(s) to put in a box.
                                </div>

                                {availableBoxes.length > 0 ? (
                                    <div className="row g-3">
                                        {availableBoxes.map(box => {
                                            const availableSpace = getAvailableSpace(box);
                                            const canAccommodate = canAccommodateSelection(box);
                                            const isDisabled = !canAccommodate || box.status === 'maintenance';

                                            return (
                                                <div key={box._id} className="col-md-6">
                                                    <div className={`card h-100 ${!isDisabled ? 'border-success' : 'border-danger'}`}>
                                                        <div className="card-header d-flex justify-content-between align-items-center">
                                                            <span>
                                                                <i className={`bi ${box.status === 'available' ? 'bi-check-circle text-success' : box.status === 'occupied' ? 'bi-archive text-warning' : 'bi-tools text-danger'} me-2`}></i>
                                                                {box.name}
                                                            </span>
                                                            <span className={`badge ${canAccommodate ? 'bg-success' : 'bg-danger'}`}>
                                                                {box.currentBooks ? box.currentBooks.length : 0}/{box.capacity || 5}
                                                            </span>
                                                        </div>
                                                        <div className="card-body">
                                                            <p className="card-text mb-2">
                                                                <small className="text-muted">
                                                                    <i className="bi bi-geo-alt me-1"></i>
                                                                    {box.location || 'Not specified'}
                                                                </small>
                                                            </p>
                                                            <p className="mb-2">
                                                                <strong>Available space:</strong> {availableSpace} slots
                                                            </p>

                                                            {!canAccommodate && box.status !== 'maintenance' && (
                                                                <div className="alert alert-warning alert-sm p-2">
                                                                    <small>
                                                                        <i className="bi bi-exclamation-triangle me-1"></i>
                                                                        Not enough space for {selectedPosts.length} books
                                                                    </small>
                                                                </div>
                                                            )}

                                                            {box.status === 'maintenance' && (
                                                                <div className="alert alert-danger alert-sm p-2">
                                                                    <small>
                                                                        <i className="bi bi-tools me-1"></i>
                                                                        Box under maintenance
                                                                    </small>
                                                                </div>
                                                            )}

                                                            {/* Current Books */}
                                                            {box.currentBooks && box.currentBooks.length > 0 && (
                                                                <div className="mt-2">
                                                                    <small className="text-muted">Current books:</small>
                                                                    <div className="d-flex flex-wrap gap-1 mt-1">
                                                                        {box.currentBooks.slice(0, 3).map((book, index) => (
                                                                            <span key={index} className="badge bg-light text-dark border" style={{fontSize: '0.7em'}}>
                                                                                {book.postId?.name || 'Unknown'}
                                                                            </span>
                                                                        ))}
                                                                        {box.currentBooks.length > 3 && (
                                                                            <span className="badge bg-secondary" style={{fontSize: '0.7em'}}>
                                                                                +{box.currentBooks.length - 3} more
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="card-footer bg-transparent">
                                                            <button
                                                                className={`btn w-100 ${canAccommodate && box.status !== 'maintenance' ? 'btn-success' : 'btn-secondary'}`}
                                                                disabled={isDisabled}
                                                                onClick={() => handleAddToBox(box._id)}
                                                            >
                                                                {isDisabled ? (
                                                                    <>
                                                                        <i className="bi bi-x-circle me-1"></i>
                                                                        Cannot Add
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <i className="bi bi-plus-circle me-1"></i>
                                                                        Add Books Here
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <i className="bi bi-inbox display-1 text-muted"></i>
                                        <h5 className="mt-3 text-muted">No Available Boxes</h5>
                                        <p className="text-muted">You don't have access to any boxes or all boxes are full.</p>
                                        <Link to="/boxes/add" className="btn btn-primary">
                                            <i className="bi bi-plus-circle me-1"></i>
                                            Add New Box
                                        </Link>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowBoxSelection(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;
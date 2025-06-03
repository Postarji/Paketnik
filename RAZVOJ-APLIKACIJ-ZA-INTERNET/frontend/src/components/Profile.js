import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../userContext';
import { Navigate, Link } from 'react-router-dom';

function Profile() {
    const userContext = useContext(UserContext);
    const [profile, setProfile] = useState({});
    const [userPhotos, setUserPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'boxes'

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
                setProfile(profileData);
                setUserPhotos(photosData.filter(photo => 
                    photo.postedBy?._id === profileData._id
                ));
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setLoading(false);
            }
        };
        getProfile();
    }, []);

    if (!userContext.user) {
        return <Navigate replace to="/login" />;
    }

    if (loading) {
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

    const totalLikes = userPhotos.reduce((sum, photo) => 
        sum + (photo.likes?.length || 0), 0
    );

    return (
        <div className="container mt-4">
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
                                                    src={`http://localhost:3001/images/${photo.path}`}
                                                    className="card-img-top"
                                                    alt={photo.name}
                                                    style={{ height: '200px', objectFit: 'cover' }}
                                                />
                                                <div className="card-body">
                                                    <h5 className="card-title">{photo.name}</h5>
                                                    <p className="card-text">{photo.message}</p>
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <small className="text-muted">
                                                            {new Date(photo.postedAt).toLocaleDateString()}
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
                            ) : (
                                <div className="text-center">
                                    <p>Box management coming soon!</p>
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
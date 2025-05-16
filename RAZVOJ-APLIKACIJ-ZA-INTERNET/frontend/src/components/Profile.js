import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../userContext';
import { Navigate } from 'react-router-dom';

function Profile() {
    const userContext = useContext(UserContext);
    const [profile, setProfile] = useState({});
    const [userPhotos, setUserPhotos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getProfile = async function() {
            try {
                const [profileRes, photosRes] = await Promise.all([
                    // Fetch user profile
                    fetch("http://localhost:3001/users/profile", {
                        credentials: "include"
                    }),
                    fetch("http://localhost:3001/photos", {
                        credentials: "include"
                    })
                ]);

                // Convert responses to JSON
                const profileData = await profileRes.json();
                const photosData = await photosRes.json();

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
        return <div className="container mt-4 loading">Loading profile...</div>;
    }

    const totalLikes = userPhotos.reduce((sum, photo) => 
        sum + (photo.likes?.length || 0), 0
    );

    return (
        <div className="container mt-4">
            <div className="profile-section fade-in">
                <div className="profile-header">
                    <div className="profile-info">
                        <h1 className="profile-name">{profile.username}</h1>
                        <p className="profile-email">{profile.email}</p>
                    </div>
                </div>

                <div className="profile-stats">
                    <div className="stat-card">
                        <p className="stat-value">{userPhotos.length}</p>
                        <p className="stat-label">Posts</p>
                    </div>
                    <div className="stat-card">
                        <p className="stat-value">{totalLikes}</p>
                        <p className="stat-label">Total Likes</p>
                    </div>
                </div>
            </div> 
        </div>
    );
}

export default Profile;
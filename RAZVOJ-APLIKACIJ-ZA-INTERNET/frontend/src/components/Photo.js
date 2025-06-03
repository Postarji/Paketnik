import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Comments from './Comments';
import { UserContext } from '../userContext';

function Photo({ photo, showDetails }) {
    const [likes, setLikes] = useState((photo.likes || []).length);
    const [dislikes, setDislikes] = useState((photo.dislikes || []).length);
    const [flags, setFlags] = useState((photo.flags || []).length);
    const [isHidden, setIsHidden] = useState(flags >= 1);// Če flag se objava skrije
    const userContext = useContext(UserContext);
    const navigate = useNavigate();

    // Format date helper function
    const formatDate = (dateString) => {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const handleVote = async (type, e) => {
        e.stopPropagation();
        if (!userContext.user) {
            alert('Please login to ' + type + ' photos');
            return;
        }

        try {
            const res = await fetch(`http://localhost:3001/photos/${photo._id}/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            if (res.ok) {
                const updatedPhoto = await res.json();
                setLikes((updatedPhoto.likes || []).length);
                setDislikes((updatedPhoto.dislikes || []).length);
            } else {
                const error = await res.json();
                if (error.message === 'User not logged in') {
                    alert('Please login to ' + type + ' photos');
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleFlag = async (e) => {
        e.stopPropagation();
        if (!userContext.user) {
            alert('Please login to flag photos');
            return;
        }

        try {
            const res = await fetch(`http://localhost:3001/photos/${photo._id}/flag`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            if (res.ok) {
                const updatedPhoto = await res.json();
                // Update the flags count from the response
                const newFlagCount = (updatedPhoto.flags || []).length;
                setFlags(newFlagCount);
                if (newFlagCount >= 1) {
                    setIsHidden(true);
                }
            } else {
                const error = await res.json();
                if (error.message === 'User not logged in') {
                    alert('Please login to flag photos');
                } else {
                    alert(error.message || 'Error flagging photo');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error flagging photo');
        }
    };

    const renderTimestamps = () => {
        const posted = formatDate(photo.createdAt);
        const updated = photo.updatedAt ? formatDate(photo.updatedAt) : null;
        
        return (
            <div className="text-muted small mb-2">
                <div>Posted: {posted}</div>
                {updated && updated !== posted && (
                    <div>Last updated: {updated}</div>
                )}
            </div>
        );
    };

    // Return early if photo is hidden
    if (isHidden) {
        return (
            <div className="card mb-4">
                <div className="card-body">
                    <p className="text-muted">This content has been hidden due to user reports.</p>
                </div>
            </div>
        );
    }

    // Format the image URL correctly
    const imageUrl = photo.path.startsWith('http') 
        ? photo.path 
        : `http://localhost:3001${photo.path}`; // Add the full base URL

    return (
        <div className="card mb-4" onClick={() => !showDetails && navigate(`/photo/${photo._id}`)}>
            <img 
                src={imageUrl}
                alt={photo.name}
                className="card-img-top"
                style={{ 
                    cursor: showDetails ? 'default' : 'pointer',
                    height: '300px', // Set a fixed height
                    objectFit: 'cover' // Maintain aspect ratio while covering the space
                }}
                onError={(e) => {
                    console.error('Error loading image:', imageUrl);
                    e.target.src = 'https://via.placeholder.com/300?text=Book+Image+Not+Available';
                }}
            />
            <div className="card-body">
                {renderTimestamps()}
                <h5 className="card-title">{photo.name}</h5>
                <p className="card-text">{photo.message}</p>
                
                <div className="d-flex justify-content-between align-items-center">
                    <div className="btn-group">
                        <button onClick={(e) => handleVote('like', e)} className="btn btn-outline-primary">
                            <i className="bi bi-hand-thumbs-up"></i> {likes}
                        </button>
                        <button onClick={(e) => handleVote('dislike', e)} className="btn btn-outline-danger">
                            <i className="bi bi-hand-thumbs-down"></i> {dislikes}
                        </button>
                        <button onClick={(e) => handleFlag(e)} className="btn btn-outline-warning">
                            <i className="bi bi-flag"></i> Report
                        </button>
                    </div>
                    <small className="text-muted">Posted by: {photo.postedBy?.username}</small>
                </div>

                {showDetails && <Comments photoId={photo._id} />}
            </div>
        </div>
    );
}

export default Photo;
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

    const handleClick = () => {
        if (!showDetails) {
            navigate(`/photo/${photo._id}`);
        }
    };

    if (isHidden) {
        return (
            <div className="photo-card fade-in">
                <div className="p-4 text-center">
                    <p className="text-muted">This photo has been hidden due to report.</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`photo-card fade-in ${!showDetails ? 'clickable' : ''}`}
            onClick={handleClick}
            style={{ cursor: !showDetails ? 'pointer' : 'default' }}
        >
            <div className="photo-image">
                <img
                    src={`http://localhost:3001${photo.path}`}
                    alt={photo.name}
                    loading="lazy"
                />
            </div>
            <div className="photo-info">
                <h3 className="photo-title">{photo.name}</h3>
                {showDetails && (
                    <>
                        <p className="photo-meta">
                            <span>By {photo.postedBy?.username || "Unknown"}</span>
                            <span>{new Date(photo.createdAt).toLocaleDateString()}</span>
                        </p>
                        {photo.message && (
                            <p className="photo-description">{photo.message}</p>
                        )}
                    </>
                )}
                <div className="photo-stats">
                    <span>👍 {likes}</span>
                    <span>👎 {dislikes}</span>
                    <span>🚩 {flags}</span>
                </div>
                <div className="photo-actions">
                    <button
                        onClick={(e) => handleVote('like', e)}
                        className="btn btn-success btn-sm me-2"
                    >
                        Like
                    </button>
                    <button
                        onClick={(e) => handleVote('dislike', e)}
                        className="btn btn-danger btn-sm me-2"
                    >
                        Dislike
                    </button>
                    <button
                        onClick={handleFlag}
                        className="btn btn-warning btn-sm"
                        title="Report inappropriate content"
                    >
                        Report
                    </button>
                </div>
            </div>
            {showDetails && <Comments photoId={photo._id} />}
        </div>
    );
}

export default Photo;
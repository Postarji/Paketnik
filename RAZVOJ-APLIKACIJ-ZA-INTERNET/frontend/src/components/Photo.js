import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Comments from './Comments';
import { UserContext } from '../userContext';

function Photo({ photo, showDetails }) {
    const [likes, setLikes] = useState((photo.likes || []).length);
    const [dislikes, setDislikes] = useState((photo.dislikes || []).length);
    const [flags, setFlags] = useState((photo.flags || []).length);
    const [isHidden, setIsHidden] = useState(flags >= 10); // Changed threshold to 10
    const userContext = useContext(UserContext);
    const navigate = useNavigate();

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
            alert('Please login to flag posts');
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
                const newFlagCount = (updatedPhoto.flags || []).length;
                setFlags(newFlagCount);
                if (newFlagCount >= 10) {
                    setIsHidden(true);
                }
            } else {
                const error = await res.json();
                if (error.message === 'User not logged in') {
                    alert('Please login to flag posts');
                } else {
                    alert(error.message || 'Error flagging post');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error flagging post');
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

    const renderFlagWarning = () => {
        if (flags >= 5 && flags < 10) {
            return (
                <div className="alert alert-warning mt-2" role="alert">
                    <small>
                        This post has {flags} reports. It will be hidden at 10 reports.
                    </small>
                </div>
            );
        }
        return null;
    };

    if (isHidden) {
        return (
            <div className="card mb-4">
                <div className="card-body">
                    <p className="text-muted text-center">
                        <i className="bi bi-eye-slash me-2"></i>
                        This post has been hidden due to receiving 10 or more reports.
                    </p>
                </div>
            </div>
        );
    }

    const imageUrl = photo.path.startsWith('http')
        ? photo.path
        : `http://localhost:3001/photos/image/${photo.path.split('/').pop()}`;

    return (
        <div className="card mb-4" onClick={() => !showDetails && navigate(`/photo/${photo._id}`)}>
            <img
                src={imageUrl}
                alt={photo.name}
                className="card-img-top"
                style={{
                    cursor: showDetails ? 'default' : 'pointer',
                    height: '300px',
                    objectFit: 'cover'
                }}
                onError={(e) => {
                    e.target.onerror = null;

                    console.warn('Image failed to load:', imageUrl);

                    e.target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUW0RjgAAAAASUVORK5CYII=';

                    e.target.style.objectFit = 'contain';
                    e.target.style.backgroundColor = '#f0f0f0';
                }}
            />
            <div className="card-body">
                {renderTimestamps()}
                <h5 className="card-title">{photo.name}</h5>
                <p className="card-text">{photo.message}</p>
                {renderFlagWarning()}
                
                <div className="d-flex justify-content-between align-items-center">
                    <div className="btn-group">
                        <button onClick={(e) => handleVote('like', e)} className="btn btn-outline-primary">
                            <i className="bi bi-hand-thumbs-up"></i> {likes}
                        </button>
                        <button onClick={(e) => handleVote('dislike', e)} className="btn btn-outline-danger">
                            <i className="bi bi-hand-thumbs-down"></i> {dislikes}
                        </button>
                        <button onClick={(e) => handleFlag(e)} className="btn btn-outline-warning">
                            <i className="bi bi-flag"></i> Report {flags > 0 ? `(${flags})` : ''}
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
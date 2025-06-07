import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../userContext';
import Photo from './Photo';

function PhotoDetail() {
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();
    const userContext = useContext(UserContext);

    useEffect(() => {
        const getPhoto = async () => {
            try {
                const res = await fetch(`http://localhost:3001/photos/${id}`, {
                    credentials: 'include'
                });
                if (!res.ok) {
                    setError('Photo not found');
                    return;
                }
                const data = await res.json();
                setPhoto(data);
            } catch (error) {
                console.error('Error fetching photo:', error);
                setError('Error loading photo');
            } finally {
                setLoading(false);
            }
        };
        getPhoto();
    }, [id]);

    const handleDelete = async () => {
        try {
            const res = await fetch(`http://localhost:3001/photos/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (res.ok) {
                navigate('/'); // Redirect to homepage after successful delete
            } else {
                const error = await res.json();
                setError(error.message || 'Error deleting photo');
            }
        } catch (err) {
            console.error('Error:', err);
            setError('Error deleting photo');
        }
    };

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

    if (error) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
                <button onClick={() => navigate('/')} className="btn btn-primary">
                    Back to Photos
                </button>
            </div>
        );
    }

    const isOwner = userContext.user && photo.postedBy._id === userContext.user._id;

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <button onClick={() => navigate('/')} className="btn btn-secondary">
                    Back to Photos
                </button>
                {isOwner && (
                    <div className="btn-group">
                        <button 
                            onClick={() => navigate(`/photo/edit/${id}`)} 
                            className="btn btn-primary"
                        >
                            Edit Book
                        </button>
                        <button 
                            onClick={() => setShowDeleteConfirm(true)} 
                            className="btn btn-danger"
                        >
                            Delete Book
                        </button>
                    </div>
                )}
            </div>
            
            {showDeleteConfirm && (
                <div className="alert alert-warning mb-3">
                    <p>Are you sure you want to delete this book? This action cannot be undone.</p>
                    <div className="d-flex gap-2">
                        <button 
                            className="btn btn-danger" 
                            onClick={handleDelete}
                        >
                            Yes, Delete
                        </button>
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => setShowDeleteConfirm(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <Photo photo={photo} showDetails={true} />
        </div>
    );
}

export default PhotoDetail;
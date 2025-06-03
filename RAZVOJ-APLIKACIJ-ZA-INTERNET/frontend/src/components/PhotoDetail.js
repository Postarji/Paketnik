import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../userContext';
import Photo from './Photo';

function PhotoDetail() {
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
                    <button 
                        onClick={() => navigate(`/photo/edit/${id}`)} 
                        className="btn btn-primary"
                    >
                        Edit Book
                    </button>
                )}
            </div>
            <Photo photo={photo} showDetails={true} />
        </div>
    );
}

export default PhotoDetail;
import { useContext, useState, useEffect } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../userContext';

function EditPhoto() {
    const { id } = useParams(); // Get photo ID from URL
    const navigate = useNavigate();
    const userContext = useContext(UserContext);
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [photo, setPhoto] = useState(null);

    // Fetch photo data when component mounts
    useEffect(() => {
        const fetchPhoto = async () => {
            try {
                const response = await fetch(`http://localhost:3001/photos/${id}`, {
                    credentials: 'include'
                });
                const data = await response.json();

                if (response.ok) {
                    // Only allow editing if user is the owner
                    if (data.postedBy._id !== userContext.user._id) {
                        setError('You are not authorized to edit this photo');
                        return;
                    }

                    setPhoto(data);
                    setName(data.name);
                    setMessage(data.message || '');
                } else {
                    setError('Failed to fetch photo');
                }
            } catch (err) {
                setError('Error fetching photo');
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPhoto();
    }, [id, userContext.user._id]);

    async function onSubmit(e) {
        e.preventDefault();
        setError('');

        if (!name) {
            setError('Please enter a name for the photo');
            return;
        }

        try {
            const res = await fetch(`http://localhost:3001/photos/${id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    message
                })
            });

            const data = await res.json();
            
            if (res.ok) {
                navigate(`/photo/${id}`); // Redirect to photo detail page
            } else {
                setError(data.message || 'Update failed');
            }
        } catch (err) {
            setError('Error updating photo. Please try again.');
            console.error('Error:', err);
        }
    }

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

    if (error) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
                <button 
                    className="btn btn-primary"
                    onClick={() => navigate(-1)}
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="form-container fade-in">
                <h2 className="text-center mb-4">Edit Book</h2>
                <form onSubmit={onSubmit}>
                    <div className="form-group mb-3">
                        <label htmlFor="name" className="form-label">Book Name</label>
                        <input
                            type="text"
                            id="name"
                            className="form-control"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group mb-3">
                        <label htmlFor="message" className="form-label">Description</label>
                        <textarea
                            id="message"
                            className="form-control"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows="3"
                        />
                    </div>

                    {photo && (
                        <div className="mb-3">
                            <label className="form-label">Current Image</label>
                            <div className="preview-container">
                                <img
                                    src={`http://localhost:3001/images/${photo.path}`}
                                    alt={photo.name}
                                    className="img-fluid rounded"
                                    style={{ maxHeight: '200px' }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-primary flex-grow-1">
                            Update Book
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-secondary"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditPhoto;

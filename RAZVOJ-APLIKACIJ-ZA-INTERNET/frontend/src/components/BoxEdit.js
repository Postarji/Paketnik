import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserContext } from '../userContext';

function BoxEdit() {
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const userContext = useContext(UserContext);
    const { id } = useParams();

    useEffect(() => {
        const fetchBox = async () => {
            try {
                const res = await fetch(`http://localhost:3001/boxes/${id}`, {
                    credentials: 'include'
                });

                if (!res.ok) {
                    throw new Error('Failed to fetch box details');
                }

                const data = await res.json();
                setName(data.name);
                setLocation(data.location || '');
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (userContext.user) {
            fetchBox();
        }
    }, [id, userContext.user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const res = await fetch(`http://localhost:3001/boxes/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    name,
                    location,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update box');
            }

            navigate('/boxes');
        } catch (err) {
            setError(err.message);
        }
    };

    if (!userContext.user) {
        return (
            <div className="container mt-4">
                <div className="alert alert-warning">
                    Please log in to edit box details.
                </div>
            </div>
        );
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
                <div className="alert alert-danger">
                    Error: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="card">
                        <div className="card-body">
                            <h2 className="card-title text-center mb-4">Edit Parcel Locker</h2>
                            
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="name" className="form-label">Box Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        placeholder="e.g. Home Box, Office Box"
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="location" className="form-label">Location</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="location"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="e.g. Front door, Side entrance"
                                    />
                                </div>

                                <div className="d-grid gap-2">
                                    <button type="submit" className="btn btn-primary">
                                        Save Changes
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-secondary"
                                        onClick={() => navigate('/boxes')}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BoxEdit;

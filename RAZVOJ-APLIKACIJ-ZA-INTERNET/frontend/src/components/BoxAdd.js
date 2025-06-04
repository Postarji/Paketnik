import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../userContext';

function BoxAdd() {
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const userContext = useContext(UserContext);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);

        try {
            const res = await fetch('http://localhost:3001/boxes', {
                method: 'POST',
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
                throw new Error(data.message || 'Failed to add box');
            }

            navigate('/boxes');
        } catch (err) {
            setError(err.message);
        }
    }

    if (!userContext.user) {
        return (
            <div className="container mt-4">
                <div className="alert alert-warning">
                    Please log in to add a smart parcel locker.
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
                            <h2 className="card-title text-center mb-4">Add New Parcel Locker</h2>
                            
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
                                        Add Box
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

export default BoxAdd;

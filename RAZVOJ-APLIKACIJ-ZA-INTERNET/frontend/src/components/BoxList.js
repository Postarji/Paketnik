import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../userContext';

function BoxList() {
    const [boxes, setBoxes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const userContext = useContext(UserContext);

    useEffect(() => {
        const fetchBoxes = async () => {
            try {
                const res = await fetch('http://localhost:3001/boxes', {
                    credentials: 'include'
                });
                
                if (!res.ok) {
                    throw new Error('Failed to fetch boxes');
                }
                
                const data = await res.json();
                setBoxes(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (userContext.user) {
            fetchBoxes();
        }
    }, [userContext.user]);

    if (!userContext.user) {
        return (
            <div className="container mt-4">
                <div className="alert alert-warning">
                    Please log in to view your smart parcel lockers.
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

    return (        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Smart Parcel Lockers</h2>
                {userContext.user?.role === 'admin' && (
                    <Link to="/boxes/add" className="btn btn-primary">
                        <i className="bi bi-plus-circle me-2"></i>
                        Add New Box
                    </Link>
                )}
            </div>
            
            {boxes.length === 0 ? (
                <div className="text-center">
                    <p className="text-muted">No parcel lockers available.</p>
                    {userContext.user?.role === 'admin' && (
                        <Link to="/boxes/add" className="btn btn-primary">
                            Add Your First Box
                        </Link>
                    )}
                </div>
            ) : (
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                    {boxes.map(box => {
                        const isOwner = box.owner._id === userContext.user._id;
                        const isAllowedUser = box.allowedUsers.some(user => user._id === userContext.user._id);
                        const isAdminPublic = box.owner.role === 'admin' && !isOwner && !isAllowedUser;
                        
                        return (
                            <div key={box._id} className="col">
                                <div className="card h-100">
                                    {isAdminPublic && (
                                        <div className="card-header bg-info text-white py-2">
                                            <small><i className="bi bi-globe me-1"></i>Public Box</small>
                                        </div>
                                    )}
                                    <div className="card-body">
                                        <h5 className="card-title">{box.name}</h5>
                                        <p className="card-text">
                                            <small className="text-muted">
                                                Location: {box.location || 'Not specified'}
                                            </small>
                                        </p>
                                        {isOwner && (
                                            <p className="card-text">
                                                <small className="text-success">
                                                    <i className="bi bi-person-check me-1"></i>
                                                    You own this box
                                                </small>
                                            </p>
                                        )}
                                        {isAllowedUser && !isOwner && (
                                            <p className="card-text">
                                                <small className="text-primary">
                                                    <i className="bi bi-share me-1"></i>
                                                    Shared with you
                                                </small>
                                            </p>
                                        )}
                                        {isAdminPublic && (
                                            <p className="card-text">
                                                <small className="text-info">
                                                    <i className="bi bi-person-badge me-1"></i>
                                                    Created by: {box.owner.username}
                                                </small>
                                            </p>
                                        )}
                                        <p className="card-text">
                                            <small className="text-muted">
                                                Shared with: {box.allowedUsers.length} users
                                            </small>
                                        </p>
                                    </div>
                                    <div className="card-footer bg-transparent">
                                        <div className="d-flex justify-content-between">
                                            <Link to={`/boxes/${box._id}/logs`} className="btn btn-outline-primary btn-sm">
                                                <i className="bi bi-clock-history me-1"></i>
                                                View Logs
                                            </Link>
                                            {(userContext.user?.role === 'admin' || isOwner) && (
                                                <Link to={`/boxes/${box._id}/edit`} className="btn btn-outline-secondary btn-sm">
                                                    <i className="bi bi-pencil me-1"></i>
                                                    Edit
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default BoxList;
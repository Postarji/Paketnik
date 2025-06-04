import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../userContext';

function BoxLogs() {
    const [logs, setLogs] = useState([]);
    const [box, setBox] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();
    const userContext = useContext(UserContext);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch box details
                const boxRes = await fetch(`http://localhost:3001/boxes/${id}`, {
                    credentials: 'include'
                });
                
                if (!boxRes.ok) {
                    throw new Error('Failed to fetch box details');
                }
                
                const boxData = await boxRes.json();
                setBox(boxData);

                // Fetch unlock logs
                const logsRes = await fetch(`http://localhost:3001/boxes/${id}/unlock-history`, {
                    credentials: 'include'
                });
                
                if (!logsRes.ok) {
                    throw new Error('Failed to fetch unlock logs');
                }
                
                const logsData = await logsRes.json();
                setLogs(logsData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (userContext.user) {
            fetchData();
        }
    }, [id, userContext.user]);

    if (!userContext.user) {
        return (
            <div className="container mt-4">
                <div className="alert alert-warning">
                    Please log in to view box logs.
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

    function formatDate(dateString) {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    function getMethodIcon(method) {
        switch (method) {
            case 'password':
                return 'bi-key';
            case 'facial':
                return 'bi-person-badge';
            case 'mobile':
                return 'bi-phone';
            default:
                return 'bi-question-circle';
        }
    }

    function getMethodLabel(method) {
        switch (method) {
            case 'password':
                return 'Password';
            case 'facial':
                return 'Facial Recognition';
            case 'mobile':
                return 'Mobile App';
            default:
                return 'Unknown';
        }
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    Unlock Logs - {box.name}
                    <small className="text-muted ms-2" style={{ fontSize: '1rem' }}>
                        {box.location && `(${box.location})`}
                    </small>
                </h2>
                <button 
                    onClick={() => navigate('/boxes')} 
                    className="btn btn-outline-secondary"
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Boxes
                </button>
            </div>

            {logs.length === 0 ? (
                <div className="alert alert-info">
                    No unlock events recorded yet.
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>User</th>
                                <th>Method</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log._id}>
                                    <td>{formatDate(log.timestamp)}</td>
                                    <td>{log.user.username}</td>
                                    <td>
                                        <i className={`bi ${getMethodIcon(log.unlockMethod)} me-2`}></i>
                                        {getMethodLabel(log.unlockMethod)}
                                    </td>
                                    <td>
                                        <span className={`badge ${log.success ? 'bg-success' : 'bg-danger'}`}>
                                            {log.success ? 'Success' : 'Failed'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default BoxLogs;

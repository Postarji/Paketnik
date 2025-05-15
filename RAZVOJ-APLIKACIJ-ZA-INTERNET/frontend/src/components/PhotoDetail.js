import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Photo from './Photo';

function PhotoDetail() {
    const [photo, setPhoto] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const getPhoto = async () => {
            try {
                const res = await fetch(`http://localhost:3001/photos/${id}`);
                if (!res.ok) {
                    navigate('/'); // Redirect to home if photo not found
                    return;
                }
                const data = await res.json();
                setPhoto(data);
            } catch (error) {
                console.error('Error fetching photo:', error);
                navigate('/');
            }
        };
        getPhoto();
    }, [id, navigate]);

    if (!photo) {
        return <div className="container mt-4">Loading...</div>;
    }

    return (
        <div className="container mt-4">
            <button onClick={() => navigate('/')} className="btn btn-secondary mb-3">
                Back to Photos
            </button>
            <Photo photo={photo} showDetails={true} />
        </div>
    );
}

export default PhotoDetail;
import { useState, useEffect } from 'react';
import Photo from './Photo';

function Photos() {
    const [photos, setPhotos] = useState([]);
    
    useEffect(function(){
        const getPhotos = async function(){
            const res = await fetch("http://localhost:3001/photos");
            const data = await res.json();
            setPhotos(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        }
        getPhotos();
    }, []);

    return (
        <div className="container mt-4">
            <h2 className="text-center mb-4">Book Gallery</h2>
            <div className="photos-grid">
                {photos.map(photo => (
                    <Photo 
                        photo={photo} 
                        key={photo._id} 
                        showDetails={false}
                    />
                ))}
            </div>
            {photos.length === 0 && (
                <p className="text-center text-muted">No books available</p>
            )}
        </div>
    );
}

export default Photos;
import { useContext, useState } from 'react'
import { Navigate } from 'react-router';
import { UserContext } from '../userContext';

function AddPhoto() {
    const userContext = useContext(UserContext);
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [file, setFile] = useState('');
    const [uploaded, setUploaded] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    async function onSubmit(e) {
        e.preventDefault();
        setError('');

        if (!name) {
            setError("Please enter a name for the photo");
            return;
        }

        if (!file) {
            setError("Please select a photo to upload");
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('message', message);
        formData.append('image', file);

        try {
            const res = await fetch('http://localhost:3001/photos', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            const data = await res.json();
            
            if (res.ok) {
                setUploaded(true);
            } else {
                setError(data.message || 'Upload failed');
            }
        } catch (err) {
            setError('Error uploading photo. Please try again.');
        }
    }

    return (
        <div className="container mt-4">
            <div className="form-container fade-in">
                <h2 className="text-center mb-4">Upload New Book</h2>
                <form onSubmit={onSubmit}>
                    {!userContext.user ? <Navigate replace to="/login" /> : ""}
                    {uploaded ? <Navigate replace to="/" /> : ""}
                    
                    <div className="form-group">
                        <label htmlFor="name" className="form-label">Book Name</label>
                        <input
                            type="text"
                            id="name"
                            className="form-control"
                            placeholder="Enter photo name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="message" className="form-label">Description</label>
                        <textarea
                            id="message"
                            className="form-control"
                            placeholder="Add a description"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="file" className="form-label">Choose Photo</label>
                        <input
                            type="file"
                            id="file"
                            className="form-control"
                            onChange={handleFileChange}
                            accept="image/*"
                        />
                    </div>

                    {preview && (
                        <div className="mb-3">
                            <label className="form-label">Preview</label>
                            <div className="preview-container">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="img-preview"
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-danger mb-3" role="alert">
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary w-100">
                        Upload Photo
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AddPhoto;
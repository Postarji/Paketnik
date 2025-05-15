import { useState, useEffect, useContext } from 'react';
import { UserContext } from '../userContext';

function Comments({ photoId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const userContext = useContext(UserContext);

    useEffect(() => {
        fetchComments();
    }, [photoId]);

    const fetchComments = async () => {
        try {
            const res = await fetch(`http://localhost:3001/comments/photo/${photoId}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        if (!userContext.user) {
            alert('Please login to add comments');
            return;
        }

        try {
            const res = await fetch('http://localhost:3001/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    photoId: photoId,
                    message: newComment
                })
            });

            if (res.ok) {
                setNewComment('');
                fetchComments();
            } else {
                const error = await res.json();
                if (error.message === 'Unauthorized') {
                    alert('Please login to add comments');
                }
            }
        } catch (error) {
            console.error('Error posting comment:', error);
        }
    };

    return (
        <div className="comments-section">
            <h4>Comments</h4>
            {userContext.user ? (
                <form onSubmit={handleSubmit} className="mb-3">
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                        />
                        <button type="submit" className="btn btn-primary">Post</button>
                    </div>
                </form>
            ) : (
                <p className="text-muted mb-3">Please log in to add comments</p>
            )}
            <div className="comments-list">
                {comments.map(comment => (
                    <div key={comment._id} className="comment mb-2">
                        <strong>{comment.author?.username || 'Unknown'}</strong>
                        <span className="text-muted ms-2">
                            {new Date(comment.createdAt).toLocaleString()}
                        </span>
                        <p className="mb-1">{comment.message}</p>
                    </div>
                ))}
                {comments.length === 0 && (
                    <p className="text-muted">No comments yet</p>
                )}
            </div>
        </div>
    );
}

export default Comments;
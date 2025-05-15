import { useContext } from "react";
import { UserContext } from "../userContext";
import { Link } from "react-router-dom";

function Header(props) {
    const userContext = useContext(UserContext);

    return (
        <header className="header">
            <div className="nav-container">
                <div className="nav-brand">
                    <Link to='/' className="brand-link">
                        <h1>{props.title}</h1>
                    </Link>
                </div>
                <nav className="nav-links">
                    <Link to='/' className="nav-link">Home</Link>
                    {userContext.user ? (
                        <>
                            <Link to='/publish' className="nav-link">Publish</Link>
                            <Link to='/profile' className="nav-link">Profile</Link>
                            <Link to='/logout' className="nav-link">Logout</Link>
                        </>
                    ) : (
                        <>
                            <Link to='/login' className="nav-link">Login</Link>
                            <Link to='/register' className="nav-link">Register</Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}

export default Header;
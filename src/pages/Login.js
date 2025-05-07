import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css"; // ✅ Custom CSS if needed

const Login = ({ setAuth }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
                email,
                password
            });

            // Store both token and user role
            localStorage.setItem("token", response.data.token);
            if (response.data.user && response.data.user.role) {
                localStorage.setItem("role", response.data.user.role);
            }
            
            setAuth(true);
            
            // Redirect to last visited page or dashboard
            const lastVisited = localStorage.getItem("lastVisited") || "/office-dashboard";
            navigate(lastVisited);
        } catch (err) {
            setError(err.response?.data?.message || "Login failed. Invalid email or password.");
        }
    };

    return (
        <div className="login-container d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
            {/* Animated Background Circles */}
            <div className="background-circles position-absolute">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className={`circle circle${i + 1}`}></div>
                ))}
            </div>

            {/* Login Box */}
            <div className="login-box p-4 rounded shadow-lg bg-white" style={{ width: "400px" }}>
                <div className="testing-notice mb-4">
                    <strong>THE APPLICATION IS UNDER TESTING PHASE</strong> <br />
                    Username: <b>test@gmail.com</b> <br />
                    Password: <b>123456789</b> <br />
                    Please enter the details to log in.
                </div>
                <h2 className="text-center mb-3">Welcome Back</h2>
                <p className="text-center text-muted mb-4">Sign in to continue</p>

                {/* Error Message */}
                {error && <div className="alert alert-danger">{error}</div>}

                {/* Login Form */}
                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Login</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
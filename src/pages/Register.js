import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Register.css"; // Changed from Login.css to Register.css

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("employee");  // Default role is 'employee'
    const [employeeId, setEmployeeId] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const payload = { 
                name, 
                email, 
                password, 
                role 
            };
            
            // Add employee ID to payload only if role is employee
            if (role === "employee") {
                payload.employee_id = employeeId; // Changed from employeeId to employee_id to match backend
            }

            await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, payload);
            navigate("/login");  // ✅ Redirect to login page after success
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Try again.");
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

            {/* Registration Box */}
            <div className="login-box p-4 rounded shadow-lg bg-white" style={{ width: "500px" }}>
                <h2 className="text-center mb-3">Create Account</h2>
                <p className="text-center text-muted mb-4">Register to join SMO Tracking</p>

                {/* Error Message */}
                {error && <div className="alert alert-danger">{error}</div>}

                {/* Registration Form */}
                <form onSubmit={handleRegister}>
                    <div className="mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Email Address"
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
                    <div className="mb-3">
                        <select 
                            className="form-select"
                            value={role} 
                            onChange={(e) => setRole(e.target.value)} 
                            required
                        >
                            <option value="">Select Role</option>
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                            <option value="Cutting">Cutting</option>
                            <option value="Sewing">Sewing</option>
                            <option value="Quality control">Quality Control</option>
                            <option value="Packing">Packing</option>
                        </select>
                    </div>
                    {role === "employee" && (
                        <div className="mb-3">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Employee ID"
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    <button type="submit" className="btn btn-primary w-100">Register</button>
                    
                    <div className="text-center mt-3">
                        <button 
                            type="button" 
                            className="btn btn-link" 
                            onClick={() => navigate("/login")}
                        >
                            Already have an account? Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;

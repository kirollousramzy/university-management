import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [credentials, setCredentials] = useState({
    email: "admin@campus.edu",
    password: "admin123",
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      const landing = user.role === "student" ? "/portal" : "/dashboard";
      navigate(landing, { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await api.login(credentials);
      login(response.user);
      const landing =
        response.user.role === "student" ? "/portal" : "/dashboard";
      navigate(landing, { replace: true });
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <aside className="login-card__aside">
          <p className="eyebrow">CampusFlow</p>
          <h1>Unified university management.</h1>
          <p className="muted-text">
            Control enrollment, rosters, and schedules from a single secure
            workspace. Invite staff or give students a direct view into their
            academic life.
          </p>
          <div className="login-pill">
            <span>Trusted by registrar offices</span>
          </div>
        </aside>

        <section className="panel panel--narrow login-card__form">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Sign in</p>
              <h2>Access Your Workspace</h2>
            </div>
          </div>

          <form className="stack gap-md" onSubmit={handleSubmit}>
            <label>
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
              />
            </label>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? "Checking..." : "Login"}
            </button>
            {message && <p className="error-text">{message}</p>}
          </form>
        </section>
      </div>
    </div>
  );
};

export default Login;

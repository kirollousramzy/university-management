import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
  name: "",
  email: "",
  major: "",
  year: "",
  gpa: "",
  advisor: "",
  password: "",
};

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [loginInfo, setLoginInfo] = useState(null);
  const { user } = useAuth();
  const canCreate = user?.role === "admin";

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api.getStudents();
        setStudents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    const needle = search.toLowerCase();
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(needle) ||
        student.major.toLowerCase().includes(needle) ||
        student.email.toLowerCase().includes(needle)
    );
  }, [students, search]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setLoginInfo(null);
    try {
      const payload = {
        ...form,
        year: form.year,
        gpa: form.gpa ? Number(form.gpa) : null,
        status: form.status || "active",
      };
      const response = await api.createStudent(payload);
      setStudents((prev) => [response.student, ...prev]);
      setForm(emptyForm);
      setLoginInfo(response.login);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm("Remove this student from the roster?")) {
      return;
    }
    try {
      await api.deleteStudent(studentId);
      setStudents((prev) => prev.filter((student) => student.id !== studentId));
    } catch (err) {
      // Re-surface error inline
      alert(err.message);
    }
  };

  return (
    <div className="stack gap-lg students-page">
      {canCreate ? (
        <section className="panel panel--frosted students-panel">
          <div className="panel__header students-panel__header">
            <div>
              <p className="eyebrow">Student services</p>
              <h2>Create Student Profile</h2>
            </div>
            <p className="muted-text">
              Issue login credentials instantly for new students.
            </p>
          </div>
          <form
            className="form-grid students-form-grid"
            onSubmit={handleSubmit}
          >
            <label>
              <span>Name</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              <span>Email</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              <span>Major</span>
              <input
                name="major"
                value={form.major}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              <span>Year</span>
              <input
                name="year"
                value={form.year}
                onChange={handleChange}
                placeholder="Year"
                required
              />
            </label>
            <label>
              <span>Advisor</span>
              <input
                name="advisor"
                value={form.advisor}
                onChange={handleChange}
                placeholder="Optional"
              />
            </label>

            <label className="span-2">
              <span>Temporary Password</span>
              <input
                name="password"
                type="text"
                value={form.password}
                onChange={handleChange}
                placeholder="Provide login password"
              />
            </label>
            <div className="form-actions form-actions--stack students-form-actions">
              <button type="submit" className="btn btn--lg" disabled={saving}>
                {saving ? "Saving..." : "Add Student"}
              </button>
              {error && <p className="error-text">{error}</p>}
              {loginInfo && (
                <div className="login-inline">
                  <p className="muted-text">
                    Login ready: <strong>{loginInfo.email}</strong> /{" "}
                    <strong>{loginInfo.password}</strong>
                  </p>
                </div>
              )}
            </div>
          </form>
        </section>
      ) : (
        <section className="panel panel--info">
          <p className="eyebrow">Roster management</p>
          <h3>Only administrators can add new students</h3>
          <p className="muted-text">
            Contact the registrar if you need a student profile created.
          </p>
        </section>
      )}

      <section className="panel panel--frosted">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Roster</p>
            <h2>Students</h2>
          </div>
          <input
            className="roster-search"
            type="search"
            placeholder="Search name, email, major"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading students...</p>
        ) : (
          <div className="table-wrapper">
            <table className="roster-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Major</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <strong>{student.name}</strong>
                      <p className="muted-text">{student.advisor}</p>
                    </td>
                    <td>{student.email}</td>
                    <td>{student.major}</td>
                    <td>
                      <button
                        className="link-btn"
                        type="button"
                        onClick={() => handleDelete(student.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Students;

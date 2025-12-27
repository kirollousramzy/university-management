import { useEffect, useState } from 'react';
import { api } from '../api/client';

const emptyForm = {
  name: '',
  email: '',
  password: ''
};

const Staff = () => {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchDoctors = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getDoctors();
      setDoctors(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await api.createDoctor(form);
      setDoctors((prev) => [response.doctor, ...prev]);
      setForm(emptyForm);
      setMessage(`Account created: ${response.login.email} / ${response.login.password}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack gap-lg">
      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Faculty access</p>
            <h2>Invite a Doctor</h2>
          </div>
        </div>
        <form className="form-grid staff-form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            <span>Email</span>
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            <span>Temporary Password</span>
            <input name="password" value={form.password} onChange={handleChange} required />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving...' : 'Create Account'}
            </button>
            {error && <p className="error-text">{error}</p>}
            {message && <p className="muted-text">{message}</p>}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Directory</p>
            <h2>Doctors</h2>
          </div>
        </div>
        {loading ? (
          <p>Loading doctors...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => (
                  <tr key={doctor.id}>
                    <td>{doctor.name}</td>
                    <td>{doctor.email}</td>
                    <td>{doctor.role}</td>
                  </tr>
                ))}
                {doctors.length === 0 && (
                  <tr>
                    <td colSpan="3">No doctors created yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Staff;

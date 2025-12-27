import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const Facilities = () => {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('facilities');
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'facilities') {
        const data = await api.getFacilities();
        setFacilities(data);
      } else if (activeTab === 'bookings') {
        const data = await api.getFacilityBookings({});
        setBookings(data);
      } else if (activeTab === 'maintenance') {
        const data = await api.getMaintenanceRequests();
        setMaintenance(data);
      } else if (activeTab === 'resources') {
        const data = await api.getResources();
        setResources(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createFacilityBooking({
        facilityId: form.facilityId,
        bookedBy: user.id,
        purpose: form.purpose,
        bookingDate: form.bookingDate,
        startTime: form.startTime,
        endTime: form.endTime
      });
      setForm({});
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMaintenance = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createMaintenanceRequest({
        facilityId: form.facilityId,
        reportedBy: user.id,
        issueDescription: form.issueDescription,
        priority: form.priority || 'medium'
      });
      setForm({});
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="stack gap-lg">
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'facilities' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('facilities')}
        >
          Facilities
        </button>
        <button
          className={`tab ${activeTab === 'bookings' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          Bookings
        </button>
        <button
          className={`tab ${activeTab === 'maintenance' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          Maintenance
        </button>
        <button
          className={`tab ${activeTab === 'resources' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          Resources
        </button>
      </div>

      {activeTab === 'facilities' && (
        <section className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Facilities Management</p>
              <h2>Classrooms & Laboratories</h2>
            </div>
          </div>
          {loading ? (
            <p>Loading facilities...</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Building</th>
                    <th>Capacity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {facilities.map((facility) => (
                    <tr key={facility.id}>
                      <td><strong>{facility.name}</strong></td>
                      <td>{facility.facility_type}</td>
                      <td>{facility.building}</td>
                      <td>{facility.capacity}</td>
                      <td>
                        <span className={`badge badge--${facility.status === 'available' ? 'success' : 'warn'}`}>
                          {facility.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'bookings' && (
        <>
          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Room Booking</p>
                <h2>Book a Facility</h2>
              </div>
            </div>
            <form className="form-grid" onSubmit={handleBooking}>
              <label>
                <span>Facility</span>
                <select
                  value={form.facilityId || ''}
                  onChange={(e) => setForm({ ...form, facilityId: e.target.value })}
                  required
                >
                  <option value="">Select facility</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} - {f.building}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Purpose</span>
                <input
                  value={form.purpose || ''}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  required
                />
              </label>
              <label>
                <span>Date</span>
                <input
                  type="date"
                  value={form.bookingDate || ''}
                  onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
                  required
                />
              </label>
              <label>
                <span>Start Time</span>
                <input
                  type="time"
                  value={form.startTime || ''}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  required
                />
              </label>
              <label>
                <span>End Time</span>
                <input
                  type="time"
                  value={form.endTime || ''}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  required
                />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn">Book Facility</button>
                {error && <p className="error-text">{error}</p>}
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Booking History</p>
                <h3>My Bookings</h3>
              </div>
            </div>
            {loading ? (
              <p>Loading bookings...</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Facility</th>
                      <th>Purpose</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.filter(b => b.booked_by === user.id).map((booking) => (
                      <tr key={booking.id}>
                        <td>{booking.facility_name}</td>
                        <td>{booking.purpose}</td>
                        <td>{new Date(booking.booking_date).toLocaleDateString()}</td>
                        <td>{booking.start_time} - {booking.end_time}</td>
                        <td>
                          <span className={`badge badge--${booking.status === 'confirmed' ? 'success' : 'warn'}`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === 'maintenance' && (
        <>
          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Report Issue</p>
                <h2>Maintenance Request</h2>
              </div>
            </div>
            <form className="form-grid" onSubmit={handleMaintenance}>
              <label>
                <span>Facility</span>
                <select
                  value={form.facilityId || ''}
                  onChange={(e) => setForm({ ...form, facilityId: e.target.value })}
                  required
                >
                  <option value="">Select facility</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} - {f.building}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Priority</span>
                <select
                  value={form.priority || 'medium'}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
              <label className="span-2">
                <span>Issue Description</span>
                <textarea
                  value={form.issueDescription || ''}
                  onChange={(e) => setForm({ ...form, issueDescription: e.target.value })}
                  required
                  rows="4"
                />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn">Submit Request</button>
                {error && <p className="error-text">{error}</p>}
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Maintenance Requests</p>
                <h3>All Requests</h3>
              </div>
            </div>
            {loading ? (
              <p>Loading requests...</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Facility</th>
                      <th>Issue</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Reported</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenance.map((req) => (
                      <tr key={req.id}>
                        <td>{req.facility_name}</td>
                        <td>{req.issue_description}</td>
                        <td>
                          <span className={`badge badge--${req.priority === 'urgent' ? 'error' : req.priority === 'high' ? 'warn' : 'info'}`}>
                            {req.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge--${req.status === 'resolved' ? 'success' : 'warn'}`}>
                            {req.status}
                          </span>
                        </td>
                        <td>{new Date(req.reported_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === 'resources' && (
        <section className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Resource Management</p>
              <h2>Equipment & Software</h2>
            </div>
          </div>
          {loading ? (
            <p>Loading resources...</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Available</th>
                    <th>Total</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((resource) => (
                    <tr key={resource.id}>
                      <td><strong>{resource.name}</strong></td>
                      <td>{resource.resource_type}</td>
                      <td>{resource.quantity_available}</td>
                      <td>{resource.quantity_total}</td>
                      <td>{resource.location || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Facilities;


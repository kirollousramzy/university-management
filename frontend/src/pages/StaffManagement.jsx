import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const StaffManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tas');
  const [tas, setTAs] = useState([]);
  const [officeHours, setOfficeHours] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [research, setResearch] = useState([]);
  const [development, setDevelopment] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersData, coursesData] = await Promise.all([
        api.getDoctors(),
        api.getCourses()
      ]);
      setUsers(usersData);
      setCourses(coursesData);

      if (activeTab === 'tas') {
        const data = await api.getTAs();
        setTAs(data);
      } else if (activeTab === 'office-hours') {
        const data = await api.getOfficeHours({});
        setOfficeHours(data);
      } else if (activeTab === 'performance') {
        const data = await api.getStaffPerformance({});
        setPerformance(data);
      } else if (activeTab === 'research') {
        const data = await api.getResearchPublications({});
        setResearch(data);
      } else if (activeTab === 'development') {
        const data = await api.getProfessionalDevelopment({});
        setDevelopment(data);
      } else if (activeTab === 'leave') {
        const data = await api.getLeaveRequests({});
        setLeaveRequests(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTA = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createTA({
        userId: form.userId,
        assignedCourseId: form.assignedCourseId || null,
        responsibilities: form.responsibilities,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : null,
        status: 'active'
      });
      setForm({});
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateOfficeHours = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createOfficeHours({
        staffId: form.staffId,
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location,
        isVirtual: form.isVirtual || false,
        virtualLink: form.virtualLink
      });
      setForm({});
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreatePerformance = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createStaffPerformance({
        staffId: form.staffId,
        evaluationPeriod: form.evaluationPeriod,
        evaluationType: form.evaluationType,
        rating: form.rating ? Number(form.rating) : null,
        comments: form.comments,
        evaluatedBy: user.id
      });
      setForm({});
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateResearch = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createResearchPublication({
        staffId: form.staffId,
        title: form.title,
        publicationType: form.publicationType,
        publicationDate: form.publicationDate,
        publisher: form.publisher,
        coAuthors: form.coAuthors,
        doi: form.doi,
        url: form.url
      });
      setForm({});
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateDevelopment = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createProfessionalDevelopment({
        staffId: form.staffId,
        activityType: form.activityType,
        title: form.title,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
        provider: form.provider,
        status: form.status || 'planned'
      });
      setForm({});
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateLeaveRequest = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createLeaveRequest({
        staffId: form.staffId || user.id,
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason
      });
      setForm({});
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReviewLeave = async (requestId, status) => {
    setError('');
    try {
      await api.reviewLeaveRequest(requestId, {
        status,
        reviewedBy: user.id
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="stack gap-lg">
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'tas' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('tas')}
        >
          Teaching Assistants
        </button>
        <button
          className={`tab ${activeTab === 'office-hours' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('office-hours')}
        >
          Office Hours
        </button>
        <button
          className={`tab ${activeTab === 'performance' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button
          className={`tab ${activeTab === 'research' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('research')}
        >
          Research
        </button>
        <button
          className={`tab ${activeTab === 'development' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('development')}
        >
          Development
        </button>
        <button
          className={`tab ${activeTab === 'leave' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('leave')}
        >
          Leave Requests
        </button>
      </div>

      {activeTab === 'tas' && (
        <>
          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">TA Management</p>
                <h2>Assign Teaching Assistant</h2>
              </div>
            </div>
            <form className="form-grid" onSubmit={handleCreateTA}>
              <label>
                <span>User</span>
                <select
                  value={form.userId || ''}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  required
                >
                  <option value="">Select user</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Assigned Course</span>
                <select
                  value={form.assignedCourseId || ''}
                  onChange={(e) => setForm({ ...form, assignedCourseId: e.target.value })}
                >
                  <option value="">None</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Hourly Rate</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.hourlyRate || ''}
                  onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                />
              </label>
              <label className="span-2">
                <span>Responsibilities</span>
                <textarea
                  value={form.responsibilities || ''}
                  onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
                  rows="3"
                />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn">Assign TA</button>
                {error && <p className="error-text">{error}</p>}
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Teaching Assistants</p>
                <h3>All TAs</h3>
              </div>
            </div>
            {loading ? (
              <p>Loading TAs...</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Course</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tas.map((ta) => (
                      <tr key={ta.id}>
                        <td>{ta.name}</td>
                        <td>{ta.email}</td>
                        <td>{ta.course_code || 'Not assigned'}</td>
                        <td>
                          <span className={`badge badge--${ta.status === 'active' ? 'success' : 'warn'}`}>
                            {ta.status}
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

      {activeTab === 'office-hours' && (
        <>
          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Office Hours</p>
                <h2>Set Office Hours</h2>
              </div>
            </div>
            <form className="form-grid" onSubmit={handleCreateOfficeHours}>
              <label>
                <span>Staff Member</span>
                <select
                  value={form.staffId || user.id}
                  onChange={(e) => setForm({ ...form, staffId: e.target.value })}
                  required
                >
                  <option value="">Select staff</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Day of Week</span>
                <select
                  value={form.dayOfWeek || ''}
                  onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
                  required
                >
                  <option value="">Select day</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                </select>
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
              <label>
                <span>Location</span>
                <input
                  value={form.location || ''}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </label>
              <label>
                <span>Virtual Link (if virtual)</span>
                <input
                  type="url"
                  value={form.virtualLink || ''}
                  onChange={(e) => setForm({ ...form, virtualLink: e.target.value })}
                />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn">Add Office Hours</button>
                {error && <p className="error-text">{error}</p>}
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Office Hours Schedule</p>
                <h3>All Office Hours</h3>
              </div>
            </div>
            {loading ? (
              <p>Loading office hours...</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th>Day</th>
                      <th>Time</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officeHours.map((oh) => (
                      <tr key={oh.id}>
                        <td>{oh.staff_name}</td>
                        <td>{oh.day_of_week}</td>
                        <td>{oh.start_time} - {oh.end_time}</td>
                        <td>{oh.location || 'Virtual'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === 'performance' && (
        <>
          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Performance Tracking</p>
                <h2>Record Performance Evaluation</h2>
              </div>
            </div>
            <form className="form-grid" onSubmit={handleCreatePerformance}>
              <label>
                <span>Staff Member</span>
                <select
                  value={form.staffId || ''}
                  onChange={(e) => setForm({ ...form, staffId: e.target.value })}
                  required
                >
                  <option value="">Select staff</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Evaluation Period</span>
                <input
                  value={form.evaluationPeriod || ''}
                  onChange={(e) => setForm({ ...form, evaluationPeriod: e.target.value })}
                  placeholder="e.g., Fall 2024"
                  required
                />
              </label>
              <label>
                <span>Evaluation Type</span>
                <select
                  value={form.evaluationType || ''}
                  onChange={(e) => setForm({ ...form, evaluationType: e.target.value })}
                  required
                >
                  <option value="">Select type</option>
                  <option value="annual">Annual</option>
                  <option value="semester">Semester</option>
                  <option value="project">Project</option>
                </select>
              </label>
              <label>
                <span>Rating (0-5)</span>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.rating || ''}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                />
              </label>
              <label className="span-2">
                <span>Comments</span>
                <textarea
                  value={form.comments || ''}
                  onChange={(e) => setForm({ ...form, comments: e.target.value })}
                  rows="4"
                />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn">Record Evaluation</button>
                {error && <p className="error-text">{error}</p>}
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Performance Records</p>
                <h3>All Evaluations</h3>
              </div>
            </div>
            {loading ? (
              <p>Loading performance records...</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th>Period</th>
                      <th>Type</th>
                      <th>Rating</th>
                      <th>Evaluated By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.map((p) => (
                      <tr key={p.id}>
                        <td>{p.staff_name}</td>
                        <td>{p.evaluation_period}</td>
                        <td>{p.evaluation_type}</td>
                        <td>{p.rating || 'N/A'}</td>
                        <td>{p.evaluator_name || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === 'research' && (
        <>
          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Research Publications</p>
                <h2>Add Publication</h2>
              </div>
            </div>
            <form className="form-grid" onSubmit={handleCreateResearch}>
              <label>
                <span>Staff Member</span>
                <select
                  value={form.staffId || user.id}
                  onChange={(e) => setForm({ ...form, staffId: e.target.value })}
                  required
                >
                  <option value="">Select staff</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="span-2">
                <span>Title</span>
                <input
                  value={form.title || ''}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </label>
              <label>
                <span>Publication Type</span>
                <select
                  value={form.publicationType || ''}
                  onChange={(e) => setForm({ ...form, publicationType: e.target.value })}
                  required
                >
                  <option value="">Select type</option>
                  <option value="journal">Journal</option>
                  <option value="conference">Conference</option>
                  <option value="book">Book</option>
                  <option value="patent">Patent</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                <span>Publication Date</span>
                <input
                  type="date"
                  value={form.publicationDate || ''}
                  onChange={(e) => setForm({ ...form, publicationDate: e.target.value })}
                />
              </label>
              <label>
                <span>Publisher</span>
                <input
                  value={form.publisher || ''}
                  onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                />
              </label>
              <label>
                <span>Co-Authors</span>
                <input
                  value={form.coAuthors || ''}
                  onChange={(e) => setForm({ ...form, coAuthors: e.target.value })}
                />
              </label>
              <label>
                <span>DOI</span>
                <input
                  value={form.doi || ''}
                  onChange={(e) => setForm({ ...form, doi: e.target.value })}
                />
              </label>
              <label>
                <span>URL</span>
                <input
                  type="url"
                  value={form.url || ''}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn">Add Publication</button>
                {error && <p className="error-text">{error}</p>}
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Publications</p>
                <h3>All Research</h3>
              </div>
            </div>
            {loading ? (
              <p>Loading publications...</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Publisher</th>
                    </tr>
                  </thead>
                  <tbody>
                    {research.map((r) => (
                      <tr key={r.id}>
                        <td>{r.staff_name}</td>
                        <td>{r.title}</td>
                        <td>{r.publication_type}</td>
                        <td>{r.publication_date ? new Date(r.publication_date).toLocaleDateString() : 'N/A'}</td>
                        <td>{r.publisher || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === 'development' && (
        <>
          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Professional Development</p>
                <h2>Add Development Activity</h2>
              </div>
            </div>
            <form className="form-grid" onSubmit={handleCreateDevelopment}>
              <label>
                <span>Staff Member</span>
                <select
                  value={form.staffId || user.id}
                  onChange={(e) => setForm({ ...form, staffId: e.target.value })}
                  required
                >
                  <option value="">Select staff</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Activity Type</span>
                <select
                  value={form.activityType || ''}
                  onChange={(e) => setForm({ ...form, activityType: e.target.value })}
                  required
                >
                  <option value="">Select type</option>
                  <option value="training">Training</option>
                  <option value="conference">Conference</option>
                  <option value="workshop">Workshop</option>
                  <option value="certification">Certification</option>
                  <option value="course">Course</option>
                </select>
              </label>
              <label>
                <span>Title</span>
                <input
                  value={form.title || ''}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </label>
              <label>
                <span>Start Date</span>
                <input
                  type="date"
                  value={form.startDate || ''}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </label>
              <label>
                <span>End Date</span>
                <input
                  type="date"
                  value={form.endDate || ''}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </label>
              <label>
                <span>Provider</span>
                <input
                  value={form.provider || ''}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                />
              </label>
              <label>
                <span>Status</span>
                <select
                  value={form.status || 'planned'}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <label className="span-2">
                <span>Description</span>
                <textarea
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows="3"
                />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn">Add Activity</button>
                {error && <p className="error-text">{error}</p>}
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Development Activities</p>
                <h3>All Activities</h3>
              </div>
            </div>
            {loading ? (
              <p>Loading activities...</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Dates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {development.map((d) => (
                      <tr key={d.id}>
                        <td>{d.staff_name}</td>
                        <td>{d.title}</td>
                        <td>{d.activity_type}</td>
                        <td>
                          <span className={`badge badge--${d.status === 'completed' ? 'success' : d.status === 'in_progress' ? 'info' : 'warn'}`}>
                            {d.status}
                          </span>
                        </td>
                        <td>
                          {d.start_date && new Date(d.start_date).toLocaleDateString()}
                          {d.end_date && ` - ${new Date(d.end_date).toLocaleDateString()}`}
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

      {activeTab === 'leave' && (
        <>
          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Leave Management</p>
                <h2>{user.role === 'admin' ? 'Review Leave Requests' : 'Request Leave'}</h2>
              </div>
            </div>
            {user.role !== 'admin' && (
              <form className="form-grid" onSubmit={handleCreateLeaveRequest}>
                <label>
                  <span>Leave Type</span>
                  <select
                    value={form.leaveType || ''}
                    onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                    required
                  >
                    <option value="">Select type</option>
                    <option value="sick">Sick Leave</option>
                    <option value="vacation">Vacation</option>
                    <option value="personal">Personal</option>
                    <option value="maternity">Maternity</option>
                    <option value="paternity">Paternity</option>
                    <option value="sabbatical">Sabbatical</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label>
                  <span>Start Date</span>
                  <input
                    type="date"
                    value={form.startDate || ''}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                  />
                </label>
                <label>
                  <span>End Date</span>
                  <input
                    type="date"
                    value={form.endDate || ''}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    required
                  />
                </label>
                <label className="span-2">
                  <span>Reason</span>
                  <textarea
                    value={form.reason || ''}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    rows="3"
                  />
                </label>
                <div className="form-actions">
                  <button type="submit" className="btn">Submit Request</button>
                  {error && <p className="error-text">{error}</p>}
                </div>
              </form>
            )}
          </section>

          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Leave Requests</p>
                <h3>{user.role === 'admin' ? 'All Requests' : 'My Requests'}</h3>
              </div>
            </div>
            {loading ? (
              <p>Loading leave requests...</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Status</th>
                      {user.role === 'admin' && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests
                      .filter(lr => user.role === 'admin' || lr.staff_id === user.id)
                      .map((lr) => (
                        <tr key={lr.id}>
                          <td>{lr.staff_name}</td>
                          <td>{lr.leave_type}</td>
                          <td>
                            {new Date(lr.start_date).toLocaleDateString()} - {new Date(lr.end_date).toLocaleDateString()}
                          </td>
                          <td>
                            <span className={`badge badge--${lr.status === 'approved' ? 'success' : lr.status === 'rejected' ? 'error' : 'warn'}`}>
                              {lr.status}
                            </span>
                          </td>
                          {user.role === 'admin' && lr.status === 'pending' && (
                            <td>
                              <button
                                className="btn btn--ghost"
                                onClick={() => handleReviewLeave(lr.id, 'approved')}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn--ghost"
                                onClick={() => handleReviewLeave(lr.id, 'rejected')}
                              >
                                Reject
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default StaffManagement;


import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const GRADE_OPTIONS = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];

const buildEmptyCourse = (instructor = '') => ({
  code: '',
  title: '',
  instructor,
  credits: 3,
  capacity: 25,
  day: 'Mon/Wed',
  time: '09:00 - 10:15',
  location: 'TBD'
});

const Courses = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(() => buildEmptyCourse(isDoctor ? user?.name || '' : ''));
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState('');
  const [gradeDrafts, setGradeDrafts] = useState({});

  useEffect(() => {
    if (isDoctor) {
      setForm((prev) => ({ ...prev, instructor: user?.name || prev.instructor }));
    }
  }, [isDoctor, user?.name]);

  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.getCourses();
        setCourses(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const loadEnrollments = async () => {
      if (!isDoctor) {
        return;
      }
      setEnrollmentLoading(true);
      setEnrollmentError('');
      try {
        const data = await api.getEnrollments();
        setEnrollments(data);
      } catch (err) {
        setEnrollmentError(err.message);
      } finally {
        setEnrollmentLoading(false);
      }
    };

    loadCourses();
    loadEnrollments();
  }, [isDoctor]);

  const filteredCourses = useMemo(() => {
    const needle = search.toLowerCase();
    return courses.filter(
      (course) =>
        course.code.toLowerCase().includes(needle) ||
        course.title.toLowerCase().includes(needle) ||
        course.instructor.toLowerCase().includes(needle)
    );
  }, [courses, search]);
  const doctorCourses = useMemo(() => {
    if (!isDoctor) {
      return [];
    }
    const doctorName = user?.name?.toLowerCase() || '';
    return courses.filter((course) => course.instructor?.toLowerCase() === doctorName);
  }, [courses, isDoctor, user?.name]);

  const enrollmentStats = useMemo(() => {
    const stats = {};
    enrollments.forEach((record) => {
      const courseId = record.courseId || record.course?.id;
      if (!courseId) {
        return;
      }
      if (!stats[courseId]) {
        stats[courseId] = { active: 0, pending: 0 };
      }
      if (record.status === 'enrolled') {
        stats[courseId].active += 1;
      } else {
        stats[courseId].pending += 1;
      }
    });
    return stats;
  }, [enrollments]);

  const doctorEnrollments = useMemo(() => {
    if (!isDoctor) {
      return [];
    }
    const doctorName = user?.name?.toLowerCase() || '';
    return enrollments.filter(
      (record) => (record.course?.instructor || '').toLowerCase() === doctorName
    );
  }, [enrollments, isDoctor, user?.name]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const instructorName = isDoctor ? user?.name : form.instructor;
      const payload = {
        code: form.code,
        title: form.title,
        instructor: instructorName || form.instructor,
        credits: Number(form.credits),
        capacity: Number(form.capacity),
        schedule: {
          day: form.day,
          time: form.time,
          location: form.location
        }
      };
      const created = await api.createCourse(payload);
      setCourses((prev) => [created, ...prev]);
      setForm(buildEmptyCourse(isDoctor ? user?.name || '' : ''));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Delete this course from the catalog?')) {
      return;
    }
    try {
      await api.deleteCourse(courseId);
      setCourses((prev) => prev.filter((course) => course.id !== courseId));
    } catch (err) {
      alert(err.message);
    }
  };

  const updateEnrollmentDraft = (id, updates) => {
    setGradeDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...updates }
    }));
  };

  const handleSaveGrade = async (record) => {
    const draft = gradeDrafts[record.id] || {};
    const gradeValue = draft.grade ?? record.grade ?? '';

    if (!gradeValue) {
      alert('Select a grade before publishing.');
      return;
    }

    updateEnrollmentDraft(record.id, { saving: true, error: '' });
    try {
      await api.updateEnrollment(record.id, { grade: gradeValue, publish: true });
      const data = await api.getEnrollments();
      setEnrollments(data);
      updateEnrollmentDraft(record.id, { saving: false });
    } catch (err) {
      updateEnrollmentDraft(record.id, { saving: false, error: err.message });
      alert(err.message);
    }
  };

  return (
    <div className="stack gap-lg">
      {isDoctor && (
        <section className="panel panel--frosted">
          <div className="panel__header">
            <div>
              <p className="eyebrow">My classes</p>
              <h2>Students by course</h2>
            </div>
            {enrollmentLoading && <p className="muted-text">Updating...</p>}
            {enrollmentError && <p className="error-text">{enrollmentError}</p>}
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Active students</th>
                  <th>Pending activation</th>
                </tr>
              </thead>
              <tbody>
                {doctorCourses.map((course) => {
                  const stats = enrollmentStats[course.id] || { active: 0, pending: 0 };
                  return (
                    <tr key={course.id}>
                      <td>
                        <strong>{course.code}</strong>
                        <p className="muted-text">{course.title}</p>
                      </td>
                      <td>{stats.active}</td>
                      <td>{stats.pending}</td>
                    </tr>
                  );
                })}
                {doctorCourses.length === 0 && (
                  <tr>
                    <td colSpan="3">No courses assigned to you yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {isDoctor && (
        <section className="panel panel--frosted">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Grades</p>
              <h2>Publish grades to students</h2>
            </div>
            {enrollmentLoading && <p className="muted-text">Loading enrollments...</p>}
          </div>
          <p className="muted-text">
            Select a grade and publish it so the student can see it in their portal. GPA uses only published grades.
          </p>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Grade / Publish</th>
                </tr>
              </thead>
              <tbody>
                {doctorEnrollments.map((record) => {
                  const draft = gradeDrafts[record.id] || {};
                  const gradeValue = draft.grade ?? record.grade ?? '';
                  const saving = draft.saving;
                  return (
                    <tr key={record.id}>
                      <td>
                        <strong>{record.student?.name || record.studentId}</strong>
                        <p className="muted-text">{record.student?.email}</p>
                      </td>
                      <td>
                        <strong>{record.course?.code}</strong>
                        <p className="muted-text">{record.course?.title}</p>
                      </td>
                      <td>{record.status}</td>
                      <td>
                        <div className="grade-actions">
                          <select
                            value={gradeValue}
                            onChange={(event) =>
                              updateEnrollmentDraft(record.id, { grade: event.target.value })
                            }
                          >
                            <option value="">Select</option>
                            {GRADE_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn btn--ghost"
                            disabled={saving}
                            onClick={() => handleSaveGrade(record)}
                          >
                            {saving ? 'Publishing...' : 'Publish'}
                          </button>
                        </div>
                        {draft.error && <p className="error-text">{draft.error}</p>}
                      </td>
                    </tr>
                  );
                })}
                {doctorEnrollments.length === 0 && (
                  <tr>
                    <td colSpan="6">No enrollments for your courses yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Course catalog</p>
            <h2>Create Course</h2>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Code</span>
            <input name="code" value={form.code} onChange={handleChange} placeholder="e.g. CS105" required />
          </label>
          <label>
            <span>Title</span>
            <input name="title" value={form.title} onChange={handleChange} required />
          </label>
          <label>
            <span>Instructor</span>
            <input
              name="instructor"
              value={form.instructor}
              onChange={handleChange}
              required
              readOnly={isDoctor}
              disabled={isDoctor}
            />
            {isDoctor && <span className="muted-text">Instructor is locked to your account.</span>}
          </label>
          <label>
            <span>Credits</span>
            <input name="credits" type="number" min="1" max="5" value={form.credits} onChange={handleChange} />
          </label>
          <label>
            <span>Capacity</span>
            <input name="capacity" type="number" min="5" max="60" value={form.capacity} onChange={handleChange} />
          </label>
          <label>
            <span>Days</span>
            <input name="day" value={form.day} onChange={handleChange} />
          </label>
          <label>
            <span>Time</span>
            <input name="time" value={form.time} onChange={handleChange} />
          </label>
          <label>
            <span>Location</span>
            <input name="location" value={form.location} onChange={handleChange} />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving...' : 'Add Course'}
            </button>
            {error && <p className="error-text">{error}</p>}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Current offerings</p>
            <h2>Courses</h2>
          </div>
          <input
            type="search"
            placeholder="Search code, title, instructor"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading courses...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Instructor</th>
                  <th>Credits</th>
                  <th>Capacity</th>
                  <th>Schedule</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <strong>{course.code}</strong>
                      <p className="muted-text">{course.title}</p>
                    </td>
                    <td>{course.instructor}</td>
                    <td>{course.credits}</td>
                    <td>{course.capacity}</td>
                    <td>
                      {course.schedule.day} <br />
                      <span className="muted-text">
                        {course.schedule.time} · {course.schedule.location}
                      </span>
                    </td>
                    <td>
                      <button className="link-btn" type="button" onClick={() => handleDelete(course.id)}>
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

export default Courses;

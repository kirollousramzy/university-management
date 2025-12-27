import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import { api } from '../api/client';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.getDashboardSummary();
        setSummary(data);
      } catch (err) {
        setError(err.message || 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <section className="panel">Loading dashboard...</section>;
  }

  if (error) {
    return (
      <section className="panel panel--error">
        <p>{error}</p>
      </section>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="stack gap-lg">
      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">At a glance</p>
            <h2>Week in Review</h2>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard label="Total Students" value={summary.totals.students} />
          <StatCard label="Active Students" value={summary.totals.activeStudents} tone="success" />
          <StatCard label="On Probation" value={summary.totals.probationStudents} tone="warn" />
          <StatCard label="Courses" value={summary.totals.courses} />
          <StatCard label="Enrollments" value={summary.totals.enrollments} />
        </div>
      </section>

      <div className="grid two-col">
        <section className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Enrollment health</p>
              <h3>Top Courses</h3>
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Instructor</th>
                  <th>Enrolled</th>
                  <th>Waitlist</th>
                </tr>
              </thead>
              <tbody>
                {summary.courseStats.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <strong>{course.code}</strong>
                      <p className="muted-text">{course.title}</p>
                    </td>
                    <td>{course.instructor}</td>
                    <td>{course.enrolled}</td>
                    <td>{course.waitlisted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Campus updates</p>
              <h3>Announcements</h3>
            </div>
          </div>
          <ul className="announcement-list">
            {summary.announcements.map((announcement) => (
              <li key={announcement.id}>
                <p className="announcement__date">{new Date(announcement.date).toLocaleDateString()}</p>
                <h4>{announcement.title}</h4>
                <p className="muted-text">{announcement.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;

import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const Community = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('messages');
  const [messages, setMessages] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
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
      const [doctors, eventsData] = await Promise.all([
        api.getDoctors(),
        api.getEvents()
      ]);
      setUsers(doctors);
      setEvents(eventsData);

      if (activeTab === 'messages') {
        const data = await api.getMessages({ userId: user.id });
        setMessages(data);
      } else if (activeTab === 'meetings') {
        const data = await api.getMeetings({ requesterId: user.id });
        setMeetings(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.sendMessage({
        senderId: user.id,
        receiverId: form.receiverId,
        subject: form.subject,
        messageText: form.messageText,
        messageType: 'direct'
      });
      setForm({});
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRequestMeeting = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createMeeting({
        requesterId: user.id,
        staffId: form.staffId,
        meetingSubject: form.meetingSubject,
        meetingDate: form.meetingDate,
        meetingTime: form.meetingTime,
        durationMinutes: Number(form.durationMinutes) || 30,
        location: form.location,
        isVirtual: form.isVirtual || false,
        virtualLink: form.virtualLink,
        notes: form.notes
      });
      setForm({});
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createEvent({
        title: form.title,
        description: form.description,
        eventDate: form.eventDate,
        eventTime: form.eventTime,
        location: form.location,
        eventType: form.eventType || 'academic',
        createdBy: user.id
      });
      setForm({});
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMarkRead = async (messageId) => {
    try {
      await api.markMessageRead(messageId);
      loadData();
    } catch (err) {
      console.error('Error marking message as read', err);
    }
  };

  const handleConfirmMeeting = async (meetingId) => {
    try {
      await api.confirmMeeting(meetingId);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="stack gap-lg">
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'messages' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          Messages
        </button>
        <button
          className={`tab ${activeTab === 'meetings' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('meetings')}
        >
          Meetings
        </button>
        <button
          className={`tab ${activeTab === 'events' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Events
        </button>
      </div>

      {activeTab === 'messages' && (
        <>
          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Communication</p>
                <h2>Send Message</h2>
              </div>
            </div>
            <form className="form-grid" onSubmit={handleSendMessage}>
              <label>
                <span>To</span>
                <select
                  value={form.receiverId || ''}
                  onChange={(e) => setForm({ ...form, receiverId: e.target.value })}
                  required
                >
                  <option value="">Select recipient</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Subject</span>
                <input
                  value={form.subject || ''}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </label>
              <label className="span-2">
                <span>Message</span>
                <textarea
                  value={form.messageText || ''}
                  onChange={(e) => setForm({ ...form, messageText: e.target.value })}
                  rows="6"
                  required
                />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn">Send Message</button>
                {error && <p className="error-text">{error}</p>}
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Inbox</p>
                <h3>My Messages</h3>
              </div>
            </div>
            {loading ? (
              <p>Loading messages...</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>From</th>
                      <th>Subject</th>
                      <th>Message</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages
                      .filter(m => m.receiver_id === user.id)
                      .map((message) => (
                        <tr key={message.id}>
                          <td>{message.sender_name}</td>
                          <td>{message.subject || '(No subject)'}</td>
                          <td>{message.message_text.substring(0, 50)}...</td>
                          <td>{new Date(message.created_at).toLocaleString()}</td>
                          <td>
                            {!message.is_read ? (
                              <button
                                className="btn btn--ghost"
                                onClick={() => handleMarkRead(message.id)}
                              >
                                Mark Read
                              </button>
                            ) : (
                              <span className="badge badge--success">Read</span>
                            )}
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

      {activeTab === 'meetings' && (
        <>
          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Meeting Requests</p>
                <h2>Schedule Meeting</h2>
              </div>
            </div>
            <form className="form-grid" onSubmit={handleRequestMeeting}>
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
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Subject</span>
                <input
                  value={form.meetingSubject || ''}
                  onChange={(e) => setForm({ ...form, meetingSubject: e.target.value })}
                  required
                />
              </label>
              <label>
                <span>Date</span>
                <input
                  type="date"
                  value={form.meetingDate || ''}
                  onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
                  required
                />
              </label>
              <label>
                <span>Time</span>
                <input
                  type="time"
                  value={form.meetingTime || ''}
                  onChange={(e) => setForm({ ...form, meetingTime: e.target.value })}
                  required
                />
              </label>
              <label>
                <span>Duration (minutes)</span>
                <input
                  type="number"
                  value={form.durationMinutes || 30}
                  onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
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
              <label className="span-2">
                <span>Notes</span>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows="3"
                />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn">Request Meeting</button>
                {error && <p className="error-text">{error}</p>}
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">My Meetings</p>
                <h3>Meeting Requests</h3>
              </div>
            </div>
            {loading ? (
              <p>Loading meetings...</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th>Subject</th>
                      <th>Date & Time</th>
                      <th>Location</th>
                      <th>Status</th>
                      {user.role === 'doctor' && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {meetings.map((meeting) => (
                      <tr key={meeting.id}>
                        <td>{meeting.staff_name}</td>
                        <td>{meeting.meeting_subject}</td>
                        <td>
                          {new Date(meeting.meeting_date).toLocaleDateString()} at {meeting.meeting_time}
                        </td>
                        <td>{meeting.location || 'Virtual'}</td>
                        <td>
                          <span className={`badge badge--${meeting.status === 'confirmed' ? 'success' : meeting.status === 'cancelled' ? 'error' : 'warn'}`}>
                            {meeting.status}
                          </span>
                        </td>
                        {user.role === 'doctor' && meeting.status === 'requested' && (
                          <td>
                            <button
                              className="btn btn--ghost"
                              onClick={() => handleConfirmMeeting(meeting.id)}
                            >
                              Confirm
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

      {activeTab === 'events' && (
        <>
          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Events</p>
                <h2>Create Event</h2>
              </div>
            </div>
            <form className="form-grid" onSubmit={handleCreateEvent}>
              <label>
                <span>Title</span>
                <input
                  value={form.title || ''}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </label>
              <label>
                <span>Event Type</span>
                <select
                  value={form.eventType || 'academic'}
                  onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                >
                  <option value="academic">Academic</option>
                  <option value="social">Social</option>
                  <option value="sports">Sports</option>
                  <option value="cultural">Cultural</option>
                  <option value="administrative">Administrative</option>
                </select>
              </label>
              <label>
                <span>Date</span>
                <input
                  type="date"
                  value={form.eventDate || ''}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                  required
                />
              </label>
              <label>
                <span>Time</span>
                <input
                  type="time"
                  value={form.eventTime || ''}
                  onChange={(e) => setForm({ ...form, eventTime: e.target.value })}
                />
              </label>
              <label>
                <span>Location</span>
                <input
                  value={form.location || ''}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </label>
              <label className="span-2">
                <span>Description</span>
                <textarea
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows="4"
                />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn">Create Event</button>
                {error && <p className="error-text">{error}</p>}
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Campus Events</p>
                <h3>Upcoming Events</h3>
              </div>
            </div>
            {loading ? (
              <p>Loading events...</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Date & Time</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id}>
                        <td><strong>{event.title}</strong></td>
                        <td>{event.event_type}</td>
                        <td>
                          {new Date(event.event_date).toLocaleDateString()}
                          {event.event_time && ` at ${event.event_time}`}
                        </td>
                        <td>{event.location || 'TBD'}</td>
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

export default Community;


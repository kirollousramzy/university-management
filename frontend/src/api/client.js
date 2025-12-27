const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const request = async (endpoint, options = {}) => {
  const config = {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.message || `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    // Network errors or fetch failures
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Unable to connect to server at ${API_BASE_URL}. Please make sure the backend is running.`);
    }
    throw error;
  }
};

export const api = {
  login: (payload) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getDashboardSummary: () => request('/api/dashboard/summary'),

  getStudents: () => request('/api/students'),
  getStudent: (id) => request(`/api/students/${id}`),
  createStudent: (payload) => request('/api/students', { method: 'POST', body: JSON.stringify(payload) }),
  updateStudent: (id, payload) => request(`/api/students/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteStudent: (id) => request(`/api/students/${id}`, { method: 'DELETE' }),

  getCourses: () => request('/api/courses'),
  createCourse: (payload) => request('/api/courses', { method: 'POST', body: JSON.stringify(payload) }),
  deleteCourse: (id) => request(`/api/courses/${id}`, { method: 'DELETE' }),

  getSchedule: () => request('/api/schedule'),
  getEnrollments: () => request('/api/enrollments'),
  createEnrollment: (payload) => request('/api/enrollments', { method: 'POST', body: JSON.stringify(payload) }),
  updateEnrollment: (id, payload) => request(`/api/enrollments/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  getDoctors: () => request('/api/staff/doctors'),
  createDoctor: (payload) => request('/api/staff/doctors', { method: 'POST', body: JSON.stringify(payload) }),

  // Facilities Module
  getFacilities: () => request('/api/facilities'),
  createFacility: (payload) => request('/api/facilities', { method: 'POST', body: JSON.stringify(payload) }),
  getFacilityBookings: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/facilities/bookings${query ? `?${query}` : ''}`);
  },
  createFacilityBooking: (payload) => request('/api/facilities/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  getMaintenanceRequests: () => request('/api/facilities/maintenance'),
  createMaintenanceRequest: (payload) => request('/api/facilities/maintenance', { method: 'POST', body: JSON.stringify(payload) }),
  getResources: () => request('/api/resources'),
  createResource: (payload) => request('/api/resources', { method: 'POST', body: JSON.stringify(payload) }),
  allocateResource: (payload) => request('/api/resources/allocate', { method: 'POST', body: JSON.stringify(payload) }),
  getAdmissionApplications: () => request('/api/admissions/applications'),
  createAdmissionApplication: (payload) => request('/api/admissions/applications', { method: 'POST', body: JSON.stringify(payload) }),

  // Curriculum Module Enhancements
  getAssignments: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/assignments${query ? `?${query}` : ''}`);
  },
  createAssignment: (payload) => request('/api/assignments', { method: 'POST', body: JSON.stringify(payload) }),
  getAssignmentSubmissions: (assignmentId) => request(`/api/assignments/${assignmentId}/submissions`),
  submitAssignment: (assignmentId, payload) => request(`/api/assignments/${assignmentId}/submit`, { method: 'POST', body: JSON.stringify(payload) }),
  gradeSubmission: (submissionId, payload) => request(`/api/assignments/submissions/${submissionId}/grade`, { method: 'PUT', body: JSON.stringify(payload) }),

  // Staff Module Enhancements
  getTAs: () => request('/api/staff/tas'),
  createTA: (payload) => request('/api/staff/tas', { method: 'POST', body: JSON.stringify(payload) }),
  getOfficeHours: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/staff/office-hours${query ? `?${query}` : ''}`);
  },
  createOfficeHours: (payload) => request('/api/staff/office-hours', { method: 'POST', body: JSON.stringify(payload) }),
  getStaffPerformance: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/staff/performance${query ? `?${query}` : ''}`);
  },
  createStaffPerformance: (payload) => request('/api/staff/performance', { method: 'POST', body: JSON.stringify(payload) }),
  getResearchPublications: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/staff/research${query ? `?${query}` : ''}`);
  },
  createResearchPublication: (payload) => request('/api/staff/research', { method: 'POST', body: JSON.stringify(payload) }),
  getProfessionalDevelopment: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/staff/development${query ? `?${query}` : ''}`);
  },
  createProfessionalDevelopment: (payload) => request('/api/staff/development', { method: 'POST', body: JSON.stringify(payload) }),
  getLeaveRequests: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/staff/leave-requests${query ? `?${query}` : ''}`);
  },
  createLeaveRequest: (payload) => request('/api/staff/leave-requests', { method: 'POST', body: JSON.stringify(payload) }),
  reviewLeaveRequest: (id, payload) => request(`/api/staff/leave-requests/${id}/review`, { method: 'PUT', body: JSON.stringify(payload) }),

  // Community Module
  getParents: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/parents${query ? `?${query}` : ''}`);
  },
  createParent: (payload) => request('/api/parents', { method: 'POST', body: JSON.stringify(payload) }),
  registerParent: (parentId, payload) => request(`/api/parents/${parentId}/register`, { method: 'POST', body: JSON.stringify(payload) }),
  getMessages: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/messages${query ? `?${query}` : ''}`);
  },
  sendMessage: (payload) => request('/api/messages', { method: 'POST', body: JSON.stringify(payload) }),
  markMessageRead: (id) => request(`/api/messages/${id}/read`, { method: 'PUT' }),
  getMeetings: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/meetings${query ? `?${query}` : ''}`);
  },
  createMeeting: (payload) => request('/api/meetings', { method: 'POST', body: JSON.stringify(payload) }),
  confirmMeeting: (id) => request(`/api/meetings/${id}/confirm`, { method: 'PUT' }),
  getEvents: () => request('/api/events'),
  createEvent: (payload) => request('/api/events', { method: 'POST', body: JSON.stringify(payload) })
};

export default api;

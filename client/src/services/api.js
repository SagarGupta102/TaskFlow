
const API_BASE_URL = 'http://localhost:5000/api';

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('taskflow_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  return data;
}

export async function registerUser(name, email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }

  return data;
}

export function getProjects() {
  return apiRequest('/projects');
}

export function createProject(project) {
  return apiRequest('/projects', {
    method: 'POST',
    body: JSON.stringify(project),
  });
}

export function getTasks() {
  return apiRequest('/tasks');
}

export function getTeamMembers() {
  return apiRequest('/team');
}

export function getTaskComments(taskId) {
  return apiRequest(`/tasks/${taskId}/comments`);
}

export function getAnalyticsSummary() {
  return apiRequest('/analytics/summary');
}

export function getGanttTimeline() {
  return apiRequest('/gantt/timeline');
}

export function createTaskComment(taskId, content) {
  return apiRequest(`/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export function createTask(task) {
  return apiRequest('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  });
}

export function updateTask(taskId, updates) {
  return apiRequest(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export function deleteTask(taskId) {
  return apiRequest(`/tasks/${taskId}`, {
    method: 'DELETE',
  });
}

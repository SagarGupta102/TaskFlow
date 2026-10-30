# TaskFlow – Project Management Tool

**Keep every initiative moving.**

TaskFlow is a full-stack project management application designed to help teams organize projects, assign tasks, track progress, and collaborate efficiently.

## Features

### Authentication and User Management
- User registration and login.
- Role-based access for Admin and Member.
- Secure authentication using JWT.
- Password hashing using bcrypt.

### Project Management
- Create, view, update, and delete projects (Admin).
- Manage project team members.
- Track project status and delivery dates.

### Task Management
- Create and assign tasks to team members.
- Set task priorities and deadlines.
- Update task status.
- Track assigned tasks.

### Kanban Board
- To Do
- In Progress
- Completed

### Team Collaboration
- View workspace team members.
- Add comments to tasks.
- View comment authors and timestamps.

### Analytics and Reporting
- Project and task statistics.
- Task completion percentage.
- Priority breakdown.
- Overdue task tracking.

### Gantt Chart
- Visual project and task timelines.
- Start dates and due dates.
- Task status and priority information.

### Member Dashboard
- Personalized task overview.
- Project progress tracking.
- Upcoming deadlines.
- Recently assigned tasks.

### Settings
- Account information.
- Theme preference.
- Logout functionality.

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite |
| Styling | CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Authentication | JWT, bcrypt |
| API | REST API |
| Development Tools | VS Code, Git, GitHub |

## Project Structure

```text
TaskFlow/
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── App.jsx
│       └── main.jsx
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env.example
│   └── server.js
│
├── .gitignore
└── README.md
```

## Installation and Setup

### Prerequisites

- Node.js and npm
- MongoDB Atlas account or MongoDB connection
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/SagarGupta102/TaskFlow.git
cd TaskFlow
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside the `server` folder using `.env.example` as a reference.

Configure the required MongoDB connection, JWT secret, and other environment variables.

Start the backend:

```bash
node server.js
```

Backend URL:

```text
http://localhost:5000
```

### 3. Frontend Setup

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Open the application:

```text
http://localhost:5173
```

Keep both frontend and backend servers running while using the application.

## User Roles

### Admin
- Manage projects.
- Create and assign tasks.
- Manage team collaboration.
- View workspace analytics.
- Access project timelines.

### Member
- View assigned projects.
- View and update assigned tasks.
- Use the Kanban board.
- Collaborate through task comments.
- Track personal progress.

## API Overview

| Module | Endpoint |
|---|---|
| Authentication | `/api/auth` |
| Projects | `/api/projects` |
| Tasks | `/api/tasks` |
| Team | `/api/team` |
| Comments | `/api/tasks/:taskId/comments` |
| Analytics | `/api/analytics/summary` |
| Gantt Timeline | `/api/gantt/timeline` |
| Health Check | `/api/health` |

## Security

- Environment variables are used for sensitive configuration.
- Passwords are hashed before storage.
- Protected API routes require authentication.
- Role-based authorization restricts access to administrative operations.
- Actual environment files and secrets are excluded from Git.

## Author

Developed as part of the Codec Technologies Internship Project.

## Repository

[TaskFlow – GitHub](https://github.com/SagarGupta102/TaskFlow)

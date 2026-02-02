# Project Hub Documentation

> **Comprehensive documentation for Project Hub platform**
> **Last Updated:** 2026-02-02

---

## 📚 Documentation Structure

This folder contains detailed documentation for all aspects of the Project Hub platform, organized by category.

---

## 🏗️ Architecture & Database

### [Architecture Overview](./architecture/overview.md)
Complete system architecture, technology stack, design patterns, data flow, and security architecture.

**Topics covered:**
- High-level architecture diagram
- Technology stack (frontend & backend)
- Design patterns and conventions
- Component architecture
- Data flow and request lifecycle
- Security architecture
- Performance optimizations
- Scalability considerations

### [Database Schema](./database/schema.md)
Complete database schema documentation with entity relationships, constraints, and migration guides.

**Topics covered:**
- Entity Relationship Diagram (ERD)
- All table schemas with field descriptions
- Foreign key relationships
- Unique constraints and indexes
- Database migrations workflow
- Best practices for schema changes

---

## 🔒 Backend

### [Authentication & Authorization](./backend/authentication.md)
Complete guide to authentication system and role-based access control.

**Topics covered:**
- Better Auth setup and configuration
- Session management
- User roles and permissions
- Route protection patterns
- API security
- Password reset flow
- Security best practices

### [Real-time Features (Socket.IO)](./backend/realtime-socketio.md)
WebSocket communication with Socket.IO for real-time features.

**Topics covered:**
- Server and client setup
- Room architecture
- Event reference
- Chat implementation
- Real-time notifications
- Typing indicators
- Best practices and troubleshooting

---

## 🌐 API

### [API Routes Reference](./api/routes-reference.md)
Complete REST API documentation with all endpoints, request/response formats.

**Topics covered:**
- Authentication endpoints
- Projects CRUD
- Tasks management
- Columns (Kanban)
- EODs and Memos
- Chat messages
- Notifications
- Admin endpoints
- Error handling

---

## ⚡ Features

### [Task Management & Kanban](./features/task-management.md)
Complete guide to the task management system with Kanban board.

**Topics covered:**
- Task structure and schema
- Kanban board architecture
- Custom columns (default, project, user-specific)
- Drag-and-drop implementation (@dnd-kit)
- Task CRUD operations
- Comments and discussions
- Multiple assignees
- Time tracking

### [EOD Reports & Memos](./features/eod-memos.md)
Daily reporting system for tracking progress and updates.

**Topics covered:**
- EOD report structure (dual updates)
- Memo types (short, universal)
- Submission flow
- Weekly calendar view
- Missing updates tracking
- Auto-upsert logic
- Notifications

### [Notification System](./features/notifications.md)
Multi-channel notification system with user preferences.

**Topics covered:**
- 4 notification channels (Email, Push, In-App, Slack)
- Service architecture
- Email notifications (Nodemailer)
- Push notifications (Web Push API)
- In-app notifications (Socket.IO)
- Slack integration
- User preferences
- Event types

---

## 🛠️ Development

### [Development Setup](./guides/development-setup.md)
Complete guide to setting up the development environment.

**Topics covered:**
- Prerequisites and installation
- Database setup (Supabase or local PostgreSQL)
- Environment variables configuration
- Running the application
- Database migrations
- Seeding data
- Development tools (Drizzle Studio, VSCode extensions)
- Troubleshooting common issues

---

## 📖 Quick Reference

### Key Files

```
docs/
├── README.md                          # This file
├── architecture/
│   └── overview.md                    # System architecture
├── database/
│   └── schema.md                      # Database schema
├── backend/
│   ├── authentication.md              # Auth & RBAC
│   └── realtime-socketio.md           # Socket.IO
├── api/
│   └── routes-reference.md            # API endpoints
├── features/
│   ├── task-management.md             # Kanban system
│   ├── eod-memos.md                   # Daily reporting
│   └── notifications.md               # Multi-channel notifications
└── guides/
    └── development-setup.md           # Setup guide
```

---

## 🎯 Documentation by Use Case

### I want to...

#### ...understand the overall system
→ Start with [Architecture Overview](./architecture/overview.md)

#### ...set up my development environment
→ Read [Development Setup](./guides/development-setup.md)

#### ...understand the database
→ See [Database Schema](./database/schema.md)

#### ...work with the API
→ Check [API Routes Reference](./api/routes-reference.md)

#### ...implement authentication
→ Read [Authentication & Authorization](./backend/authentication.md)

#### ...add real-time features
→ See [Real-time Features](./backend/realtime-socketio.md)

#### ...work with tasks and Kanban
→ Read [Task Management Guide](./features/task-management.md)

#### ...implement notifications
→ See [Notification System](./features/notifications.md)

#### ...work with EOD reports
→ Check [EOD & Memos Guide](./features/eod-memos.md)

---

## 🔍 Finding Information

### By Technology

- **Next.js / React** → Architecture Overview
- **Database / Drizzle** → Database Schema, Development Setup
- **Authentication** → Authentication & Authorization
- **Socket.IO** → Real-time Features
- **APIs** → API Routes Reference
- **Notifications** → Notification System

### By Feature

- **Projects** → API Routes Reference, Database Schema
- **Tasks** → Task Management Guide, Database Schema
- **Chat** → Real-time Features
- **EODs/Memos** → EOD & Memos Guide, Database Schema
- **Dashboard** → Architecture Overview, API Routes Reference

### By Role

#### Frontend Developer
1. Architecture Overview
2. API Routes Reference
3. Task Management (UI components)

#### Backend Developer
1. Architecture Overview
2. Database Schema
3. Authentication & Authorization
4. API Routes Reference
5. Real-time Features

#### Full-Stack Developer
→ Read all documentation 😄

#### DevOps
1. Development Setup
2. Architecture Overview

---

## 📝 Documentation Standards

All documentation follows these standards:

- **Last Updated Date** - Every document includes update date
- **Table of Contents** - Easy navigation within documents
- **Code Examples** - Real code snippets from the project
- **Cross-references** - Links to related documentation
- **Best Practices** - Tips and recommendations
- **Troubleshooting** - Common issues and solutions
- **No Sensitive Data** - All credentials are placeholder examples

---

## 🤝 Contributing to Documentation

When updating documentation:

1. **Update the "Last Updated" date** at the top of the file
2. **Follow the existing structure** and formatting
3. **Add code examples** where appropriate
4. **Use placeholder values** for sensitive data (API keys, passwords, etc.)
5. **Include cross-references** to related docs
6. **Update this README** if adding new documentation files
7. **Update CLAUDE.md** to reference new docs

---

## 📌 Related Resources

- **[Main CLAUDE.md](../CLAUDE.md)** - Quick reference guide
- **[GitHub Repository](https://github.com/yourusername/project-hub)** - Source code

---

## 🆘 Getting Help

If you can't find what you're looking for:

1. Check the [CLAUDE.md](../CLAUDE.md) quick reference
2. Search within relevant documentation files
3. Review code examples in the codebase
4. Check the GitHub issues
5. Contact the development team

---

## ⚠️ Security Note

All credentials and sensitive information shown in documentation are **placeholder examples only**. Never commit real credentials to documentation or version control.

**Examples of placeholders used:**
- `your-secret-key`
- `your-password`
- `your-api-key`
- `[password]`
- `your-email@gmail.com`

Always use environment variables for actual credentials.

---

**Happy coding! 🚀**

**Last Updated:** 2026-02-02

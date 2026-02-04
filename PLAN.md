# 🧠 SaaS Task & Workforce Management System – Architecture Plan

## Overview

This document describes the **architecture, module-based folder structure, and technology stack** for a **multi-tenant SaaS task & workforce management platform**.

The system is designed to support:
- Multiple organizations (companies)
- Dynamic roles, hierarchy, and permissions
- Attendance & task tracking
- Approval workflows
- Automated reporting
- Subscription-based access
- Secure document management
- Enterprise-grade scalability

---

## 🎯 Core USP

- **Dynamic hierarchy & permission engine**
- Fully configurable roles (CEO, Manager, TL, Employee, custom roles)
- Permission-driven backend APIs & frontend UI
- Automation based on time and policies
- Multi-organization SaaS with subscriptions

---

## 🏗️ Tech Stack (MERN)

### Frontend
- React 18
- Vite
- TypeScript
- Redux Toolkit + RTK Query
- React Router v6
- Axios
- Socket.IO Client
- Zod (validation)

### Backend
- Node.js (v20+)
- Express.js
- MongoDB + Mongoose
- JWT + Refresh Tokens
- Zod (schema validation)
- Socket.IO
- BullMQ + Redis (queues)
- node-cron (automation)
- Cloudinary (file storage)
- Razorpay (payments & subscriptions)

---

## 📁 Root Folder Structure

saas-task-tracker/
├── client/ # React frontend
├── server/ # Node + Express backend
├── docker-compose.yml
├── .gitignore
├── README.md
└── plan.md


---

## 📦 Backend – Module-Based Architecture



server/src/
├── app.js
├── server.js
├── routes.js
│
├── config/
│ ├── db.js
│ ├── cloudinary.js
│ ├── razorpay.js
│ └── env.js
│
├── middlewares/
│ ├── auth.middleware.js
│ ├── org.middleware.js
│ ├── permission.middleware.js
│ └── error.middleware.js
│
├── modules/
│ ├── auth
│ ├── users
│ ├── organizations
│ ├── memberships
│ ├── roles
│ ├── permissions
│ ├── hierarchy
│ ├── teams
│ ├── tasks
│ ├── attendance
│ ├── policies
│ ├── leaves
│ ├── approvals
│ ├── performance
│ ├── documents
│ ├── notifications
│ ├── audit-logs
│ ├── billing
│ ├── payments
│ ├── subscriptions
│ ├── settings
│ └── jobs
│
└── utils/
├── logger.js
├── permissions.js
└── helpers.js


---

## 🧩 Module Responsibilities

### auth
- Login / logout
- JWT & refresh tokens
- Session enforcement

### users
- User profile
- Account status

### organizations
- Company creation
- SaaS tenant isolation

### memberships
- User ↔ organization mapping
- Role assignment per org
- Invite, activate, suspend members



memberships/
├── organization-memberships.model.js
├── organization-memberships.controller.js
├── organization-memberships.service.js
├── organization-memberships.validation.js
├── organization-memberships.routes.js
├── membership.constants.js


### roles
- Dynamic role creation
- Hierarchy level definition

### permissions
- Permission registry
- Role → permission mapping

### hierarchy
- Reporting structure (CEO → Manager → TL → Employee)
- Used for approvals & reporting

### teams
- Team / group creation
- Team head assignment

### tasks
- Employee task & todo calendar
- Task visibility expiration
- Task dependency tracking

### attendance
- Login / logout tracking
- Break usage
- Work hour calculation

### policies
- Work time rules
- Break limits
- Holiday calendar
- Overtime rules

### leaves
- Leave requests
- Half-day requests

### approvals
- Central approval engine
- Leave, overtime, task review approvals

### performance
- Task completion metrics
- Attendance analytics
- Team & individual performance

### documents
- Offer letters
- Salary details
- Secure file storage (Cloudinary)

### notifications
- In-app notifications
- Dependency alerts
- Approval status updates
- Socket-based real-time updates

### audit-logs
- Track critical actions
- Compliance & security

### billing
- Plan definitions
- Feature limits

### payments
- Razorpay order creation
- Payment verification
- Webhook handling

### subscriptions
- Organization subscription lifecycle
- Expiry tracking
- Auto-disable on expiry

### settings
- Organization-level feature toggles
- Policy switches (allow overtime, late login, etc.)

### jobs (Automation)
- Daily task & attendance report forwarding
- Auto logout after work hours
- Subscription expiry reminders

---

## ☁️ Cloudinary Integration

Used for:
- Offer letters
- Salary documents
- Attachments

Config location:


config/cloudinary.js


---

## 💳 Razorpay Integration

Used for:
- Plan purchases
- Subscription renewals
- Webhooks

Config location:


config/razorpay.js
modules/billing/
modules/payments/
modules/subscriptions/


---

## 🔐 Security Principles

- All APIs scoped by `organizationId`
- Backend always re-validates permissions
- Frontend only reflects permissions (never enforces)
- Sensitive fields encrypted
- Audit logs for critical actions

---

## 🎭 Frontend Permission-Based UI

- Pages, buttons, and sections are:
  - Shown
  - Hidden
  - Disabled  
  based on permissions returned from backend.

Example:
```js
hasPermission("CREATE_TEAM")

🚀 Development Phases
Phase 1 (MVP)

Auth

Organizations

Memberships

Roles & permissions

Tasks

Teams

Phase 2

Attendance

Policies

Leaves & approvals

Notifications

Automation jobs

Phase 3

Billing & subscriptions

Performance dashboards

Documents

Audit logs

Scaling & optimization

✅ Final Notes

This architecture is:

Multi-tenant ready

Enterprise-grade

Scalable

Secure

Designed for long-term SaaS growth
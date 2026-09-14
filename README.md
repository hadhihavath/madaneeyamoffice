# CEEM MADANEEYAM OFFICE
### Office Management & Communication System

> Built for **CEEM MADANEEYAM E-LEARNING**

A modern enterprise multi-office management, geofenced attendance, and real-time team communication platform built with Next.js 14, TypeScript, Tailwind CSS, and Prisma ORM.

![CEEM Madaneeyam Logo](public/brand/logo_en.png)

---

## 🌟 Key Features

- **Official Brand Identity**: Fully integrated CEEM Madaneeyam brand assets, colors, and styling.
- **Multi-Office Architecture**:
  - Out-of-the-box support for multiple branches across Kerala (Kozhikode, Malappuram, Kannur, Kochi, Wayanad) with organization-level and office-level data isolation.
- **Strict Server-Side Geofenced Attendance**:
  - Haversine distance verification calculates exact meter distance between employee coordinates and assigned office center.
  - Rejects check-ins outside configured office radius (e.g. 100m, 150m).
  - Double check-in prevention, live elapsed duration timer, and check-out tracking.
  - Anti-fraud heuristics detecting high GPS inaccuracy or impossible speed jumps.
- **Interactive Multi-Office Map**:
  - Vector map visualizing office locations, headcounts, present counts, and attendance rates.
- **Role-Based Access Control (RBAC)**:
  - Super Admin, Admin, HR, Office Manager, Department Manager, Employee.
  - 1-Click Demo Persona Switcher for effortless evaluation.
- **Enterprise Team Communication**:
  - Real-time channels (`#general`, `#kozhikode-office`, `#software-dev`) and Direct Messages.
  - Announcements hub with audience targeting (`EVERYONE`, `SPECIFIC_OFFICE`, `SPECIFIC_DEPARTMENT`).
- **Employee Directory & Profiles**:
  - Search, filter by office/department/role, Add Employee, Inter-office transfer with audit logging, and 6-tab profile view.
- **Leave Management**:
  - Application forms, balances, and manager/HR approval & rejection workflows.
- **Task Management**:
  - Kanban board (`TODO`, `IN_PROGRESS`, `REVIEW`, `COMPLETED`) with priority levels and filters.
- **Reports & Analytics**:
  - Branch comparisons and 1-click **Export to CSV** functionality.
- **Immutable Audit Trail**:
  - Timestamped records capturing actor, action, previous/new values, IP address, and resource ID.
- **System Settings**:
  - Per-office geofence radius matrix configuration (50m - 500m).

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database & Seed Sample Data
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Automated Tests
```bash
npm test
```

---

## 🎭 Demo Credentials

All test accounts share the default password: `Password123!`

| Role | Email | Name |
| :--- | :--- | :--- |
| **Super Admin** | `admin@ceem.edu` | Dr. Havath Rahman |
| **HR Manager** | `hr@ceem.edu` | Fatima Zahra |
| **Office Manager** | `kozhikode.manager@ceem.edu` | Tariq Al-Mansoor (Kozhikode HQ) |
| **Employee (Dev)** | `ahmed.employee@ceem.edu` | Ahmed Farooqui (Kozhikode) |
| **Employee (Academic)** | `zain.academic@ceem.edu` | Zainul Abideen (Kochi) |

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & ORM**: SQLite / PostgreSQL with Prisma ORM
- **Authentication**: JWT, bcryptjs, HTTP-only session cookies
- **Testing**: Vitest
- **Icons**: Lucide React

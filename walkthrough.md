# Enterprise Role-Based Dashboard System & Real Database Integration

This document outlines the complete implementation of the **Role-Based Dashboard System** powered by **100% real MongoDB database data** with dedicated interfaces for every user role and department in the ERP application.

---

## 🔑 Login Credentials for All Roles

You can test any role directly using the credentials below or by clicking the corresponding **Quick Role Button** on the login page:

| Role | Employee Name | Username | Password | Department | Dashboard View | Permitted Modules & Scope |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | System Administrator | `admin` | `admin123` | *All* | **Admin Control Center** | **Full System Access**: All modules, RBAC & user management, system settings, global dashboard view switcher |
| **Owner** | Prit Patel | `owner` | `owner123` | Management | **Executive Portal** | **Executive Summary**: Business KPIs, company productivity, task completion %, employee scorecards |
| **Dept. Manager** | Ramesh Sharma | `manager.accounts` | `accounts123` | Accounts | **Accounts Dashboard** | **Financials & Billing**: Live receipts revenue, statements, delivery challans, accounting tasks, print previews |
| **Dept. Manager** | Vikram Patel | `manager.logistics` | `logistics123` | Logistics / Store | **Store Dashboard** | **Warehouses & Yard**: Division stock balances, CR Inward vs Challan Outward, low-stock alerts, store tasks |
| **Dept. Manager** | Mahesh Sharma | `manager.production` | `production123` | Production | **Production Dashboard** | **Manufacturing**: Fabrication jobs, shift tasks, shopfloor material availability, machine cell status |
| **Dept. Manager** | Rajesh Trivedi | `manager.quality` | `quality123` | Quality | **Quality Dashboard** | **QA & IPQC**: Inward lot verification (CR), pre-dispatch inspections (Challans), compliance protocols |
| **Dept. Manager** | Sneha Kapadia | `manager.hr` | `hr1234` | HR | **HR Dashboard** | **Personnel & Workforce**: Employee headcount breakdown, performance score leaderboard, HR operations |
| **Dept. User** | Pooja Verma | `user.billing` | `billing123` | Accounts | **Worker Dashboard** | **My Daily Work**: Assigned tasks, progress updater (+25%, Mark Done), personal score, shortcuts (`/invoice`, `/create-receipt`, etc.) |
| **Dept. User** | Anil Desai | `user.store` | `store123` | Logistics / Store | **Worker Dashboard** | **My Daily Work**: Assigned store tasks, inventory shortcuts (`/create-cr`, `/cr-register`, `/remaining-material`) |

---

## 📊 100% Real Database Architecture (Zero Mock Data)

Every dashboard KPI, metric card, progress bar, table, and activity feed is computed directly from live MongoDB records via dedicated server-side aggregation endpoints (`/api/dashboards/*`).

```
                                    [User Login / JWT]
                                             │
                                             ▼
                                  [Role & Department Router]
                                             │
     ┌───────────────────────────────────────┼────────────────────────────────────────┐
     │                                       │                                        │
     ▼                                       ▼                                        ▼
[Admin Role]                           [Owner Role]                           [Manager Role]
  ├─ Admin Control Center                ├─ Owner Executive Portal              ├─ Accounts Manager Dashboard
  │  (System Config, RBAC, Users,        │  (Company KPIs, Department           ├─ Store Manager Dashboard
  │   Audit Logs, Department Overview,   │   Productivity, Employee             ├─ Production Manager Dashboard
  │   Global Dashboard Switcher)         │   Performance, Overdue Tasks)        ├─ Quality Manager Dashboard
                                                                                └─ HR Manager Dashboard
                                                                                      │
                                                                                      ▼
                                                                               [Employee Role]
                                                                                 └─ Worker Dashboard
                                                                                    (My Tasks, Today's Work,
                                                                                     Performance Score, Shortcuts)
```

---

### 1. Admin Dashboard (`/api/dashboards/admin`)
- **System KPIs**: 9 registered users (9 active, 0 inactive), 7 AI-enabled accounts, 12 total system tasks, 6 completed (50% completion rate), 1 overdue task alert.
- **Department Headcount Breakdown**: Logistics (2), Accounts (2), Management (1), Production (1), Quality (1), HR (1), Administration (1).
- **Overdue Tasks Panel**: Immediate alerts for tasks past their due date with assigned employee names and deadlines.
- **Recent System Activity Stream**: Live chronologically sorted feed across newly created Users, Delivery Challans, Material Statements, and Payment Receipts.
- **AI Security & Audit Trail**: Summary of total interactions, blocked injection attempts, and blocked out-of-scope queries.
- **Global View Switcher**: Admin can preview any department dashboard (Accounts, Store, Production, Quality, HR, Owner, Employee) in real-time from a single dropdown.

---

### 2. Owner Dashboard (`/api/dashboards/owner`)
- **Executive Throughput**: Real collections of **₹1,07,85,867.64** from 4 receipts, 8 active delivery challans, 9 verified statements, and registered contractors.
- **Department Work Progress**:
  - Accounts: 62% progress
  - Logistics: 80% progress
  - Production: 88% progress
  - Quality: 75% progress
  - HR: 80% progress
- **Employee Performance Matrix**: Detailed scorecards for all 7 operational employees tracking total assigned tasks, completed tasks, incomplete tasks, and productivity status.

---

### 3. Accounts Dashboard (`/api/dashboards/accounts`)
- **Financial Metrics**: Total revenue collected (**₹1,07,85,867.64**), 4 payment receipts, 9 material statements, 8 challans tracked, 7 client/contractor entities.
- **Receipts Collections Trend**: Monthly revenue bar chart rendered with Recharts based on real payment receipts.
- **Recent Statements Table**: Detailed statement cards with direct **Preview & Print** links (`#/statement-preview`).
- **Recent Payment Receipts**: Live receipt logs with party names and amounts.
- **Accounts Tasks**: Priority tasks assigned to billing and accounts staff.

---

### 4. Store & Logistics Dashboard (`/api/dashboards/store`)
- **Warehouse Inventory**: Real stock counts across 9 warehouse divisions:
  - Deesa: 599 pcs (Angle 65x65x6)
  - Deesa-2: 1,351 pcs
  - Deesa: 735 pcs
  - Palanpur-2: 700 pcs
  - Deesa-1: 140 pcs
- **Low-Stock & Reorder Alerts**: Real-time table flagging items with stock quantities near zero or below threshold.
- **Live Movement Log**: Inward Consignments (`StoreReceipt` / CR Register) vs Outward Dispatches (`Challan`).
- **Store Tasks**: Yard inventory audit and consignment tracking tasks.

---

### 5. Production Dashboard (`/api/dashboards/production`)
- **Active Manufacturing Jobs**: Scheduled fabrication tasks, preventive maintenance of hydraulic punching machines, and daily shift targets.
- **Shopfloor Material Availability**: Real-time pool of raw structural angles, channels, and plates available in division warehouses.
- **Machine Cell Status**: Clean reporting of machine lines with operational status.

---

### 6. Quality Assurance & IPQC Dashboard (`/api/dashboards/quality`)
- **Compliance Rate**: 100% adherence to quality inspection milestones.
- **Quality Protocols**: Zinc coating thickness inspection as per IS 4759 standards, pre-dispatch dimensional checks for site delivery.
- **Inward Lot Verification**: Cross-verification of materials received against live CR records.
- **Automated IPQC Telemetry Status**: Clear indicator that external machine telemetry is tracked via compliance protocols.

---

### 7. HR & Workforce Dashboard (`/api/dashboards/hr`)
- **Workforce Metrics**: 9 total employees, 100% active ratio, 92% average performance score.
- **Department Distribution**: Complete headcount breakdown across all 7 departments.
- **Performance Scorecard Leaderboard**: Real ranking of staff by performance score (Prit Patel 100%, Admin User 98%, Rajesh Trivedi 95%, Mahesh Sharma 93%, Vikram Patel 91%, Sneha Kapadia 90%, Pooja Verma 88%, Anil Desai 82%).
- **HR Operations**: Safety gear distribution and quarterly score calibration tasks.

---

### 8. Employee / Worker Dashboard (`/api/dashboards/employee`)
- **Personalized Scope**: Scoped strictly to the logged-in worker (`user.billing` or `user.store`).
- **Today's Schedule**: Highlights tasks due today.
- **Interactive Progress Updater**: Workers can click **+25%** or **Mark Done** to update task progress directly in MongoDB in real time.
- **Department Module Shortcuts**: Dynamically rendered shortcuts matching `user.assignedModules` (e.g. GST Invoices, Create Receipt, Receipt Management for Billing staff; Create CR, CR Register, Pending Material for Store staff).

---

## 🛡️ Backend Security & RBAC Verification

All dashboard endpoints implement strict identity and department-level authorization middlewares:

```javascript
// Example: Attempt by a regular worker to access Admin Dashboard
GET /api/dashboards/admin
Authorization: Bearer <user.billing token>

--> HTTP 403 Forbidden
--> {"message": "Access denied: Administrator privileges required"}
```

---

## 🧪 Automated Verification Test Results

Tests executed against live running backend (`http://localhost:5000/api`):

| Test Scenario | Endpoint | User Tested | Status | Live Result Verified |
| :-: | :--- | :--- | :---: | :--- |
| **1. Admin Dashboard** | `GET /api/dashboards/admin` | `admin` | ✅ `200 OK` | 9 users, 12 tasks, 10 feed items, 8 audit logs |
| **2. Owner Dashboard** | `GET /api/dashboards/owner` | `owner` | ✅ `200 OK` | ₹1,07,85,867.64 revenue, 5 depts, 7 employee scorecards |
| **3. Accounts Dashboard** | `GET /api/dashboards/accounts` | `manager.accounts` | ✅ `200 OK` | ₹1.07 Cr collections, 6 statements, 4 receipts, 3 tasks |
| **4. Store Dashboard** | `GET /api/dashboards/store` | `manager.logistics` | ✅ `200 OK` | 9 warehouses, 17 materials, 6 CRs, 8 challans, stock alerts |
| **5. Production Dashboard** | `GET /api/dashboards/production` | `manager.production` | ✅ `200 OK` | 2 fabrication jobs, raw material pool, machine status |
| **6. Quality Dashboard** | `GET /api/dashboards/quality` | `manager.quality` | ✅ `200 OK` | 2 inspection tasks, 6 inward verifications, compliance stats |
| **7. HR Dashboard** | `GET /api/dashboards/hr` | `manager.hr` | ✅ `200 OK` | 9 employees, 7 department counts, performance leaderboard |
| **8. Employee Dashboard** | `GET /api/dashboards/employee` | `user.billing` | ✅ `200 OK` | Scoped to Pooja Verma (2 tasks, 50% done, permitted shortcuts) |
| **9. Security / RBAC Check** | `GET /api/dashboards/admin` | `user.billing` | ✅ `403 Forbidden` | Access denied: Administrator privileges required |
| **10. Date Filter Test** | `GET /api/dashboards/admin?period=today` | `admin` | ✅ `200 OK` | Accurate date range filtering |

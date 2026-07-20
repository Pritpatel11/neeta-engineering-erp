# 🏭 Industrial ERP & Inventory Management System (Case Study)

> **Disclaimer:** This repository is a case study of a proprietary Enterprise Resource Planning (ERP) system developed for an industrial client. Due to Non-Disclosure Agreements (NDA) and company policies, the source code is kept private. This README serves as a showcase of the architecture, features, and my contributions to the project.

## 📌 Project Overview
The Industrial ERP System is a comprehensive, full-stack web application designed to streamline manufacturing and inventory operations. It digitizes the workflow of material inward/outward processes, client billing, delivery challans, and real-time stock tracking. 

## 💻 Tech Stack
- **Frontend:** React.js, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Tools & Integrations:** PDF Generation (A4 Layouts), Google Gemini AI (Assistant), RESTful APIs

---

## 🚀 Key Features
1. **Inventory Management:** Real-time tracking of raw materials and finished goods with low-stock alerts.
2. **Delivery Challan System:** Automated A4-sized printable Delivery Challans with professional layouts, logos, and authorized signatures.
3. **Quotation & Invoicing:** Proforma invoice generation with automatic GST (CGST/SGST) calculations.
4. **Material Statement Register:** Complex grid layouts for tracking material flow over time.
5. **AI Data Assistant:** Integrated AI chatbot using Google Gemini API to query inventory status naturally.

---

## 📐 System Architecture

This diagram illustrates the high-level architecture of the MERN stack application.

```plantuml
@startuml
left to right direction
skinparam componentStyle rectangle

node "Frontend" {
  component "Client (React + Tailwind)" as Client
}

node "Backend" {
  component "API Gateway / Express Server" as Gateway
  component "Business Logic\n(Inventory, Billing, PDF Gen)" as Services
}

database "MongoDB Database" as DB
cloud "Google Gemini AI" as AI

Client <--> Gateway : REST API / JSON
Gateway <--> Services
Services <--> DB
Services <--> AI : AI Prompts
@enduml
```

---

## 👥 Use Case Diagram

Here are the primary actions the Admin/Manager can perform within the ERP.

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor "Admin / Manager" as Admin

rectangle "ERP System Modules" {
  usecase "Manage Inventory (CRUD)" as M1
  usecase "Generate Delivery Challans" as M2
  usecase "Create Quotations & Invoices" as M3
  usecase "View Material Statements" as M4
  usecase "Ask AI Assistant" as M5
}

Admin --> M1
Admin --> M2
Admin --> M3
Admin --> M4
Admin --> M5
@enduml
```

---

## 🔄 Activity Diagram (Delivery Challan Process)

This flowchart represents the logical flow of creating and printing a Delivery Challan.

```plantuml
@startuml
start

:Start Delivery Challan;
:Select Client / Party Name;
:Add Materials to Challan;

if (Is Material In Stock?) then (Yes)
  :Deduct Stock from Inventory;
  :Generate PDF Document;
  :Print / Save Challan;
else (No)
  :Show "Out of Stock" Error;
  stop
endif

stop
@enduml
```

---

## 🗄️ Data Flow Diagram (DFD Level 0)

How data moves between the User, Core System, Database, and external services.

```plantuml
@startuml
left to right direction

' Defining Entities
actor "System User" as User
rectangle "PDF Generator Service" as PDF
database "Central Database\n(MongoDB)" as DB

' Defining Main Process
circle "ERP Core System" as System

' Data Flow Arrows
User --> System : 1. Input Data (Items, Client Info)
System --> DB : 2. Store & Update Data
DB --> System : 3. Fetch Records
System --> PDF : 4. Send Formatting Data
PDF --> System : 5. Return Printable Document
System --> User : 6. Display Final Report / Challan

@enduml
```

---

## ⏱️ Sequence Diagram (Challan Generation)

How the components interact over time during the Challan creation process.

```plantuml
@startuml
autonumber

actor "Admin / User" as User
participant "Frontend\n(React.js)" as UI
participant "Backend API\n(Express.js)" as API
database "Database\n(MongoDB)" as DB

User -> UI : Fill details & click "Generate Challan"
activate UI

UI -> API : POST /api/challan (Send Payload)
activate API

API -> DB : Query Inventory Status
activate DB
DB --> API : Return Stock Available
deactivate DB

API -> DB : Save Challan & Deduct Stock
activate DB
DB --> API : Confirm Saved
deactivate DB

API --> UI : Response 200 OK & Challan Data
deactivate API

UI -> UI : Format PDF Layout (using jsPDF/HTML2Canvas)
UI --> User : Display Print Preview / Download PDF
deactivate UI

@enduml
```

---

## 🚧 Challenges & Solutions

- **Challenge:** Creating pixel-perfect A4 printable documents (Challans/Invoices) directly from the browser without layout breaks.
  - **Solution:** Utilized custom CSS `@media print` queries, hid standard UI elements during print, and strictly managed margins to ensure predictable page breaks.

- **Challenge:** Complex data handling for "Material Statement Registers" containing 19+ columns that need to fit neatly on a single page.
  - **Solution:** Implemented vertical text orientation for table headers and dynamic column width calculations to fit extensive data arrays cleanly.

---

## 📸 Application Screenshots

*(Add your screenshots here. Make sure to blur any sensitive client data!)*

1. **Dashboard & Analytics**
   - `<img src="path-to-dashboard-image.jpg" width="600"/>`
2. **Delivery Challan Print Layout**
   - `<img src="path-to-challan-image.jpg" width="600"/>`
3. **AI Chat Assistant**
   - `<img src="path-to-ai-image.jpg" width="600"/>`

---
*Developed with ❤️ by [Your Name]*

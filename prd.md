# Project 3 PRD

## PROJECT OVERVIEW
This CRM & Ticket-Management MVP will help local gyms manage memberships, class bookings, and support tickets in one centralized app. It aims to streamline member data, simplify ticket resolution, and provide admin oversight for improved operations.

---

## USER ROLES & CORE WORKFLOWS

### **Gym Member**
- View and update profile.
- Manage class bookings.
- View gym visit history.
- Submit and track tickets.

### **CX Agent**
- Access member profiles.
- Manage assigned tickets.
- Escalate complex issues.

### **Admin**
- Oversee user roles.
- Configure membership plans.
- Reassign tickets.
- Generate performance reports.

---

## TECHNICAL FOUNDATION

### **Data Models**
- **Users**: Stores user details (email, role, membership plan) with relationships to Tickets and Bookings.
- **Membership Plans**: Captures plan name, pricing, and duration, linked to Users.
- **Tickets**: Contains member-reported issues, assigned agent, status, and priority.
- **Class Bookings**: Tracks class sessions booked by members with status and date/time fields.

### **API Endpoints**
- `POST /api/users`: Create new user (Admin only).
- `GET /api/users/:id`: Fetch user info (self or Admin only).
- `POST /api/tickets`: Create a new ticket (Member).
- `PUT /api/tickets/:id`: Update ticket status or assignment (Agent or Admin).
- `POST /api/class-bookings`: Book a class (Member).
- `GET /api/class-bookings`: List bookings (Member sees own, Admin sees all).

### **Key Components**
- **LoginPage**: Manages Supabase Auth and login.
- **Dashboard**: Displays role-based data including tickets and bookings.
- **TicketsPage**: Shows ticket list, detail, and creation/update forms.
- **MembershipPlansPage**: Allows viewing and editing of membership plans.
- **UserProfilePage**: Lets users view/edit personal data, with admin overrides.

---

## MVP LAUNCH REQUIREMENTS
- Secure login with role-based routes (Member, Agent, Admin).
- CRUD operations for user accounts, membership plans, tickets, and class bookings.
- Visibility controls so each role sees only relevant data.
- Basic ticket workflow from creation to closure with status updates.
- Simple class booking flow with scheduling and cancellation.
- Admin interface for plan management and user role assignments.
- Production-ready deployment using AWS Amplify, React, and Supabase.
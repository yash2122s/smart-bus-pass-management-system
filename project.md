# 🚌 TransitPass — Digital Bus Pass Management System

TransitPass is a modern, full-stack web application designed to digitize the traditional bus pass issuance and verification process. It provides a seamless experience for citizens to apply for passes, for administrators to manage applications, and for conductors to verify pass validity in real-time.

---

## 🚀 Technology Stack

### **Frontend**
- **React.js (Vite)**: For a fast, responsive user interface.
- **Lucide-React**: For a premium icon set.
- **Vanilla CSS3**: Custom design with glassmorphism aesthetics and mobile-first responsiveness.
- **React Router**: For secure, role-based navigation.

### **Backend**
- **Node.js & Express**: Robust API handling and business logic.
- **SQLite3**: Lightweight, file-based relational database for persistent storage.
- **CORS**: Secure cross-origin resource sharing.

---

## 🛠️ Key Features

### 1. **Citizen Portal**
- **Secure Registration/Login**: Personalized accounts for tracking pass history.
- **Smart Application Form**: Apply for Student, General, or Senior Citizen passes.
- **Duration Selector**: Choose between 1-Month or 3-Month validity with real-time price and expiry previews.
- **My Pass Dashboard**: View active, upcoming, and expired passes with visual progress bars.
- **Digital Pass Download**: (Simulated) Generate a digital credential after approval.

### 2. **Admin Command Center**
- **Live Metrics**: At-a-glance view of total users, pending applications, and approval rates.
- **Application Management**: Review detailed applicant info and Approve/Reject requests with one click.
- **User Monitoring**: View a complete directory of registered citizens.
- **Responsive Dashboard**: Fully functional on both desktop and mobile devices.

### 3. **Conductor Verification Portal**
- **Secure Entry**: Dedicated login for transit staff (e.g., COND001 / 1234).
- **ID-Based Verification**: Enter a unique Pass ID (e.g., `TP-ST2404...`) to instantly check status.
- **Real-time Status Check**: Returns `ACTIVE`, `EXPIRED`, `UPCOMING`, or `NOT FOUND`.
- **Verification History**: Keeps a local log of verified passes for the current shift.

---

## 📂 Project Structure

```text
BUSPASS REGISTRATION/
├── server.js            # Node.js backend & SQLite Database initialization
├── transit.db           # SQLite Database file (Auto-generated)
├── package.json         # Project dependencies & scripts
├── project.md           # This documentation
├── src/
│   ├── App.jsx          # Main React logic, Routes, and UI Components
│   ├── App.css          # Premium Design System & Responsive Styles
│   ├── main.jsx         # React Entry Point
│   └── services/
│       └── db.js        # Frontend Data Service (API calls to Backend)
```

---

## 🔑 Default Credentials

### **Administrator**
- **Username**: `admin`
- **Password**: `password@123`

### **Conductor**
- **ID**: `COND001` | **PIN**: `1234`
- **ID**: `COND002` | **PIN**: `5678`

---

## ⚙️ Setup & Installation

Follow these steps to run the project locally:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Backend Server**:
   (Open a terminal and run)
   ```bash
   node server.js
   ```

3. **Start the Frontend App**:
   (Open a second terminal and run)
   ```bash
   npm run dev
   ```

4. **Access the App**:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`

---

## 🛡️ Database Schema

The system utilizes three primary tables in SQLite:
- **`users`**: Stores name, email, and hashed passwords.
- **`admins`**: Specialized accounts for system oversight.
- **`passes`**: Centralized records including `passId`, `type`, `startDate`, `expiryDate`, and `status`.

---

## 🎨 Design Philosophy
TransitPass uses a **Dark-Modern Dashboard** aesthetic:
- **Glassmorphism**: Translucent cards with blur effects.
- **Vibrant Gradients**: Indigo-to-Pink accents for primary actions.
- **Mobile-First**: Fully responsive layout that adapts tables into cards for smartphone users.
- **Micro-animations**: Subtle fade-ins and hover effects for a premium feel.

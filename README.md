# 🚀 Enterprise-production-management Project Setup Guide

This guide explains how to install, configure, and run both the **Frontend** and **Backend** applications, and how to connect your  PostgreSQL database.

---

## 📁 Project Structure

```
/project-root

    ├── SMO-Frontend/        # [Frontend Source](https://github.com/PNSSVARDHAN/Enterprise-production-management)
    ├── SMO-Backend/         # [Backend Source](https://github.com/PNSSVARDHAN/Enterprise-production-management.Backend)

```

---

## 1️⃣ Frontend Setup

### 📌 Prerequisites

- **Node.js** (LTS version) → [Download](https://nodejs.org/)
- **Git** → [Download](https://git-scm.com/)

### 📥 Clone the Repository

```bash
git clone https://github.com/PNSSVARDHAN/Enterprise-production-management
cd SMO-Frontend
```

### 📦 Install Dependencies

```bash
npm install
```

### ⚡ Start the Frontend Server

```bash
npm start
```

The frontend will be available at: [http://localhost:3000](http://localhost:3000)

---

## 2️⃣ Backend Setup

### 📌 Prerequisites

Make sure you have the following installed:

- **Node.js** (LTS version) → [Download](https://nodejs.org/)
- **Git** → [Download](https://git-scm.com/)
- **PostgreSQL** (Database) → [Download](https://www.postgresql.org/download/)

### 📥 Clone the Repository

```bash
git clone https://github.com/PNSSVARDHAN/Enterprise-production-management.Backend
cd SMO-Backend
```

### 📦 Install Dependencies

```bash
npm install
```

### 🛠️ Configure Environment Variables

Create a `.env` file in the root directory and add your database configurations:

```env
PORT=5000
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_PORT=5432
```

Replace `your_db_user`, `your_db_password`, and `your_db_name` with your actual PostgreSQL credentials.

### 📊 Run Database Migrations

Set up your database tables:

```bash
npx sequelize-cli db:migrate
```

(Optional) To add sample data, run:

```bash
npx sequelize-cli db:seed:all
```

### ⚡ Start the Backend Server

```bash
npx nodemon src/index.js
```

The backend API will be available at: [http://localhost:5000](http://localhost:5000)


## ✅ You're all set!

This file ensures proper documentation for setting up the **Frontend**, **Backend**, and connecting your  database  on any system. 

please do verify the config file in backend folder and check the both frontend and backend link in both the folders  

---

## 🌐 Need Hosting Help?

If you want to host the site, I am open to guiding you. Feel free to contact me for assistance!

---

## 📬 Contact

- [LinkedIn](https://www.linkedin.com/in/pnssrivardhan/)
- [Email](mailto:pnssvardhan@gmail.com)

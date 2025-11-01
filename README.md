# Modern Notepad 📝

A full-stack, secure note-taking application built with a modern tech stack. This project features a React/Vite/TypeScript frontend and a Node.js/Express/MySQL backend. It allows users to register, log in, and manage their notes securely, with all data saved to a cloud database.

## 🚀 Live Demo

*(Link to your deployed Render frontend URL here)*

## 📸 Screenshots

*(Add your screenshots here!)*
| Login Page | Dashboard | Profile Modal |
| :---: | :---: | :---: |
| ![Login Page](notepad1.png) | ![Dashboard](notepad2.png) | *(Add Profile Modal screenshot)* |

## ✨ Features

* **Secure Authentication:** Full user registration and login flow using JWT (JSON Web Tokens) and `bcrypt` for password hashing.
* **Password Confirmation:** Client-side validation to ensure passwords match during registration.
* **Full CRUD for Notes:** Create, read, update, and delete notes.
* **Modern UI/UX:** Responsive, full-screen dashboard with a clean, two-column auth layout and animated background.
* **Auto-Saving:** Notes are automatically saved 500ms after you stop typing.
* **Profile Management:** A pop-up modal to view user details (username, word count, etc.) and a (work-in-progress) "Change Password" feature.
* **Search:** Instantly filter notes by title or content.
* **Note Stats:** Sidebar includes a live count of total notes and total words.

---

## 💻 Tech Stack

### Frontend
* **React 18**
* **Vite** (Build Tool)
* **TypeScript**
* **React Router** (Routing)
* **Axios** (API Communication)
* **CSS** (Modern, responsive design with custom properties)

### Backend
* **Node.js**
* **Express.js** (Server Framework)
* **MySQL 2** (Database)
* **JSON Web Tokens (JWT)** (Authentication)
* **bcrypt.js** (Password Hashing)
* **CORS** & **Dotenv**

---

## 🚀 Getting Started (Local Development)

To run this project on your local machine, you must run both the backend and frontend services.

### 1. Backend (`modern-notepad-backend`)

1.  **Clone the repo:**
    ```bash
    git clone [your-backend-repo-url]
    cd modern-notepad-backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up your database:**
    * Install MySQL on your machine (e.g., via MySQL Workbench).
    * The server is configured to automatically create the database (`modern_notepad_db`) and tables on its first run (`initDb`).
4.  **Create your environment file:**
    * Create a file named `.env` in the root of the `modern-notepad-backend` folder.
    * Add the following variables, replacing them with your local MySQL credentials:

    ```.env
    # MySQL Database
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_mysql_password
    DB_NAME=modern_notepad_db
    DB_PORT=3306
    
    # Server
    PORT=5001
    NODE_ENV=development
    
    # Security (use any random string)
    JWT_SECRET=a_very_strong_local_secret_key
    
    # Frontend URL for CORS
    CORS_ORIGIN=http://localhost:5173
    ```

5.  **Run the server:**
    ```bash
    npm run dev
    ```
    * The server will start on `http://localhost:5001`.

### 2. Frontend (`modern-notepad`)

1.  **Open a new terminal window.**
2.  **Clone the repo:**
    ```bash
    git clone [your-frontend-repo-url]
    cd modern-notepad
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Run the client:**
    * The `api.ts` file is already configured to talk to `http://localhost:5001` when in development.
    ```bash
    npm run dev
    ```
    * The React app will open on `http://localhost:5173`.

---

## 🌐 Deployment

This application is deployed on **Render**:

* **Database:** Deployed as a **Render MySQL** service.
* **Backend:** Deployed as a **Render Web Service** (Node.js), connected to the database using Render's internal connection string.
* **Frontend:** Deployed as a **Render Static Site** (Vite), with the `VITE_API_URL` environment variable pointing to the live backend service.
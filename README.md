# Collaborative To-Do Board - Frontend

## Project Overview

This is the frontend repository for a real-time collaborative to-do board application. Inspired by tools like Trello, it allows multiple users to manage tasks across "Todo," "In Progress," and "Done" columns. Changes made by any user are instantly reflected for all other active users, providing a seamless collaborative experience. The application also includes unique features like "Smart Assign" and robust conflict handling for simultaneous edits.

## Live Application & Demo

* **Deployed Live App:** "https://collaborative-todo-board-frontend-x.vercel.app/"

## Tech Stack

* **Framework:** React (Vite)
* **Styling:** Plain CSS
* **HTTP Requests:** Axios
* **Real-time Communication:** Socket.IO Client
* **Drag and Drop:** `@hello-pangea/dnd`

## Features and Usage Guide

### 1. User Authentication
* **Login Page:** Secure login for existing users.
* **Register Page:** Custom-built form for new user registration.

### 2. Kanban Board
* **Three Columns:** Tasks are organized into "Todo," "In Progress," and "Done."
* **Task Cards:** Each card displays the task title, description, assigned user, and priority.
* **Drag-and-Drop:** Tasks can be intuitively dragged and dropped between columns to change their status.
* **Real-Time Updates:** All changes (add, edit, delete, drag-drop, assign) are instantly synchronized across all connected users.

### 3. Task Management
* **Add New Task:** A modal allows users to create new tasks with title, description, assigned user, status, and priority.
* **Edit Task:** Existing tasks can be edited via a modal, updating their details.
* **Delete Task:** Tasks can be removed from the board.

### 4. Activity Log Panel
* Displays the last 20 actions performed on the board, updating in real-time.
* Shows who did what, when, and details of the change (e.g., status changed from X to Y).

### 5. Unique Logic Challenges

#### Smart Assign (Frontend UI)
* A "Smart Assign" button on each task card allows a user to trigger the backend logic.
* Upon clicking, the task is automatically assigned to the user with the fewest *active* (not "Done") tasks currently assigned to them. The UI updates to reflect the new assignee.

#### Conflict Handling (Frontend UI)
* If two users attempt to edit the same task concurrently, the frontend detects a conflict (via a `409 Conflict` response from the backend).
* A dedicated modal pops up, showing both the user's attempted changes ("Your Version") and the latest version from the server ("Server Version").
* Users are prompted to choose between:
    * **"Overwrite with Mine":** The user's changes are forced onto the server, overwriting the other user's changes.
    * **"Merge (Prioritize Mine's Title/Description)":** A simple merge strategy is applied (e.g., keeping the client's title/description, but accepting the server's status/priority/assignee).
    * **"Discard Mine (Keep Server's)":** The user's changes are discarded, and the task reverts to the server's latest version.

### 6. Animations
* Includes smooth drag-and-drop animations provided by `@hello-pangea/dnd`.
* Modal fade-in/scale-up animations.

### 7. Responsiveness
* The application is designed to work well on both desktop and mobile screen sizes, adapting its layout for optimal viewing and usability.

## Setup and Installation (Local Development)

To run the frontend locally, follow these steps:

### Prerequisites
* Node.js (v18 or higher recommended)
* npm (comes with Node.js) or Yarn

### Installation Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/rakshit-2oo4/collaborative-todo-board-frontend
    cd collaborative-todo-board-frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    ```

3.  **Create a `.env` file:**
    In the root of the `collaborative-todo-board-frontend` directory, create a file named `.env` and add the following:
    ```dotenv
    VITE_API_BASE_URL=http://localhost:5000/api
    VITE_BACKEND_SOCKET_URL=http://localhost:5000
    ```

4.  **Start the development server:**
    ```bash
    npm run dev
    # or yarn dev
    ```
    The application will typically be available at `http://localhost:5173`.

5.  **Ensure Backend is Running:**
    This frontend requires the backend API to be running. Please refer to the (https://github.com/rakshit-2oo4/collaborative-todo-board-backend/blob/main/README.md) for instructions on how to set up and run the backend locally.

---

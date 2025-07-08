import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import KanbanBoard from './components/KanbanBoard';
import './App.css';

// A component that manages rendering based on authentication
function AppContent() {
  const { isAuthenticated, loading, logout } = useAuth();
  const [showRegister, setShowRegister] = React.useState(false);

  if (loading) {
    return <div className="loading-screen">Loading application...</div>;
  }

  return (
    <div className="app-container">
      {isAuthenticated ? (
        <>
          <nav className="navbar">
            <h1>Collaborative To-Do Board</h1>
            <button onClick={logout} className="logout-button">Logout</button>
          </nav>
          <KanbanBoard />
        </>
      ) : showRegister ? (
        <RegisterForm
          onRegisterSuccess={() => setShowRegister(false)} // After register, go to login
          onNavigateToLogin={() => setShowRegister(false)}
        />
      ) : (
        <LoginForm
          onLoginSuccess={() => { /* Handled by AuthContext's state change */ }}
          onNavigateToRegister={() => setShowRegister(true)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
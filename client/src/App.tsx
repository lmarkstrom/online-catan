import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import UserPage from "./pages/UserPage";
import LobbyPage from "./pages/LobbyPage";

function App() {
  return (
    <Router>
        <Routes>
            {/* Landing Page (Login) */}
            <Route path="/" element={<HomePage />} />
            
            {/* Protected Dashboard */}
            <Route path="/user" element={<UserPage />} />
            
            {/* Game Lobby */}
            <Route path="/lobby/:id" element={<LobbyPage />} />
            
            {/* Optional: Catch-all redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </Router>
  );
}

export default App;

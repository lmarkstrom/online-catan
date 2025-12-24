import { useState, useEffect } from "react"; // Added useEffect
import { useNavigate } from "react-router-dom"; // Added useNavigate
import { auth } from "@/lib/firebase"; // Import auth to check state
import { Box, Button, Typography, Paper, Container } from "@mui/material";
import { Hexagon } from "@mui/icons-material";
import LoginModal from "@/components/LoginModal";

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate(); // Hook for navigation

  // 1. Auto-redirect if already logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (u) {
        navigate("/user");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // 2. Handle Login Success
  const handleLoginSuccess = () => {
    setModalOpen(false);
    navigate("/user"); // FIX: Actually move to the dashboard!
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        // Consistent warm/cool gradient matching the HomePage
        background: "linear-gradient(135deg, #fff1eb 0%, #ace0f9 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative Background Elements (Optional subtle hexes) */}
      <Hexagon 
        sx={{ 
            position: 'absolute', top: '10%', left: '5%', 
            fontSize: 300, color: 'rgba(255,255,255,0.4)', transform: 'rotate(15deg)' 
        }} 
      />
      <Hexagon 
        sx={{ 
            position: 'absolute', bottom: '-5%', right: '-5%', 
            fontSize: 400, color: 'rgba(255,255,255,0.4)', transform: 'rotate(-15deg)' 
        }} 
      />

      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 2 }}>
        <Paper
          elevation={12}
          sx={{
            padding: 6,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 4,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            textAlign: "center",
          }}
        >
          {/* Logo / Icon Area */}
          <Box
            sx={{
              width: 80,
              height: 80,
              backgroundColor: "#ea580c",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 3,
              boxShadow: "0 8px 16px rgba(234, 88, 12, 0.3)",
            }}
          >
            <Hexagon sx={{ fontSize: 50, color: "white" }} />
          </Box>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              background: "linear-gradient(45deg, #c2410c 30%, #ea580c 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-1px",
              mb: 1,
            }}
          >
            CATAN ONLINE
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 5 }}>
            Trade, Build, Settle. <br /> Play with friends instantly.
          </Typography>

          <Button
            onClick={() => setModalOpen(true)}
            variant="contained"
            size="large"
            fullWidth
            sx={{
              py: 2,
              fontSize: "1.1rem",
              fontWeight: "bold",
              borderRadius: 2,
              textTransform: "none",
              backgroundColor: "#1e293b", // Dark Slate Blue for contrast
              boxShadow: "0 8px 20px rgba(30, 41, 59, 0.3)",
              "&:hover": {
                backgroundColor: "#0f172a",
                transform: "translateY(-2px)",
                boxShadow: "0 10px 25px rgba(30, 41, 59, 0.4)",
              },
              transition: "all 0.3s ease",
            }}
          >
            Sign In
          </Button>

          <Typography variant="caption" sx={{ mt: 4, color: "#94a3b8" }}>
            v1.0 • Catan online
            <br />
            © 2025 Linus Markström
          </Typography>
        </Paper>
      </Container>

      <LoginModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </Box>
  );
}
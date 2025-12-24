import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserDocument } from "@/lib/db";
import {
  Dialog,
  DialogContent,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Tab,
  Tabs,
  InputAdornment,
  IconButton,
  Stack,
  CircularProgress,
  Fade,
} from "@mui/material";
import {
  EmailOutlined,
  LockOutlined,
  PersonOutline,
  Visibility,
  VisibilityOff,
  Close,
} from "@mui/icons-material";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export default function LoginModal({
  open,
  onClose,
  onLoginSuccess,
}: LoginModalProps) {
  const [tab, setTab] = useState(0); // 0 = login, 1 = register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    setError("");
    // Optional: Reset fields when switching tabs
    // setEmail(""); setPassword(""); setDisplayName("");
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess();
      handleClose();
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !displayName) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Create user document in Firestore
      await createUserDocument(
        userCredential.user.uid,
        email,
        displayName
      );

      onLoginSuccess();
      handleClose();
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (err: any) => {
    if (err.code === "auth/operation-not-allowed") {
      setError("Authentication is not enabled in Firebase Console.");
    } else if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
    } else if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
    } else {
      setError(err.message || "Authentication failed");
    }
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
    setError("");
    setTab(0);
    setLoading(false);
    setShowPassword(false);
    onClose();
  };

  return (
    <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{
            sx: {
                borderRadius: 4,
                backgroundImage: 'none',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden'
            }
        }}
    >
      {/* Close Button */}
      <IconButton 
        onClick={handleClose} 
        sx={{ position: 'absolute', right: 8, top: 8, color: 'grey.500', zIndex: 10 }}
      >
        <Close />
      </IconButton>

      {/* Header Section */}
      <Box sx={{ 
          pt: 4, 
          pb: 2, 
          px: 3, 
          textAlign: 'center', 
          background: 'linear-gradient(135deg, #fff1eb 0%, #ace0f9 100%)' 
      }}>
        <Typography variant="h5" fontWeight="800" color="#1e293b" gutterBottom>
            {tab === 0 ? "Welcome Back!" : "Join the Game"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
            {tab === 0 ? "Enter your credentials to continue" : "Create your profile to start settling"}
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: 'white' }}>
        <Tabs 
            value={tab} 
            onChange={handleTabChange} 
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            sx={{
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '1rem' }
            }}
        >
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 4, bgcolor: 'white' }}>
        <Stack spacing={2.5}>
            {error && (
                <Fade in={!!error}>
                    <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
                </Fade>
            )}

            {/* REGISTER: Display Name Field */}
            {tab === 1 && (
                <TextField
                    label="Display Name"
                    fullWidth
                    variant="outlined"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={loading}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <PersonOutline color="action" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
            )}

            {/* Email Field */}
            <TextField
                label="Email Address"
                type="email"
                fullWidth
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <EmailOutlined color="action" />
                        </InputAdornment>
                    ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            {/* Password Field */}
            <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                fullWidth
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <LockOutlined color="action" />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                            >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            {/* Action Button */}
            <Button
                onClick={tab === 0 ? handleLogin : handleRegister}
                variant="contained"
                fullWidth
                disabled={loading}
                size="large"
                sx={{
                    py: 1.5,
                    mt: 2,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    boxShadow: '0 4px 12px rgba(234, 88, 12, 0.2)',
                    background: 'linear-gradient(45deg, #ea580c 30%, #f97316 90%)',
                    '&:hover': {
                        background: 'linear-gradient(45deg, #c2410c 30%, #ea580c 90%)',
                    }
                }}
            >
                {loading ? (
                    <CircularProgress size={24} color="inherit" />
                ) : (
                    tab === 0 ? "Log In" : "Create Account"
                )}
            </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
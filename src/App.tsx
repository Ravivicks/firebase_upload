import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { User } from "@supabase/supabase-js";
import { supabase } from "./lib/supabaseClient";
import Header from "./components/header";
import SignUp from "./components/sign-up";
import Login from "./components/login";
import ImageGallery from "./components/gallery";
import ImageUpload from "./components/upload";

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-background w-screen">
        <Header user={user} />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Routes>
              <Route
                path="/signup"
                element={!user ? <SignUp /> : <Navigate to="/gallery" />}
              />
              <Route
                path="/login"
                element={!user ? <Login /> : <Navigate to="/gallery" />}
              />
              <Route
                path="/gallery"
                element={
                  user ? <ImageGallery user={user} /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/upload"
                element={
                  user ? <ImageUpload user={user} /> : <Navigate to="/login" />
                }
              />
              <Route path="/" element={<Navigate to="/gallery" />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    </Router>
  );
}

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        navigate("/gallery");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return <div>Completing sign in...</div>;
}

export default App;

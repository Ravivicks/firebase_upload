import { useEffect, useState } from "react";
import "./App.css";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./lib/firebase";
import { Auth } from "./components/auth";
import { Upload } from "./components/upload";
import { Gallery } from "./components/gallery";

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.email}</h1>
      <Upload userId={user.uid} />
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Your Gallery</h2>
        <Gallery userId={user.uid} />
      </div>
    </div>
  );
}

export default App;

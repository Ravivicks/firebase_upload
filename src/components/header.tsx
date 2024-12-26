import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { LogOut, Upload, Image } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "../lib/supabaseClient";

interface HeaderProps {
  user: User | null;
}

export default function Header({ user }: HeaderProps) {
  const navigate = useNavigate();
  const photoURL = user?.user_metadata?.photoURL;
  const displayName = user?.user_metadata?.displayName || "Anonymous User";

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.log("Error logging out:", error.message);
  };

  return (
    <header className="bg-background border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Image Gallery</h1>
        <nav>
          {user ? (
            <div className="flex items-center space-x-4">
              <Button onClick={() => navigate("/gallery")}>
                <Image className="mr-2 h-4 w-4" />
                Gallery
              </Button>
              <Button onClick={() => navigate("/upload")}>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={photoURL || undefined}
                        alt={displayName || "User avatar"}
                      />
                      <AvatarFallback>{displayName?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="space-x-4">
              <Button onClick={() => navigate("/login")}>Login</Button>
              <Button onClick={() => navigate("/signup")}>Sign Up</Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";

const Login = () => {
  const [view, setView] = useState<"login" | "register" | "forgot_password">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/admin");
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        toast({
          title: "Berjaya log masuk",
          description: "Selamat datang kembali!",
        });
        navigate("/admin");

      } else if (view === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;

        toast({
          title: "Pendaftaran berjaya",
          description: "Sila semak emel anda untuk pengesahan.",
        });
        setView("login");

      } else if (view === "forgot_password") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;

        toast({
          title: "Emel dihantar",
          description: "Sila semak emel anda untuk pautan set semula kata laluan.",
        });
        setView("login");
      }
    } catch (error: unknown) {
      console.error("Auth error:", error);
      const message = error instanceof Error ? error.message : "Sesuatu yang tidak kena berlaku.";
      toast({
        title: "Ralat",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (view) {
      case "login": return "Log Masuk Admin";
      case "register": return "Daftar Akaun";
      case "forgot_password": return "Lupa Kata Laluan";
    }
  };

  const getDescription = () => {
    switch (view) {
      case "login": return "Sila masukkan kelayakan anda untuk meneruskan";
      case "register": return "Isi maklumat di bawah untuk mendaftar";
      case "forgot_password": return "Masukkan emel anda untuk set semula kata laluan";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border bg-card p-8 shadow-card relative">
        <Link to="/" className="absolute top-8 left-8 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {getTitle()}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {getDescription()}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {view === "register" && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Penuh</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Nama Anda"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Emel</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {view !== "forgot_password" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Kata Laluan</Label>
                {view === "login" && (
                  <button
                    type="button"
                    onClick={() => setView("forgot_password")}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Lupa kata laluan?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sila tunggu..." : 
              view === "login" ? "Log Masuk" : 
              view === "register" ? "Daftar" : "Hantar Pautan"}
          </Button>
        </form>

        <div className="text-center text-sm">
          {view === "login" ? (
            <p className="text-muted-foreground">
              Belum mempunyai akaun?{" "}
              <button
                onClick={() => setView("register")}
                className="font-medium text-primary hover:underline"
              >
                Daftar sekarang
              </button>
            </p>
          ) : (
            <p className="text-muted-foreground">
              Sudah mempunyai akaun?{" "}
              <button
                onClick={() => setView("login")}
                className="font-medium text-primary hover:underline"
              >
                Log masuk
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;

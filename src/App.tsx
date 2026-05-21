import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index.tsx";
import Agenda from "./pages/Agenda.tsx";
import Billing from "./pages/Billing.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AlarmModal } from "@/components/AlarmModal";
import { useAppointmentAlarm } from "@/hooks/useAppointmentAlarm";
import { withAuthTimeout } from "@/lib/authTimeout";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";

const queryClient = new QueryClient();

const useSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);
  useEffect(() => {
    // IMPORTANT: subscribe BEFORE getSession to avoid races
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      setLoading(false);
    });
    withAuthTimeout(supabase.auth.getSession())
      .then(({ data }) => {
        setSession(data.session);
      })
      .catch(() => {
        setSession(null);
      })
      .finally(() => setLoading(false));
    return () => sub.subscription.unsubscribe();
  }, []);
  return { session, loading, recovery };
};

const Shell = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider defaultOpen={false}>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  </SidebarProvider>
);

const AuthedArea = () => {
  const { active, dismiss } = useAppointmentAlarm();
  return (
    <>
      <Routes>
        <Route path="/" element={<Shell><Index /></Shell>} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/billing" element={<Shell><Billing /></Shell>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AlarmModal appointment={active} onDismiss={dismiss} />
    </>
  );
};

const Gate = () => {
  const { session, loading, recovery } = useSession();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  // Public routes — always accessible.
  // /reset-password must remain public so the recovery hash can establish
  // the temporary session before the user sets a new password.
  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/login"
        element={session && !recovery ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={session && !recovery ? <Navigate to="/" replace /> : <Register />}
      />
      <Route
        path="/forgot-password"
        element={session && !recovery ? <Navigate to="/" replace /> : <ForgotPassword />}
      />
      <Route
        path="/*"
        element={session ? <AuthedArea /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Gate />
        <PwaInstallPrompt />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

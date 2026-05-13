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
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AlarmModal } from "@/components/AlarmModal";
import { useAppointmentAlarm } from "@/hooks/useAppointmentAlarm";

const queryClient = new QueryClient();

const useSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return { session, loading };
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
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AlarmModal appointment={active} onDismiss={dismiss} />
    </>
  );
};

const Gate = () => {
  const { session, loading } = useSession();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/*" element={<AuthedArea />} />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

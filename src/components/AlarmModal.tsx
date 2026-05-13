import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BellRing } from "lucide-react";
import type { AlarmAppointment } from "@/hooks/useAppointmentAlarm";

interface Props {
  appointment: AlarmAppointment | null;
  onDismiss: () => void;
}

export function AlarmModal({ appointment, onDismiss }: Props) {
  if (!appointment) return null;
  const time = new Date(appointment.scheduled_at).toLocaleString("pt-BR");
  return (
    <Dialog open onOpenChange={(o) => !o && onDismiss()}>
      <DialogContent className="border-2 border-destructive bg-background">
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <div className="h-16 w-16 rounded-full bg-destructive/15 flex items-center justify-center animate-pulse">
            <BellRing className="h-8 w-8 text-destructive" />
          </div>
          <DialogTitle className="text-xl">Avaliação agendada!</DialogTitle>
          <DialogDescription className="text-base font-semibold text-foreground">
            {appointment.title}
          </DialogDescription>
          <div className="text-sm text-muted-foreground">{time}</div>
          {appointment.notes && (
            <div className="text-sm bg-muted rounded-md p-3 w-full text-left">{appointment.notes}</div>
          )}
          <Button size="lg" variant="destructive" onClick={onDismiss} className="w-full mt-2">
            Parar alarme
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { ReactNode } from "react";

interface PanelProps {
  id?: string;
  icon: ReactNode;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export const Panel = ({ id, icon, title, action, children }: PanelProps) => (
  <section id={id} className="panel scroll-mt-24 panel-enter">
    <header className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <span className="icon-chip">{icon}</span>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {action}
    </header>
    <div className="space-y-4">{children}</div>
  </section>
);

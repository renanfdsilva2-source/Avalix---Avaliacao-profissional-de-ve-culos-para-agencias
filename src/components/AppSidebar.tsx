import {
  Car,
  FileCheck,
  Wrench,
  Fuel,
  PaintBucket,
  Camera,
  Calculator,
  PenTool,
  Shield,
  ClipboardList,
  Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { AvalixLogo } from "@/components/AvalixLogo";
import { useEffect, useState } from "react";

const groups: {
  label: string;
  items: { id: string; title: string; icon: React.ComponentType<{ className?: string }> }[];
}[] = [
  {
    label: "Avaliação",
    items: [
      { id: "sec-veiculo", title: "Dados do veículo", icon: Car },
      { id: "sec-documentacao", title: "Documentação", icon: FileCheck },
      { id: "sec-avarias", title: "Avarias e descontos", icon: ClipboardList },
      { id: "sec-reparos", title: "Reparos / Manutenção", icon: Wrench },
    ],
  },
  {
    label: "Especificações",
    items: [
      { id: "sec-manutencao", title: "Manutenção (rápida)", icon: Wrench },
      { id: "sec-gnv", title: "GNV", icon: Fuel },
      { id: "sec-pintura", title: "Pintura total", icon: PaintBucket },
    ],
  },
  {
    label: "Mídia & Finalização",
    items: [
      { id: "sec-fotos", title: "Fotos", icon: Camera },
      { id: "sec-resumo", title: "Resumo", icon: Calculator },
      { id: "sec-assinatura", title: "Assinatura", icon: PenTool },
      { id: "sec-lgpd", title: "LGPD", icon: Shield },
    ],
  },
];

const allItems = groups.flatMap((g) => g.items);

export function AppSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const [activeId, setActiveId] = useState<string>(allItems[0].id);

  // Scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    allItems.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleNav = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.add("ring-flash");
      setTimeout(() => el.classList.remove("ring-flash"), 900);
    }
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/70">
      <SidebarHeader className="border-b border-border/60 px-3 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br from-[hsl(214_50%_14%)] to-[hsl(213_64%_7%)] border border-primary/30 flex items-center justify-center shadow-button">
            <AvalixLogo size={24} />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-none min-w-0">
              <span className="text-sm font-extrabold tracking-[0.18em] text-foreground">
                AVAL<span className="text-primary-glow">I</span>X
              </span>
              <span className="text-[9px] font-semibold tracking-[0.24em] text-muted-foreground mt-1 truncate">
                CORPORATE SUITE
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1.5">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Agenda" className="h-9 rounded-md hover:bg-secondary/70">
                  <Link to="/agenda">
                    <Calendar className="h-4 w-4 text-primary-glow" />
                    <span className="text-[13px] font-medium">Agenda</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>

            {!collapsed && (
              <SidebarGroupLabel className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground/80">
                {g.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const active = activeId === item.id;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        onClick={() => handleNav(item.id)}
                        className={[
                          "group/btn relative h-9 rounded-md transition-all duration-200",
                          "hover:bg-secondary/70 hover:text-foreground",
                          "data-[active=true]:bg-primary/12 data-[active=true]:text-foreground",
                          "data-[active=true]:shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.35)]",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full",
                            "bg-gradient-to-b from-primary-glow to-primary",
                            "transition-all duration-200",
                            active ? "opacity-100 scale-y-100" : "opacity-0 scale-y-50",
                          ].join(" ")}
                          aria-hidden
                        />
                        <item.icon
                          className={[
                            "h-4 w-4 transition-colors",
                            active ? "text-primary-glow" : "text-muted-foreground group-hover/btn:text-foreground",
                          ].join(" ")}
                        />
                        <span className="text-[13px] font-medium">{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/60 px-3 py-3">
        {!collapsed ? (
          <div className="text-[10px] text-muted-foreground leading-relaxed">
            <div className="font-semibold tracking-wider text-foreground/80">AVALIX · v1.0</div>
            <div>Plataforma corporativa</div>
          </div>
        ) : (
          <div className="h-2 w-2 rounded-full bg-primary-glow/80 mx-auto" />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

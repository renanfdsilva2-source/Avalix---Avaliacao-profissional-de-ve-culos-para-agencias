import jsPDF from "jspdf";

export interface PhotoEntry {
  label: string;
  src: string; // data URL or public URL
}

interface RepairLine {
  label: string;
  value: number;
}

interface DocumentationData {
  ipva: string | null;
  licenciamento: string | null;
  multas: string | null;
  transferencia: string | null;
  observacoes: string;
}

interface EvaluationData {
  veiculo: {
    placa: string;
    marca: string;
    modelo: string;
    ano: string;
    cor: string;
    fipe: number;
    km: string;
    cambio: string | null;
  };
  photos: PhotoEntry[];
  signature: string | null;
  breakdown: { label: string; value: number }[];
  repairs: RepairLine[];
  documentation: DocumentationData;
  fipeValue: number;
  totalDescontos: number;
  valorFinal: number;
}

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const docLabel = (k: string, v: string | null) => {
  if (!v) return "-";
  const map: Record<string, string> = {
    ok: "Em dia / Regular",
    atrasado: "Atrasado",
    sem: "Sem multas",
    com: "Com multas",
    pendente: "Pendente",
  };
  return map[v] || v;
};

export async function generateEvaluationPdf(data: EvaluationData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // Header
  doc.setFillColor(255, 140, 30);
  doc.rect(0, 0, pageW, 22, "F");
  doc.setTextColor(20, 20, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("AVALIX", margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Avaliação Automotiva Corporativa", margin, 19);

  doc.setTextColor(120, 120, 130);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleString("pt-BR"), pageW - margin, 14, { align: "right" });

  y = 32;
  doc.setTextColor(20, 20, 30);

  const ensure = (need: number) => {
    if (y + need > 285) {
      doc.addPage();
      y = margin;
    }
  };

  const sectionTitle = (t: string) => {
    ensure(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(255, 140, 30);
    doc.text(t, margin, y);
    doc.setDrawColor(230);
    doc.line(margin, y + 1.5, pageW - margin, y + 1.5);
    y += 7;
    doc.setTextColor(40, 40, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const row = (label: string, value: string) => {
    ensure(6);
    doc.setTextColor(110, 110, 120);
    doc.text(label, margin, y);
    doc.setTextColor(20, 20, 30);
    doc.setFont("helvetica", "bold");
    doc.text(value, pageW - margin, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 6;
  };

  // Vehicle
  sectionTitle("Dados do Veículo");
  row("Placa", data.veiculo.placa || "-");
  row("Marca / Modelo", `${data.veiculo.marca} ${data.veiculo.modelo}`.trim() || "-");
  row("Ano", data.veiculo.ano || "-");
  row("Cor", data.veiculo.cor || "-");
  row("Quilometragem", data.veiculo.km || "-");
  row("Câmbio", data.veiculo.cambio === "manual" ? "Manual" : data.veiculo.cambio === "automatico" ? "Automático" : "-");
  row("Valor FIPE", formatBRL(data.fipeValue));

  y += 3;

  // Documentation
  sectionTitle("Documentação");
  row("IPVA", docLabel("k", data.documentation.ipva));
  row("Licenciamento", docLabel("k", data.documentation.licenciamento));
  row("Multas", docLabel("k", data.documentation.multas));
  row("Transferência", docLabel("k", data.documentation.transferencia));
  if (data.documentation.observacoes) {
    ensure(10);
    doc.setTextColor(110, 110, 120);
    doc.text("Observações:", margin, y);
    y += 5;
    doc.setTextColor(20, 20, 30);
    const lines = doc.splitTextToSize(data.documentation.observacoes, pageW - margin * 2);
    lines.forEach((ln: string) => {
      ensure(5);
      doc.text(ln, margin, y);
      y += 5;
    });
  }

  y += 3;

  // Repairs
  if (data.repairs.length > 0) {
    sectionTitle("Reparos / Manutenção Necessária");
    data.repairs.forEach((r) => row(r.label, formatBRL(r.value)));
    y += 3;
  }

  // Discounts
  sectionTitle("Descontos Aplicados");
  if (data.breakdown.length === 0) {
    ensure(6);
    doc.setTextColor(120, 120, 130);
    doc.text("Nenhum desconto aplicado.", margin, y);
    y += 6;
  } else {
    data.breakdown.forEach((b) => row(b.label, formatBRL(b.value)));
  }
  row("Total descontos", formatBRL(data.totalDescontos));

  y += 4;
  // Final value box
  ensure(28);
  doc.setFillColor(255, 140, 30);
  doc.roundedRect(margin, y, pageW - margin * 2, 22, 3, 3, "F");
  doc.setTextColor(20, 20, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("VALOR FINAL SUGERIDO", margin + 5, y + 8);
  doc.setFontSize(20);
  doc.text(formatBRL(data.valorFinal), pageW - margin - 5, y + 15, { align: "right" });
  y += 30;

  // Photos
  if (data.photos.length > 0) {
    sectionTitle("Fotos do Veículo");
    const cols = 2;
    const gap = 4;
    const w = (pageW - margin * 2 - gap * (cols - 1)) / cols;
    const h = w * 0.7;
    let col = 0;
    for (const { label, src } of data.photos) {
      if (y + h + 8 > 285) {
        doc.addPage();
        y = margin;
      }
      const x = margin + col * (w + gap);
      try {
        doc.addImage(src, "JPEG", x, y, w, h, undefined, "FAST");
      } catch {
        try {
          doc.addImage(src, "PNG", x, y, w, h, undefined, "FAST");
        } catch {
          /* skip */
        }
      }
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 90);
      doc.text(label, x + 2, y + h + 4);
      col++;
      if (col >= cols) {
        col = 0;
        y += h + 8;
      }
    }
    if (col !== 0) y += h + 8;
  }

  // Signature
  if (data.signature) {
    if (y + 40 > 285) {
      doc.addPage();
      y = margin;
    }
    sectionTitle("Assinatura do Avaliador");
    try {
      doc.addImage(data.signature, "PNG", margin, y, 80, 30);
    } catch {
      /* ignore */
    }
    y += 32;
    doc.setDrawColor(180);
    doc.line(margin, y, margin + 80, y);
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 130);
    doc.text("Avaliador", margin, y + 4);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 160);
    doc.text(
      "Documento gerado por AVALIX • Em conformidade com a LGPD (Lei nº 13.709/2018)",
      pageW / 2,
      290,
      { align: "center" }
    );
  }

  doc.save(`avaliacao-${(data.veiculo.placa || "veiculo").toLowerCase()}.pdf`);
}

import { Clock, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import { Switch } from "@/components/ui/switch";
import foodImage from "@/assets/food-horario-restaurante.jpg";

const DAYS = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

const defaultSchedule: Record<string, DaySchedule> = Object.fromEntries(
  DAYS.map((d) => [d.key, { open: "08:00", close: "22:00", closed: false }])
);

const CadastroHorarioRestaurantePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(defaultSchedule);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const updateDay = (key: string, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const restaurantId = sessionStorage.getItem("restaurant_id");
    if (!restaurantId) {
      toast({ title: "Erro", description: "ID do restaurante não encontrado.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetchApi(`/restaurantes/${restaurantId}/horarios`, {
        method: "POST",
        body: JSON.stringify(
          Object.entries(schedule).map(([day, times]) => ({
            dia_semana: DAYS.find(d => d.key === day)?.key === "dom" ? 0 : DAYS.findIndex(d => d.key === day) + 1,
            abertura: times.open,
            fechamento: times.close,
            fechado: times.closed
          }))
        ),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "Restaurante cadastrado!", description: "Seu restaurante foi registrado com sucesso." });
        sessionStorage.removeItem("restaurant_id");
        navigate("/gerencia-restaurante");
      } else {
        toast({ title: "Erro", description: data.message || data.error || "Erro ao salvar horários.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", description: "Não foi possível conectar ao servidor.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const timeInputClass = "h-10 px-3 rounded-lg bg-card border border-border text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-40 disabled:bg-muted";

  return (
    <AuthLayout
      backgroundImage={foodImage}
      panelTitle="Horário de funcionamento"
      panelSubtitle="Defina os dias e horários de operação do seu restaurante."
    >
      <h1 className="text-2xl font-extrabold text-foreground mb-2">Horários</h1>
      <p className="text-muted-foreground text-sm mb-6">Configure o funcionamento semanal</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
          {DAYS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-muted-foreground">{schedule[key].closed ? "Fechado" : "Aberto"}</span>
                    <Switch
                      checked={!schedule[key].closed}
                      onCheckedChange={(checked) => updateDay(key, "closed", !checked)}
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={schedule[key].open}
                    onChange={(e) => updateDay(key, "open", e.target.value)}
                    disabled={schedule[key].closed || loading}
                    className={timeInputClass}
                  />
                  <span className="text-xs text-muted-foreground">até</span>
                  <input
                    type="time"
                    value={schedule[key].close}
                    onChange={(e) => updateDay(key, "close", e.target.value)}
                    disabled={schedule[key].closed || loading}
                    className={timeInputClass}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
          <div>
            <span className="text-sm font-semibold text-foreground">Estabelecimento ativo?</span>
            <p className="text-xs text-muted-foreground mt-0.5">Seu restaurante aparecerá no app</p>
          </div>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>

        <button type="submit" disabled={loading} className="w-full h-13 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-float hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70">
          {loading ? <Loader2 size={16} className="animate-spin" /> : (<>Cadastrar <ArrowRight size={16} /></>)}
        </button>
      </form>
    </AuthLayout>
  );
};

export default CadastroHorarioRestaurantePage;

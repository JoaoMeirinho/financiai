import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight, ArrowDownRight, Target, Bell } from "lucide-react";
import heroImage from "@/assets/hero-finance.jpg";

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });
  }, [navigate]);

  const stats = [
    { label: "Receitas", value: "R$ 0,00", icon: ArrowUpRight, color: "text-success" },
    { label: "Despesas", value: "R$ 0,00", icon: ArrowDownRight, color: "text-destructive" },
    { label: "Metas", value: "0", icon: Target, color: "text-primary" },
    { label: "Lembretes", value: "0", icon: Bell, color: "text-warning" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-64 overflow-hidden">
        <img src={heroImage} alt="Finance" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="bg-card rounded-lg p-8 shadow-lg mb-8">
          <h1 className="text-3xl font-bold mb-2">Bem-vindo ao FinanceAI! 🎉</h1>
          <p className="text-muted-foreground">
            Seu assistente inteligente para educação financeira está pronto para ajudar.
          </p>
          <div className="flex gap-4 justify-center pt-4">
              <Button size="lg" onClick={() => navigate("/chat")}>
                Começar Agora
              </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-lg p-8 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Comece agora</h2>
          <p className="text-muted-foreground">
            Registre suas primeiras transações, crie metas financeiras ou converse com o chatbot IA para receber orientações personalizadas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

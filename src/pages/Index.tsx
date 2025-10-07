import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, Target, MessageSquare } from "lucide-react";
import heroImage from "@/assets/hero-finance.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-[600px] overflow-hidden">
        <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-6 px-4">
            <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground drop-shadow-lg">
              FinanceAI
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-2xl mx-auto drop-shadow">
              Seu assistente inteligente para educação financeira
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button size="lg" onClick={() => navigate("/auth")}>
                Começar Agora
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: MessageSquare, title: "Chatbot IA", desc: "Orientação financeira personalizada" },
            { icon: Wallet, title: "Controle Total", desc: "Registre receitas e despesas" },
            { icon: Target, title: "Metas", desc: "Alcance seus objetivos financeiros" },
            { icon: TrendingUp, title: "Relatórios", desc: "Análise detalhada dos seus gastos" },
          ].map((feature, i) => (
            <div key={i} className="bg-card p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <feature.icon className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
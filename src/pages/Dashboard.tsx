import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight, ArrowDownRight, Target, Bell, MessageCircle } from "lucide-react";
import { UserProfile } from "@/components/UserProfile";
import { FinancialCharts } from "@/components/FinancialCharts";
import { TransactionHistory } from "@/components/TransactionHistory";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    income: 0,
    expense: 0,
    goals: 0,
    reminders: 0,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });
  }, [navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch transactions
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id);

      if (transactions) {
        const income = transactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const expense = transactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        setStats((prev) => ({ ...prev, income, expense }));
      }

      // Fetch goals
      const { data: goals } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id);

      if (goals) {
        setStats((prev) => ({ ...prev, goals: goals.length }));
      }

      // Fetch reminders
      const { data: reminders } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user.id)
        .eq("completed", false);

      if (reminders) {
        setStats((prev) => ({ ...prev, reminders: reminders.length }));
      }
    };

    fetchStats();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("dashboard-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
        },
        () => {
          fetchStats();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "goals",
        },
        () => {
          fetchStats();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reminders",
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const statsData = [
    {
      label: "Receitas",
      value: formatCurrency(stats.income),
      icon: ArrowUpRight,
      color: "text-success",
    },
    {
      label: "Despesas",
      value: formatCurrency(stats.expense),
      icon: ArrowDownRight,
      color: "text-destructive",
    },
    {
      label: "Metas",
      value: stats.goals.toString(),
      icon: Target,
      color: "text-primary",
    },
    {
      label: "Lembretes",
      value: stats.reminders.toString(),
      icon: Bell,
      color: "text-warning",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Dashboard Financeiro</h1>
                <p className="text-muted-foreground">
                  Acompanhe suas finanças em tempo real
                </p>
              </div>
              <Button onClick={() => navigate("/chat")}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Chatbot IA
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statsData.map((stat) => (
                <div key={stat.label} className="bg-card p-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <FinancialCharts />

            {/* Transaction History */}
            <TransactionHistory />
          </div>

          {/* Sidebar - User Profile */}
          <div className="lg:w-80">
            <UserProfile />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

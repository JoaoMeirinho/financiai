import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ChartData {
  month: string;
  receitas: number;
  despesas: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export const FinancialCharts = () => {
  const [monthlyData, setMonthlyData] = useState<ChartData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch transactions
      const { data: transactions } = await supabase
        .from("transactions")
        .select(`
          *,
          category:categories(name, color)
        `)
        .eq("user_id", user.id);

      if (transactions) {
        // Process monthly data
        const monthlyMap = new Map<string, { receitas: number; despesas: number }>();
        
        transactions.forEach((t) => {
          const date = new Date(t.date);
          const monthKey = date.toLocaleDateString("pt-BR", {
            month: "short",
            year: "2-digit",
          });
          
          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, { receitas: 0, despesas: 0 });
          }
          
          const monthData = monthlyMap.get(monthKey)!;
          if (t.type === "income") {
            monthData.receitas += Number(t.amount);
          } else {
            monthData.despesas += Number(t.amount);
          }
        });

        const chartData = Array.from(monthlyMap.entries())
          .map(([month, data]) => ({
            month,
            ...data,
          }))
          .slice(-6);

        setMonthlyData(chartData);

        // Process category data for expenses
        const categoryMap = new Map<string, { value: number; color: string }>();
        
        transactions
          .filter((t) => t.type === "expense")
          .forEach((t) => {
            const categoryName = t.category?.name || "Sem categoria";
            const categoryColor = t.category?.color || "#6366f1";
            
            if (!categoryMap.has(categoryName)) {
              categoryMap.set(categoryName, { value: 0, color: categoryColor });
            }
            
            const catData = categoryMap.get(categoryName)!;
            catData.value += Number(t.amount);
          });

        const pieData = Array.from(categoryMap.entries()).map(
          ([name, data]) => ({
            name,
            value: data.value,
            color: data.color,
          })
        );

        setCategoryData(pieData);
      }
    };

    fetchData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("chart-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
        },
        () => {
          fetchData();
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
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Receitas vs Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Adicione transações para visualizar o gráfico
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend />
                <Bar dataKey="receitas" fill="hsl(var(--success))" name="Receitas" />
                <Bar dataKey="despesas" fill="hsl(var(--destructive))" name="Despesas" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Despesas por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Adicione despesas para visualizar o gráfico
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

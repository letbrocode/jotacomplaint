"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";

interface TrendDataPoint {
  date: string;
  count: number;
  resolved: number;
}

export function PublicTrendChart({ data }: { data: TrendDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
        <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10 }} 
            tickFormatter={(str: string) => str.split('-')[2] ?? str}
        />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px"
          }}
        />
        <Legend wrapperStyle={{ fontSize: '10px' }} />
        <Line
          type="monotone"
          dataKey="count"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          name="Reported"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="resolved"
          stroke="#10b981"
          strokeWidth={2}
          name="Resolved"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface DepartmentDataPoint {
  department: string;
  total: number;
}

export function PublicDepartmentChart({ data }: { data: DepartmentDataPoint[] }) {
  const chartData = data
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
        <XAxis type="number" hide />
        <YAxis 
            dataKey="department" 
            type="category" 
            tick={{ fontSize: 10 }} 
            width={80}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px"
          }}
          cursor={{ fill: 'transparent' }}
        />
        <Bar
          dataKey="total"
          fill="hsl(var(--primary))"
          radius={[0, 4, 4, 0]}
          name="Total Issues"
          barSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

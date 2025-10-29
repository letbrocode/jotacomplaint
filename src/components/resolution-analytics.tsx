"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Complaint } from "@prisma/client";
import { differenceInDays } from "date-fns";

interface ResolutionAnalyticsProps {
  complaints: Complaint[];
}

export default function ResolutionAnalytics({
  complaints,
}: ResolutionAnalyticsProps) {
  // Group complaints by resolution time buckets
  const resolutionData = complaints.reduce(
    (acc, complaint) => {
      if (!complaint.resolvedAt) return acc;

      const days = differenceInDays(
        new Date(complaint.resolvedAt),
        new Date(complaint.createdAt),
      );

      if (days === 0) {
        acc["Same Day"]++;
      } else if (days <= 3) {
        acc["1-3 Days"]++;
      } else if (days <= 7) {
        acc["4-7 Days"]++;
      } else if (days <= 14) {
        acc["8-14 Days"]++;
      } else {
        acc["15+ Days"]++;
      }

      return acc;
    },
    {
      "Same Day": 0,
      "1-3 Days": 0,
      "4-7 Days": 0,
      "8-14 Days": 0,
      "15+ Days": 0,
    },
  );

  const chartData = Object.entries(resolutionData).map(([range, count]) => ({
    range,
    count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resolution Time Distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="range" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            <Legend />
            <Bar
              dataKey="count"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              name="Complaints Resolved"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

"use client";

import useSWR from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Dashboard() {
  const { data, error } = useSWR(
    "https://script.google.com/macros/s/AKfycby5KKrcAt4YcwXE2bzuC6FWPvqoaDUlJaZsjmdmajkflvwGrfPntOACZI3UjXn82bLI/exec",
    fetcher,
    { refreshInterval: 60000 }
  );

  if (error) return <div>Ошибка загрузки</div>;
  if (!data) return <div>Загрузка...</div>;

  return (
    <div className="grid gap-6">
      <Card className="p-4">
        <CardContent>
          <h2 className="text-lg font-semibold mb-4">Менеджеры</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.managers}>
              <XAxis dataKey="manager" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="expected" fill="#8884d8" name="Ожидается" />
              <Bar dataKey="signed" fill="#82ca9d" name="Подписано" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import useSWR from "swr";
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
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Менеджеры</h2>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={data.managers}>
              <XAxis dataKey="manager" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="expected" name="Ожидается" />
              <Bar dataKey="signed" name="Подписано" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

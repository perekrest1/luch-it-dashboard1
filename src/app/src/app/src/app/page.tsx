'use client';

import './globals.css';
import useSWR from 'swr';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Legend, Tooltip } from 'chart.js';

Chart.register(CategoryScale, LinearScale, BarElement, Legend, Tooltip);

// Твой рабочий эндпойнт (можно переопределить через переменную окружения)
const ENDPOINT = process.env.NEXT_PUBLIC_LUCH_IT_ENDPOINT
  || 'https://script.google.com/macros/s/AKfycby5KKrcAt4YcwXE2bzuC6FWPvqoaDUlJaZsjmdmajkflvwGrfPntOACZI3UjXn82bLI/exec';

type Row = { manager: string; expected: number; signed: number };
type Agg = { manager: string; expected: number; signed: number; total: number };

const rub = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });

// Нормализация строк/чисел для надёжности
function toNum(v: any): number {
  if (v == null || v === '') return 0;
  const n = Number(String(v).replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

// Универсально вытаскиваем строки из разных форматов ответа
function coerceRows(data: any): Row[] {
  // Вариант 1: массив объектов [{manager, expected, signed}, ...]
  if (Array.isArray(data)) {
    return data.map((r: any) => ({
      manager: String(r.manager ?? r.name ?? r.Менеджер ?? 'Без менеджера').trim() || 'Без менеджера',
      expected: toNum(r.expected ?? r.expectedSum ?? r.ожидается),
      signed:   toNum(r.signed   ?? r.signedSum   ?? r.подписано)
    }));
  }
  // Вариант 2: объект с managers: [...]
  if (data && Array.isArray(data.managers)) {
    return data.managers.map((r: any) => ({
      manager: String(r.manager ?? r.name ?? 'Без менеджера').trim() || 'Без менеджера',
      expected: toNum(r.expected ?? r.expectedSum ?? r.ожидается),
      signed:   toNum(r.signed   ?? r.signedSum   ?? r.подписано)
    }));
  }
  // Вариант 3: объект с rows/records и т.д.
  if (data && Array.isArray(data.rows)) {
    return data.rows.map((r: any) => ({
      manager: String(r.manager ?? r.name ?? 'Без менеджера').trim() || 'Без менеджера',
      expected: toNum(r.expected ?? r.expectedSum ?? r.ожидается),
      signed:   toNum(r.signed   ?? r.signedSum   ?? r.подписано)
    }));
  }
  return [];
}

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(async r => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
});

function aggregate(rows: Row[]): Agg[] {
  const map = new Map<string, Agg>();
  for (const r of rows) {
    const name = (r.manager || 'Без менеджера').trim() || 'Без менеджера';
    if (!map.has(name)) map.set(name, { manager: name, expected: 0, signed: 0, total: 0 });
    const m = map.get(name)!;
    m.expected += toNum(r.expected);
    m.signed   += toNum(r.signed);
    m.total     = m.expected + m.signed;
  }
  return Array.from(map.values()).sort((a,b)=> b.total - a.total);
}

export default function Page() {
  // Автообновление каждые 5 минут
  const { data, error, isLoading } = useSWR<any>(ENDPOINT, fetcher, { refreshInterval: 5 * 60_000 });

  const rows = coerceRows(data);
  const agg  = aggregate(rows);
  const kpi = {
    expected: agg.reduce((s,a)=>s+a.expected,0),
    signed:   agg.reduce((s,a)=>s+a.signed,0),
    total:    agg.reduce((s,a)=>s+a.total,0),
  };

  const barData = {
    labels: agg.map(a=>a.manager),
    datasets: [
      { label: 'Ожидается', data: agg.map(a=>a.expected) },
      { label: 'Подписано', data: agg.map(a=>a.signed) },
    ]
  };
  const barOpts:any = { responsive:true, plugins:{ legend:{ position:'top' as const } } };

  return (
    <div className="container">
      {/* Header */}
      <div className="card" style={{padding:16, marginBottom:12}}>
        <div className="header">
          <div>
            <div style={{fontSize:18, fontWeight:900}}>LUCH-IT • Сводка по менеджерам</div>
            <div style={{fontSize:12, color:'var(--mut)', marginTop:2}}>
              Источник:&nbsp;
              <a className="link" href={ENDPOINT} target="_blank" rel="noreferrer">Google Apps Script (JSON)</a>
            </div>
          </div>
          <span className="badge">auto-refresh 5 min</span>
        </div>
      </div>

      {/* KPI */}
      <div className="row cols-3" style={{marginBottom:12}}>
        <div className="card" style={{padding:16}}>
          <div className="kpi-s">Ожидается</div>
          <div className="kpi-b">{rub.format(kpi.expected)}</div>
        </div>
        <div className="card" style={{padding:16}}>
          <div className="kpi-s">Подписано</div>
          <div className="kpi-b">{rub.format(kpi.signed)}</div>
        </div>
        <div className="card" style={{padding:16}}>
          <div className="kpi-s">Всего</div>
          <div className="kpi-b">{rub.format(kpi.total)}</div>
        </div>
      </div>

      {/* Table + Chart */}
      <div className="row cols-3">
        <div className="card" style={{gridColumn:'span 2'}}>
          <div style={{padding:16, borderBottom:'1px solid var(--brd)', color:'var(--mut)', fontSize:12, fontWeight:800, textTransform:'uppercase'}}>
            Менеджеры
          </div>
          <div style={{padding:8}}>
            {isLoading && <div style={{padding:12, color:'var(--mut)'}}>Загрузка…</div>}
            {error && <div style={{padding:12, color:'#b45309'}}>Ошибка загрузки: {String(error.message || error)}</div>}
            {!isLoading && !error && (
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Менеджер</th>
                    <th>Ожидается</th>
                    <th>Подписано</th>
                    <th>Всего</th>
                  </tr>
                </thead>
                <tbody>
                  {agg.map((m, i)=>(
                    <tr key={m.manager}>
                      <td>{i+1}</td>
                      <td style={{fontWeight:700}}>{m.manager}</td>
                      <td>{rub.format(m.expected)}</td>
                      <td>{rub.format(m.signed)}</td>
                      <td>{rub.format(m.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div style={{padding:'0 16px 16px', fontSize:12, color:'var(--mut)'}}>
            * Учтены только «Коммерческое ожидание» и «Дебиторская задолженность». Оранжевые строки исключаются на стороне источника.
          </div>
        </div>

        <div className="card chartWrap">
          <Bar data={barData} options={barOpts} />
        </div>
      </div>
    </div>
  );
}

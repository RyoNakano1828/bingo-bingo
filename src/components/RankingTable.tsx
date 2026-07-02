import { formatDuration } from "@/lib/game";

type Ranking = {
  rank: number;
  name: string;
  openedCount: number;
  bingoCount: number;
  clearTimeMs: number | null;
};

export function RankingTable({ rankings }: { rankings: Ranking[] }) {
  if (rankings.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        まだランキングデータがありません
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3 font-medium">順位</th>
            <th className="px-4 py-3 font-medium">名前</th>
            <th className="px-4 py-3 font-medium">開いたマス</th>
            <th className="px-4 py-3 font-medium">ビンゴ数</th>
            <th className="px-4 py-3 font-medium">クリア時間</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((row) => (
            <tr key={row.rank} className="border-t border-slate-100">
              <td className="px-4 py-3 font-semibold text-indigo-600">
                {row.rank}
              </td>
              <td className="px-4 py-3">{row.name}</td>
              <td className="px-4 py-3">{row.openedCount} / 16</td>
              <td className="px-4 py-3">{row.bingoCount}</td>
              <td className="px-4 py-3">{formatDuration(row.clearTimeMs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

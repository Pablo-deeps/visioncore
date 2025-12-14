import React, { useMemo } from 'react';
import { DetectionStats } from '../types';
import { cn } from '../utils/cn';
import { Activity, Users, Cat, Dog, Box } from 'lucide-react';

interface StatsPanelProps {
  stats: DetectionStats;
  className?: string;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats, className }) => {
  // Sort counts for stable rendering
  const sortedCounts = useMemo(() => {
    return Object.entries(stats.objectCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number)) // Sort by count desc
      .filter(([, count]) => (count as number) > 0);
  }, [stats.objectCounts]);

  const getIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'person': return <Users className="w-4 h-4 text-blue-400" />;
      case 'cat': return <Cat className="w-4 h-4 text-orange-400" />;
      case 'dog': return <Dog className="w-4 h-4 text-amber-400" />;
      default: return <Box className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={cn(
      "bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-xl p-4 shadow-xl",
      "flex flex-col gap-3 min-w-[200px] transition-all duration-300",
      className
    )}>
      {/* Header / FPS */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <h3 className="text-zinc-100 font-semibold text-sm tracking-wide flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          Live Stats
        </h3>
        <div className="flex items-center gap-1.5 bg-zinc-900 px-2 py-0.5 rounded text-xs font-mono text-emerald-400 border border-zinc-800">
          <span className="font-bold">{Math.round(stats.fps)}</span> FPS
        </div>
      </div>

      {/* Object List */}
      <div className="flex flex-col gap-2">
        {sortedCounts.length === 0 ? (
          <div className="text-zinc-500 text-xs py-2 text-center italic">
            No objects detected
          </div>
        ) : (
          sortedCounts.map(([label, count]) => (
            <div key={label} className="flex items-center justify-between group">
              <div className="flex items-center gap-2">
                {getIcon(label)}
                <span className="text-zinc-300 text-sm capitalize">{label}</span>
              </div>
              <span className="bg-zinc-800 text-zinc-100 text-xs font-mono px-2 py-0.5 rounded-full min-w-[24px] text-center">
                ×{count}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer Total */}
      <div className="border-t border-zinc-800 pt-2 flex justify-between items-center text-xs text-zinc-500">
        <span>Total Objects</span>
        <span className="text-zinc-300 font-mono">{stats.totalObjects}</span>
      </div>
    </div>
  );
};

export default StatsPanel;
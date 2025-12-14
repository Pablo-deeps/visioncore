import React from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { CameraMode } from '../types';
import { cn } from '../utils/cn';

interface CameraControlsProps {
  currentMode: CameraMode;
  onToggle: () => void;
  disabled?: boolean;
}

const CameraControls: React.FC<CameraControlsProps> = ({ currentMode, onToggle, disabled }) => {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200",
        "bg-white text-black hover:bg-zinc-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        "shadow-lg shadow-black/20"
      )}
    >
      <RefreshCw className={cn("w-4 h-4", disabled && "animate-spin")} />
      <span>
        Switch to {currentMode === 'user' ? 'Rear' : 'Front'}
      </span>
      <Camera className="w-4 h-4 ml-1 opacity-60" />
    </button>
  );
};

export default CameraControls;
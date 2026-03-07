import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  onClick: () => void;
  label?: string;
}

export function BackButton({ onClick, label = "Back" }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-dark transition-colors"
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </button>
  );
}

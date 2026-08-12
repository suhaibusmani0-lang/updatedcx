interface EditorialBadgeProps {
  label?: string | null;
  className?: string;
}

export default function EditorialBadge({ label, className = "" }: EditorialBadgeProps) {
  if (!label) return null;

  return (
    <span
      className={`absolute top-[4px] left-[4px] uppercase rounded-none z-30 bg-[#1A1A1A] text-white text-[10px] font-bold px-3 py-1 tracking-wider shadow-sm ${className}`}
    >
      {label}
    </span>
  );
}

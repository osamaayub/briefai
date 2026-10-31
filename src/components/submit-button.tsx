type Props = { pending: boolean; disabled?: boolean; className?: string; pendingLabel?: string; children: React.ReactNode };

export function SubmitButton({ pending, disabled, className = "", pendingLabel = "Please wait...", children }: Props) {
  return (
    <button type="submit" className={`btn-primary ${className}`} disabled={pending || disabled} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}

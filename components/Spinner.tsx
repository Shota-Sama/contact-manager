export default function Spinner({
  className = "",
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={`spinner ${className}`}
      role="status"
      aria-label={label}
    />
  );
}

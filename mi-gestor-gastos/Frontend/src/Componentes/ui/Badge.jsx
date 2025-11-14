export default function Badge({
  children,
  color = "gray",
  className = "",
  ...props
}) {
  const colors = {
    gray: "bg-gray-100 text-gray-700 border-gray-300",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };

  return (
    <span
      className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${colors[color]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

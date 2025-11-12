// Frontend/src/Componentes/ui/Card.jsx
export default function Card({ className = "", children, hover = true, ...props }) {
  const base =
    "bg-white border rounded-2xl shadow-sm p-6 " +
    (hover ? "hover:shadow-md hover:-translate-y-0.5 transition" : "");

  return (
    <div className={`${base} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Tooltip({ tooltip, children }) {
  return (
    <div className="group relative justify-center flex">
      <span className="hidden group-hover:block absolute -top-10 whitespace-nowrap">
        {tooltip}
      </span>
      {children}
    </div>
  );
}

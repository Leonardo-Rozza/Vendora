import type { HTMLAttributes, ReactNode } from "react";

export function Panel({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={["surface-panel rounded-[1.75rem]", className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

import type { JSX } from "react";

function Container({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-300 dark:bg-gray-950">
      {children}
    </div>
  );
}

export default Container;

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function AppProviders({ children }: Props): JSX.Element {
  return <>{children}</>;
}

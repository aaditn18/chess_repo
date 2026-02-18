import { AppProviders } from "./app/providers";
import { AppRoutes } from "./app/routes";

export default function App(): JSX.Element {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}

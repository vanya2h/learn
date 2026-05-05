import { Outlet } from "react-router";
import { GridBackground } from "../../src/components/GridBg";
import { Header } from "../../src/components/Header";

export default function AppLayout() {
  return (
    <div className="relative max-w-360 mx-auto border-x border-border min-h-screen flex flex-col">
      <GridBackground />
      <Header />
      <Outlet />
    </div>
  );
}

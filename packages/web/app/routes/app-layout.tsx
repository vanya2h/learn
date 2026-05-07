import { Outlet } from "react-router";
import { Footer } from "../../src/components/Footer";
import { Header } from "../../src/components/Header";

import { ProfileSoftGate } from "~/components/ProfileSoftGate";

export default function AppLayout() {
  return (
    <div className="relative max-w-360 mx-auto border-x border-border min-h-screen flex flex-col">
      <Header />
      <ProfileSoftGate />
      <Outlet />
      <Footer />
    </div>
  );
}

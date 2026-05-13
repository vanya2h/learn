import { Outlet } from "react-router";

import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { Container } from "~/components/layout/Container";
import { ProfileSoftGate } from "~/components/ProfileSoftGate";

export default function AppLayout() {
  return (
    <Container>
      <Header />
      <ProfileSoftGate />
      <Outlet />
      <Footer />
    </Container>
  );
}

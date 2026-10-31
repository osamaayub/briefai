import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="glow flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <Logo />
      {children}
    </div>
  );
}

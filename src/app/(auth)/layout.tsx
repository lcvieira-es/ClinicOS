import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entrar · ClinicOS',
  description: 'Acesso à gestão integrada da sua clínica.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-navy-950">
      {/* Imagem de fundo em tela cheia */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage: "url('/login-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Textos diretos sobre a imagem, sem caixa de fundo */}
      <div
        className="pointer-events-none absolute inset-0 z-[2] flex flex-col items-start justify-center px-8 py-10 sm:px-12 lg:px-20"
        aria-hidden
      >       
      </div>
      {/* Conteúdo (formulário) acima da camada */}
      <div className="relative z-10 min-h-screen">{children}</div>
    </div>
  );
}

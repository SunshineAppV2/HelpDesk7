import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b bg-background px-6 lg:px-12">
        <div className="flex items-center gap-2 font-bold text-xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          HelpDesk7
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-2xl space-y-8">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Suporte Técnico Inteligente e Descomplicado
          </h1>
          <p className="text-xl text-muted-foreground">
            Gerencie ativos, tickets e manutenções preventivas em um só lugar.
            Acesse o painel administrativo ou abra um chamado agora mesmo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-lg">
                Acessar Painel
              </Button>
            </Link>
            <Link href="/open-ticket">
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
                Abrir Chamado (Público)
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} HelpDesk7. Todos os direitos reservados.
      </footer>
    </div>
  );
}

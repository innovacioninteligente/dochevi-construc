import { Logo } from '@/components/logo';
import Link from 'next/link';

export function Footer({ t }: { t?: any }) {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="w-full bg-[#2D2D2D] text-[#FDFBF7]">
      <div className="container mx-auto px-4 md:px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8 items-center text-center md:text-left">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="bg-white/10 p-2 rounded-lg w-fit">
              <Logo width={40} height={40} />
            </div>
            <p className="text-sm text-gray-400 max-w-xs">
              Exclusividad y detalle en cada proyecto. Construimos sueños.
            </p>
          </div>

          <div className="flex flex-col gap-2 items-center">
            <h4 className="font-headline font-semibold text-primary mb-2">Enlaces Legales</h4>
            <Link href="/privacy" className="text-sm text-gray-400 hover:text-primary transition-colors">Política de Privacidad</Link>
            <Link href="/terms" className="text-sm text-gray-400 hover:text-primary transition-colors">Términos de Servicio</Link>
          </div>

          <div className="flex flex-col items-center md:items-end gap-4">
            {t && (
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:text-white transition-colors border border-primary px-4 py-2 rounded-md hover:bg-primary/10">
                {t.reviewLink || "Déjanos una reseña"}
              </a>
            )}
            <p className="text-xs text-gray-500">&copy; {currentYear} Express Renovation Mallorca.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

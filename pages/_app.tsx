import type { AppProps } from 'next/app';
import { Plus_Jakarta_Sans } from 'next/font/google';
import '../styles/globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Expose the font on :root so body and every element can use it */}
      <style jsx global>{`
        :root {
          --font-jakarta: ${jakarta.style.fontFamily};
        }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}

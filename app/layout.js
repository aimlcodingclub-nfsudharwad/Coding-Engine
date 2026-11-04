import './globals.css';
import Nav from './Nav';
export const metadata = { title: 'AI, ML & Coding Club' };
export default function RootLayout({ children }) {
  return (
    <html lang="en"><body className="bg-slate-950 text-slate-100 min-h-screen">
      <Nav /><main className="max-w-3xl mx-auto p-4">{children}</main>
    </body></html>
  );
}

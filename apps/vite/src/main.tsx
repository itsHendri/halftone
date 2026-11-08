import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, useLocation } from 'react-router';
import { KitLinkProvider, type KitLinkProps } from '@/lib/link';
import { App } from './app';
import './index.css';

/** Kit components link through @/lib/link; this tells them, once, to use React Router's Link (which takes `to`). */
function RouterLink({ href, ...props }: KitLinkProps) {
  return <Link to={href} {...props} />;
}
const usePathname = () => useLocation().pathname;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <KitLinkProvider link={RouterLink} usePathname={usePathname}>
        <App />
      </KitLinkProvider>
    </BrowserRouter>
  </StrictMode>
);

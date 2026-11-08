'use client';
/**
 * How kit components link, whatever router the app uses. Kit components never import `next/link` or
 * `next/navigation`: they use `KitLink` and `usePathname` from here, and the app says once, in its own code, which
 * link to use, by wrapping its root in `KitLinkProvider`.
 *
 *   Next.js        <KitLinkProvider link={NextLink} usePathname={usePathname}>  (next/link, next/navigation)
 *   React Router   <KitLinkProvider link={RouterLink} usePathname={() => useLocation().pathname}>
 *                  where RouterLink = ({ href, ...props }) => <Link to={href} {...props} />
 *   nothing set    plain <a href> (each click loads the page) and window.location.pathname
 *
 * Why a provider and not an editable file: `npx shadcn add --overwrite` re-copies kit files, so an app's edit to a
 * kit file would be undone by the next add. The provider lives in the app's own code, which shadcn never touches.
 * In a Next.js app the provider goes in a client component (a component can't be passed from a server layout):
 * this kit does it in components/site/providers.tsx.
 */
import * as React from 'react';

export type KitLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string };

type Router = {
  Link: React.ComponentType<KitLinkProps>;
  usePathname: () => string | null;
};

function PlainLink(props: KitLinkProps) {
  return <a {...props} />;
}

const subscribe = (onChange: () => void) => {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
};

/** The browser's own path, for apps that set no router. Empty on the server. */
function useLocationPathname() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => ''
  );
}

const RouterContext = React.createContext<Router>({ Link: PlainLink, usePathname: useLocationPathname });

type ProviderProps = {
  /** The router's link component, taking `href`. Plain `<a>` when left out. */
  link?: React.ComponentType<KitLinkProps>;
  /** A hook returning the current path, for active states (AppShell). The browser's path when left out. */
  usePathname?: () => string | null;
  children: React.ReactNode;
};

/** Set once at the app's root: which link and current-path hook kit components use. */
export function KitLinkProvider({ link, usePathname, children }: ProviderProps) {
  const value = React.useMemo<Router>(() => ({ Link: link ?? PlainLink, usePathname: usePathname ?? useLocationPathname }), [link, usePathname]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

/** A link through the app's router (see KitLinkProvider). */
export function KitLink(props: KitLinkProps) {
  const { Link } = React.useContext(RouterContext);
  return <Link {...props} />;
}

/** The current path through the app's router (see KitLinkProvider); empty string until it is known. */
export function usePathname(): string {
  const router = React.useContext(RouterContext);
  return router.usePathname() ?? '';
}

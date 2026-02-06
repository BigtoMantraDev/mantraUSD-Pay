import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Menu, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

import { WalletConnectPill } from './WalletConnectPill';

const NAV_LINKS = [
  { href: '/', label: 'Home', isRouterLink: true },
  { href: 'https://docs.onchainomies.com', label: 'Docs', isExternal: true },
];

const DEV_LINKS = [
  { href: '/kitchen-sink', label: 'Kitchen Sink' },
  { href: '/devtools', label: 'DevTools' },
];

export function Navbar() {
  const [open, setOpen] = React.useState(false);

  return (
    <nav className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 bg-white/10 border border-white/20 backdrop-blur-md shadow-lg rounded-2xl">
      {/* Logo */}
      <Link
        to="/"
        className="text-lg md:text-xl font-black text-white uppercase tracking-tighter drop-shadow-[2px_2px_0_#000] hover:text-[#F5B842] transition-colors"
      >
        OMies
      </Link>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center space-x-8 text-white font-medium">
        <Link to="/" className="hover:text-[#F5B842] transition-colors">
          Home
        </Link>
        {/* Dev-only links - hidden in production */}
        {import.meta.env.DEV && (
          <>
            <a
              href="/kitchen-sink"
              className="hover:text-[#F5B842] transition-colors"
            >
              Kitchen Sink
            </a>
            <a
              href="/devtools"
              className="hover:text-[#F5B842] transition-colors"
            >
              DevTools
            </a>
          </>
        )}
        <a
          href="https://docs.onchainomies.com"
          className="hover:text-[#F5B842] transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Docs
        </a>
      </div>

      {/* Action - Wallet Connection */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:block">
          <WalletConnectPill />
        </div>

        {/* Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/10"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[280px] h-dvh bg-[#3B506C] border-l-white/20 p-0"
          >
            {/* Close button inside sheet */}
            <SheetClose className="absolute right-4 top-4 text-white opacity-70 hover:opacity-100 transition-opacity z-10">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </SheetClose>
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="px-6 py-6 border-b border-white/10 shrink-0">
                <div className="text-xl font-black text-white uppercase tracking-tighter">
                  OMies
                </div>
              </div>

              {/* Mobile Navigation Links - scrollable */}
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {NAV_LINKS.map((link) =>
                  link.isRouterLink ? (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center px-4 py-3 text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-3 text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {link.label}
                    </a>
                  ),
                )}

                {/* Dev Links */}
                {import.meta.env.DEV && (
                  <>
                    <div className="px-4 pt-4 pb-2">
                      <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                        Developer
                      </span>
                    </div>
                    {DEV_LINKS.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center px-4 py-3 text-white/80 font-medium rounded-lg hover:bg-white/10 transition-colors"
                      >
                        {link.label}
                      </a>
                    ))}
                  </>
                )}
              </nav>

              {/* Mobile Wallet Connection - always visible at bottom */}
              <div className="px-4 py-4 border-t border-white/10 shrink-0">
                <WalletConnectPill vertical />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

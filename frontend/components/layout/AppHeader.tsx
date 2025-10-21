'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

export function AppHeader() {
  const pathname = usePathname();
  const { isAuthenticated, username, logout } = useAuth();

  // Don't show header on login page
  if (pathname === '/login') {
    return null;
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="ml-2 text-xl font-bold text-gray-900">
                Profit Share Calculator
              </span>
            </Link>
          </div>

          {/* Navigation */}
          {isAuthenticated && (
            <nav className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
              >
                Dashboard
              </Link>
              <Link
                href="/period/new"
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                + New Period
              </Link>
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
                <span className="text-sm text-gray-700">
                  {username || 'Admin'}
                </span>
                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                  className="text-sm"
                >
                  Logout
                </Button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}

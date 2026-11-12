import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@project/ui/tokens.css';

import { foundationMessages as messages } from '../lib/messages';
import './globals.css';

export const metadata: Metadata = {
  title: { default: messages.title, template: `%s | ${messages.title}` },
  description: messages.description,
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

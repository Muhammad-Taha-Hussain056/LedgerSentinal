import type { ReactNode } from 'react';

export default function FixtureLayout({ children }: { readonly children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

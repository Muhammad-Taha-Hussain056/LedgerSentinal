import type { ComponentPropsWithoutRef } from 'react';

export function Surface({ className = '', ...props }: ComponentPropsWithoutRef<'section'>) {
  return <section className={`ui-surface ${className}`.trim()} {...props} />;
}

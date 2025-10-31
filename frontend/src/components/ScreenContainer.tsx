import type { PropsWithChildren } from 'react';

export type ScreenContainerProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
}>;

export default function ScreenContainer({ title, subtitle, children }: ScreenContainerProps) {
  return (
    <main className="screen-container">
      {title ? <h1 className="route-heading">{title}</h1> : null}
      {subtitle ? <p className="route-copy">{subtitle}</p> : null}
      {children}
    </main>
  );
}

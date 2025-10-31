import type { PropsWithChildren } from 'react';

type InfoCardProps = PropsWithChildren<{
  title: string;
  meta?: string;
}>;

export default function InfoCard({ title, meta, children }: InfoCardProps) {
  return (
    <article className="info-card">
      <header>
        <h2>{title}</h2>
        {meta ? <span className="info-card-meta">{meta}</span> : null}
      </header>
      <div className="info-card-body">{children}</div>
    </article>
  );
}

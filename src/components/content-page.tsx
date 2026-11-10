export function ContentPage({ eyebrow, kicker, title, intro, children }: { eyebrow?: string; kicker?: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <main className="content-page">
      {(eyebrow || kicker) && <span className="eyebrow">{eyebrow || kicker}</span>}
      <h1>{title}</h1>
      {intro && <p className="lead">{intro}</p>}
      {children}
    </main>
  );
}

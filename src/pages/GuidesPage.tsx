import { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { GUIDES } from '../guides/registry';

/** Tracks which section heading was most recently scrolled past. */
function useActiveSection(sectionIds: string[]) {
  const [active, setActive] = useState<string | undefined>(sectionIds[0]);

  useEffect(() => {
    const onScroll = () => {
      let current = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 96) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [sectionIds]);

  return active;
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function GuidesPage() {
  const { slug } = useParams();
  const guide = GUIDES.find((g) => g.slug === slug) ?? GUIDES[0];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [guide.slug]);

  const activeSection = useActiveSection(guide.sections.map((s) => s.id));

  const sidebarLink = (isActive: boolean) =>
    `block rounded px-3 py-1.5 text-sm transition-colors ${
      isActive
        ? 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] font-medium text-[var(--accent-soft)]'
        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
    }`;

  return (
    <div className="container mx-auto flex-1 px-4 py-12">
      <div className="mx-auto flex max-w-6xl items-start gap-8">
        {/* Left sidebar: guide list */}
        <aside className="sticky top-8 hidden w-52 shrink-0 lg:block">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Guides
          </p>
          <nav className="space-y-1">
            {GUIDES.map((g) => (
              <NavLink key={g.slug} to={`/guides/${g.slug}`} className={sidebarLink(g.slug === guide.slug)}>
                {g.title}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Article */}
        <div className="min-w-0 flex-1">
          {/* Guide picker for small screens where the sidebar is hidden */}
          <div className="mb-4 flex flex-wrap gap-2 lg:hidden">
            {GUIDES.map((g) => (
              <NavLink
                key={g.slug}
                to={`/guides/${g.slug}`}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  g.slug === guide.slug
                    ? 'bg-[var(--accent-strong)] text-white'
                    : 'bg-[var(--bg-second)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {g.title}
              </NavLink>
            ))}
          </div>

          <article className="rounded-lg bg-[var(--bg-second)] p-8">
            <h1 className="mb-2 text-3xl font-bold text-[var(--accent)]">{guide.title}</h1>
            <p className="mb-8 text-[var(--text-muted)]">{guide.description}</p>
            <guide.Content />
          </article>
        </div>

        {/* Right sidebar: on-this-page outline */}
        <aside className="sticky top-8 hidden w-52 shrink-0 xl:block">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            On this page
          </p>
          <nav className="space-y-1 border-l border-white/10">
            {guide.sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(section.id);
                }}
                className={`-ml-px block border-l py-1 pl-4 text-sm transition-colors ${
                  activeSection === section.id
                    ? 'border-[var(--accent)] font-medium text-[var(--accent-soft)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {section.title}
              </a>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}

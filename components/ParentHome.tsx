import Link from 'next/link';
import { useEffect } from 'react';
import styles from './ParentHome.module.css';

const HERO_VIDEO = 'https://assets.article6.org/hero/article6-hero.mp4';

export default function ParentHome() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-visible', 'true');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.page}>
      <section className={styles.heroShell} aria-label="Article6 introduction">
        <div className={styles.hero}>
          <video
            className={styles.heroVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
          <div className={styles.heroShade} />

          <header className={styles.header}>
            <Link href="/" className={styles.brand} aria-label="Article6 home">
              ARTICLE6
            </Link>
            <nav className={styles.nav} aria-label="Primary navigation">
              <a href="#approach">Approach</a>
              <Link href="/contact">Contact</Link>
            </nav>
          </header>

          <div className={styles.heroCopy}>
            <h1>
              <span>Article6 builds</span>
              <span className={styles.typedLine}>
                specialist review services<span className={styles.cursor} aria-hidden="true" />
              </span>
            </h1>
            <p>Expert judgment for expensive, rules-heavy decisions.</p>
          </div>

          <a className={styles.scrollCue} href="#approach" aria-label="Scroll to Article6 approach">
            Scroll
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      <main id="approach" className={styles.content}>
        <section className={styles.thesis}>
          <div className={styles.reveal} data-reveal>
            <p className={styles.kicker}>THE PREMISE</p>
            <h2>Important documents rarely fail because nobody worked hard on them.</h2>
          </div>
          <p className={`${styles.thesisBody} ${styles.reveal}`} data-reveal>
            They fail because a requirement was missed, evidence was weaker than assumed, or something did not survive independent scrutiny.
          </p>
        </section>

        <section className={styles.definition} aria-labelledby="what-article6-does">
          <div className={styles.reveal} data-reveal>
            <p className={styles.kicker}>WHAT ARTICLE6 DOES</p>
            <h2 id="what-article6-does">Independent review for high-consequence decisions.</h2>
          </div>
          <div className={`${styles.definitionBody} ${styles.reveal}`} data-reveal>
            <p>
              Article6 builds specialist review services for teams working with complex requirements, evidence-heavy documents, and decisions where avoidable mistakes are expensive.
            </p>
            <p>
              We independently test what is required, what the document claims, what evidence supports it, and what still needs attention before an external reviewer sees it.
            </p>
          </div>
        </section>

        <section className={styles.pillars} aria-label="Article6 review principles">
          {[
            ['01', 'Requirements.', 'We identify what must be true, and why it matters.'],
            ['02', 'Evidence.', 'We test what is claimed, and what actually supports it.'],
            ['03', 'Judgment.', 'We apply independent expert judgment where the rules leave no room for guesswork.'],
          ].map(([number, title, body]) => (
            <article key={title} className={`${styles.pillar} ${styles.reveal}`} data-reveal>
              <span className={styles.number}>{number}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </section>

        <section className={styles.closing}>
          <div className={styles.reveal} data-reveal>
            <p className={styles.kicker}>BUILT FOR CONSEQUENCE</p>
            <h2>Some decisions are too expensive for <em>probably right.</em></h2>
          </div>
          <div className={`${styles.closingAction} ${styles.reveal}`} data-reveal>
            <p>Article6 builds focused review services for specialist domains where the cost of error is high and the rules are complex.</p>
            <Link href="/contact">Work with Article6 <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </main>
    </div>
  );
}

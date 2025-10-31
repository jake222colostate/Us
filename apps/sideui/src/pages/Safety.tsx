export default function Safety() {
  return (
    <div className="page">
      <header className="page-header">
        <h1>Safety essentials</h1>
        <p className="text-muted">Protect your time, energy, and wellbeing while connecting with new creatives.</p>
      </header>

      <section className="page-card">
        <h2>Before you meet</h2>
        <ul className="timeline">
          <li className="timeline-item">
            <span className="timeline-dot" />
            <div className="timeline-content">
              <strong>Verify the vibe</strong>
              <p className="text-small text-muted">
                Trade recent photos or portfolios before you commit. Share your expectations for the shoot and any
                boundaries up front.
              </p>
            </div>
          </li>
          <li className="timeline-item">
            <span className="timeline-dot" />
            <div className="timeline-content">
              <strong>Share details with a friend</strong>
              <p className="text-small text-muted">
                Send the time, location, and the name of your match to someone you trust. Use our reminders in
                Settings to automate this step.
              </p>
            </div>
          </li>
        </ul>
      </section>

      <section className="page-card">
        <h2>During the meet-up</h2>
        <ul className="timeline">
          <li className="timeline-item">
            <span className="timeline-dot" />
            <div className="timeline-content">
              <strong>Choose public, well-lit spaces</strong>
              <p className="text-small text-muted">
                Meet at studios, cafes, or co-working lounges with easy exits. Keep personal belongings secure and
                stay aware of your surroundings.
              </p>
            </div>
          </li>
          <li className="timeline-item">
            <span className="timeline-dot" />
            <div className="timeline-content">
              <strong>Honor boundaries</strong>
              <p className="text-small text-muted">
                Consent is ongoing. Check in frequently, and use the app’s built-in checklists to align on poses,
                wardrobe, and deliverables.
              </p>
            </div>
          </li>
        </ul>
      </section>
    </div>
  );
}

export default function Help() {
  return (
    <div className="page">
      <header className="page-header">
        <h1>Help & support</h1>
        <p className="text-muted">We’re here to keep your experience smooth, safe, and inspiring.</p>
      </header>

      <section className="page-card">
        <h2>Contact us</h2>
        <p className="text-muted">Reach our support crew any time.</p>
        <table className="simple-table">
          <tbody>
            <tr>
              <th>Email</th>
              <td>support@us.app</td>
            </tr>
            <tr>
              <th>Emergency line</th>
              <td>+1 (800) 555-0198</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="page-card">
        <h2>FAQs</h2>
        <div className="timeline">
          <div className="timeline-item">
            <span className="timeline-dot" />
            <div className="timeline-content">
              <strong>How do I compare photos?</strong>
              <p className="text-small text-muted">
                Head to the feed, open any profile card, and choose “Compare photos.” You’ll see a side-by-side view
                that works great on desktop and mobile.
              </p>
            </div>
          </div>
          <div className="timeline-item">
            <span className="timeline-dot" />
            <div className="timeline-content">
              <strong>Can I change my match radius later?</strong>
              <p className="text-small text-muted">
                Absolutely. Visit Settings to update your discovery radius and notification preferences.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Header({ subtitle }) {
  return (
    <div className="hdr">
      <div className="hdr-sky">
        <div className="hdr-row">
          <div className="hdr-logo">KS</div>
          <span className="hdr-brand">Kawan Senja</span>
        </div>
        <div className="hdr-tagline">{subtitle || 'by PT Multi Bintang Indonesia'}</div>
      </div>
    </div>
  )
}

const LOGO_URL = 'https://xggunlrfkssvbqopwnps.supabase.co/storage/v1/object/public/posm-photos/1782700735539-d4273ccd-3e98-421b-96ca-44e4d80d7ad0_1-removebg-preview.png'

export default function Header({ subtitle }) {
  return (
    <div className="hdr">
      <div className="hdr-sky">
        <div className="hdr-row">
          <img
            src={LOGO_URL}
            alt="Kawan Senja"
            style={{
              height: 40,
              width: 'auto',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
            }}
          />
        </div>
        <div className="hdr-tagline">{subtitle || 'by PT Multi Bintang Indonesia'}</div>
      </div>
    </div>
  )
}

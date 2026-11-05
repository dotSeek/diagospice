import { restaurant } from "../../data/restaurant";

const FACEBOOK_PATH =
  "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.990 4.388 10.954 10.125 11.854v-8.385H7.078v-3.470h3.047V9.430c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.830c-1.491 0-1.956.925-1.956 1.874v2.250h3.328l-.532 3.470h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z";

const WHATSAPP_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.030-.967-.273-.099-.471-.148-.670.150-.197.297-.767.966-.940 1.164-.173.199-.347.223-.644.075-.297-.150-1.255-.463-2.390-1.475-.883-.788-1.480-1.761-1.653-2.059-.173-.297-.018-.458.130-.606.134-.133.298-.347.446-.520.149-.174.198-.298.298-.497.099-.198.050-.371-.025-.520-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.500-.669-.510-.173-.008-.371-.010-.570-.010-.198 0-.520.074-.792.372-.272.297-1.040 1.016-1.040 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.200 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.360.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.570-.347m-5.421 7.403h-.004a9.870 9.870 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.860 9.860 0 01-1.510-5.260c.001-5.450 4.436-9.884 9.888-9.884 2.640 0 5.122 1.030 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.450-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.050 0C5.495 0 .160 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.480-8.413z";

const links = [
  { label: "Facebook", detail: restaurant.facebookName, href: restaurant.facebookUrl, path: FACEBOOK_PATH },
  { label: "WhatsApp", detail: restaurant.phoneDisplay, href: restaurant.whatsappUrl, path: WHATSAPP_PATH },
];

/** Facebook and WhatsApp links as round red icons with their label beside them. */
export function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <ul className={`social-links ${className}`.trim()}>
      {links.map((link) => (
        <li key={link.label}>
          <a
            className="social-link"
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${link.label}: ${link.detail}`}
          >
            <span className="social-link__icon">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
                <path d={link.path} />
              </svg>
            </span>
            <span className="social-link__text">
              <span className="social-link__label">{link.label}</span>
              {link.detail}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

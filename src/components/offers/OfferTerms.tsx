export function OfferTerms({ conditions, expires }: { conditions: string[]; expires?: string }) {
  if (!conditions.length && !expires) return null;
  const until = expires ? new Date(`${expires}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;
  return (
    <ul className="offer-terms" aria-label="Offer terms">
      {conditions.map((condition) => (
        <li key={condition}>{condition}</li>
      ))}
      {until ? <li>Ends {until}</li> : null}
    </ul>
  );
}

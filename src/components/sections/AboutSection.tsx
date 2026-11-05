import { aboutImages } from "../../data/images";
import { RedBlock } from "../ui/SectionHeading";

const notes = [
  {
    title: "The dining",
    body: "Order from the full menu, pick a meal deal, or come hungry for the buffet from Friday to Sunday.",
  },
  {
    title: "The food",
    body: "Diago special foods sit at the heart of it: kottu, dum parota and our special beef stew, alongside curries, biriyani, burgers and wings.",
  },
  {
    title: "The look",
    body: "Our style tips its hat to the American cowboy era of 1865 to 1895, with a little frontier swagger on every plate.",
  },
];

export function AboutSection() {
  return (
    <section id="about" className="about" aria-labelledby="about-title">
      <div>
        <RedBlock kicker="Get to know us" title="Who we are" id="about-title" />
        <div className="about__text">
          <p className="dropcap">
            Diago Spice is a restaurant on Pengwern Road in Clase, Swansea, built around big plates and bold
            flavour. Come as you are and bring your appetite.
          </p>
          <div className="about__notes">
            {notes.map((note) => (
              <div className="about__note" key={note.title}>
                <h3>{note.title}</h3>
                <p>{note.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <figure className="about__photo">
        <img src={aboutImages.primary} alt="A curry served with rice" loading="lazy" />
      </figure>
    </section>
  );
}

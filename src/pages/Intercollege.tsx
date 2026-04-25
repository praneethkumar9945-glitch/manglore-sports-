import { Link } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import sprint from "@/assets/sports/sprint.jpg";
import distanceRun from "@/assets/sports/distance-run.jpg";
import relay from "@/assets/sports/relay.jpg";
import volleyball from "@/assets/sports/volleyball.jpg";
import kabaddi from "@/assets/sports/kabaddi.jpg";
import badminton from "@/assets/sports/badminton.jpg";
import tugofwar from "@/assets/sports/tugofwar.jpg";
import longjump from "@/assets/sports/longjump.jpg";
import shotput from "@/assets/sports/shotput.jpg";
import discus from "@/assets/sports/discus.jpg";
import chess from "@/assets/sports/chess.jpg";
import carrom from "@/assets/sports/carrom.jpg";

type Sport = { name: string; date: string; desc: string; slug: string; image: string };

const groups: { title: string; items: Sport[] }[] = [
  {
    title: "Track Events",
    items: [
      { name: "100 Meter Run", date: "May 07", desc: "The fastest sprint event. Test your speed and reaction time.", slug: "100meter", image: sprint },
      { name: "200 Meter Run", date: "May 07", desc: "A sprint event combining speed and endurance.", slug: "200meter", image: sprint },
      { name: "400 Meter Run", date: "May 07", desc: "Sprint event requiring both speed and stamina.", slug: "400meter", image: distanceRun },
      { name: "800 Meter Run", date: "May 07", desc: "Middle-distance running event testing endurance.", slug: "800meter", image: distanceRun },
      { name: "Relay 400", date: "May 07", desc: "Team of 4 runners. Pass the baton to win.", slug: "relay400", image: relay },
    ],
  },
  {
    title: "Team Events",
    items: [
      { name: "Volleyball", date: "May 04", desc: "Team of 6 players. Spike, block and serve to victory.", slug: "volleyball", image: volleyball },
      { name: "Kabaddi", date: "May 05", desc: "Traditional Indian sport. Raid and return safely.", slug: "kabbadi", image: kabaddi },
      { name: "Badminton", date: "May 06", desc: "Fastest racket sport. Smash and rally to win.", slug: "badminton", image: badminton },
      { name: "Tug of War", date: "May 07", desc: "Test your team's strength. Pull to win.", slug: "tugofwar", image: tugofwar },
    ],
  },
  {
    title: "Field Events",
    items: [
      { name: "Long Jump", date: "May 07", desc: "Leap as far as possible from a running start.", slug: "longjump", image: longjump },
      { name: "Shot Put", date: "May 07", desc: "Throw a heavy ball as far as possible.", slug: "shotput", image: shotput },
      { name: "Disc Throw", date: "May 07", desc: "Hurl a discus for maximum distance.", slug: "discthrow", image: discus },
    ],
  },
  {
    title: "Indoor Events",
    items: [
      { name: "Chess", date: "May 08", desc: "The game of kings. Strategy and mind sport.", slug: "chess", image: chess },
      { name: "Carrom", date: "May 09", desc: "Board game of skill. Strike the coins to win.", slug: "carrom", image: carrom },
    ],
  },
];

const SportCard = ({ s }: { s: Sport }) => (
  <Card className="group h-full overflow-hidden transition-smooth hover:-translate-y-1 hover:shadow-elegant">
    <div className="relative h-44 overflow-hidden">
      <img
        src={s.image}
        alt={s.name}
        loading="lazy"
        width={800}
        height={512}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
      <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-elegant">
        {s.date}
      </span>
    </div>
    <div className="p-5">
      <h3 className="font-display text-xl font-bold">{s.name}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{s.desc}</p>
      <Button asChild className="mt-4 w-full bg-gradient-hero">
        <Link to={`/registration?sport=${s.slug}`}>Register</Link>
      </Button>
    </div>
  </Card>
);

const Intercollege = () => (
  <div className="bg-background">
    <section className="border-b border-border bg-secondary py-16 text-secondary-foreground">
      <div className="container mx-auto px-4 text-center">
        <div className="mx-auto max-w-3xl rounded-2xl border-2 border-accent bg-background/5 px-6 py-8">
          <h1 className="font-display text-3xl font-extrabold text-accent md:text-5xl">
            Mangalore Inter-College Sports & Games Competition 2026
          </h1>
        </div>
        <p className="mt-6 text-lg opacity-80">Choose your sports & games and register</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-5 py-2"><Calendar className="h-4 w-4 text-primary" /> Event Dates: 4, 5, 6, 7</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-5 py-2"><MapPin className="h-4 w-4 text-primary" /> Venue: Mangala Stadium</span>
        </div>
      </div>
    </section>

    {groups.map((g, idx) => (
      <section key={g.title} className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold">
            <span className="mr-3 inline-block h-7 w-1.5 align-middle bg-primary rounded-full" />
            {g.title.toUpperCase()}
          </h2>

          <Carousel
            opts={{ align: "start", loop: true }}
            plugins={[Autoplay({ delay: 3500 + idx * 400, stopOnInteraction: true })]}
            className="mt-8 px-2 sm:px-12"
          >
            <CarouselContent>
              {g.items.map((s) => (
                <CarouselItem key={s.slug} className="sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <SportCard s={s} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 sm:-left-12" />
            <CarouselNext className="right-0 sm:-right-12" />
          </Carousel>
        </div>
      </section>
    ))}
  </div>
);

export default Intercollege;

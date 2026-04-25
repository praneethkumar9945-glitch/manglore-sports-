import { Link } from "react-router-dom";
import { Award, Trophy, Medal, ArrowRight, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-shield.png";
import bgmiHero from "@/assets/bgmi-hero.jpg";
import marathonHero from "@/assets/marathon-hero.jpg";
import beachFest from "@/assets/beach-fest.jpg";

const Index = () => {
  return (
    <div className="snap-y snap-mandatory">
      {/* HERO */}
      <section className="snap-start min-h-[calc(100vh-4rem)] flex items-center relative overflow-hidden bg-background">
        <div className="container mx-auto grid items-center gap-6 px-4 py-8 md:grid-cols-2">
          <div className="order-1 flex justify-center md:order-1">
            <img
              src={logo}
              alt="Mangalore Inter-College Sports & Games Championship shield logo"
              className="h-44 w-44 animate-float object-contain drop-shadow-2xl sm:h-60 sm:w-60 md:h-80 md:w-80"
              width={400}
              height={400}
            />
          </div>
          <div className="order-2 md:order-2 animate-fade-up">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground sm:text-sm">
              Intercollege Sports Meet
            </p>
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-[1.05] sm:text-4xl md:text-6xl">
              Unleash Your
              <span className="mt-1 block text-gradient-hero">Speed · Strength · Spirit</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
              Mangalore Intercollege Sports & Games Championship 2026 Presented By <a href="https://vedavyaskamath.in/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-700">MLA D Vedavyas Kamath</a> And Organized by <a href="https://bavesh.in/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-700">Bavesh Suvarna</a> <a href="https://sreesankaracharyainstitution.in/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-700">Sree Sankaracharya Institute Of Advanced Skills Mangalore,</a> is a grand multi-sport Meet bringing together Mangalore coastal Regional athletes, students and sports lovers to compete and celebrate sportsmanship.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-hero shadow-elegant hover:opacity-90">
                <Link to="/intercollege">Explore the Games <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/registration">Register Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* INTRO + AWARDS */}
      <section className="snap-start min-h-[calc(100vh-4rem)] flex items-center bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl md:text-5xl">
            Mangalore Inter-College
            <span className="block text-accent">Sports & Games Championship 2026</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-secondary-foreground/70">
            Participation is strictly limited to college students.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2">
              <Calendar className="h-4 w-4 text-accent" /> May 4 – 9, 2026
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2">
              <MapPin className="h-4 w-4 text-accent" /> Mangala Stadium
            </span>
          </div>

          <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-8">
            <h3 className="font-display text-xl font-bold text-accent sm:text-2xl">🏆 Awards & Prizes 🏆</h3>
            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-3">
              {[
                { icon: Trophy, t: "Cash Prize Pool", d: "Worth ₹50,000+" },
                { icon: Award, t: "Trophies", d: "Winner, Runner-Up & Champion" },
                { icon: Medal, t: "Medals & Certificates", d: "For top performers & participants" },
              ].map((x, i) => (
                <div key={i} className="rounded-xl bg-secondary p-2 text-left sm:p-6">
                  <x.icon className="h-5 w-5 text-accent sm:h-7 sm:w-7" />
                  <p className="mt-2 text-xs font-semibold leading-tight sm:text-base">{x.t}</p>
                  <p className="mt-1 text-[10px] leading-tight text-secondary-foreground/70 sm:text-sm">{x.d}</p>
                </div>
              ))}
            </div>
          </div>

          <Button asChild size="lg" className="mt-8 bg-gradient-hero shadow-elegant">
            <Link to="/intercollege">Explore the games <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* BGMI BANNER */}
      <section
        className="snap-start min-h-[calc(100vh-4rem)] flex items-center relative overflow-hidden bg-cover bg-center text-white"
        style={{ backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.85), rgba(0,0,0,0.65)), url(${bgmiHero})` }}
      >
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-wider text-accent sm:text-5xl md:text-7xl">
            BGMI CHAMPIONSHIP
          </h2>
          <p className="mt-3 text-base text-white/80 sm:text-lg">Prize Pool ₹21,000 | ₹1,000 Per Squad</p>

          <div className="mx-auto mt-8 grid max-w-3xl grid-cols-3 gap-2 sm:gap-4">
            {[
              { p: "1st", a: "₹10,000", e: "Trophy + Medal", c: "border-gold text-gold" },
              { p: "2nd", a: "₹7,000", e: "Trophy + Medal", c: "border-silver text-silver" },
              { p: "3rd", a: "₹4,000", e: "Trophy + Medal", c: "border-bronze text-bronze" },
            ].map((x) => (
              <div key={x.p} className={`rounded-xl border-2 sm:rounded-2xl ${x.c} bg-black/40 p-2 backdrop-blur sm:p-6`}>
                <p className="font-display text-sm font-bold sm:text-2xl">{x.p}</p>
                <p className="mt-1 text-base font-extrabold sm:text-3xl">{x.a}</p>
                <p className="mt-1 text-[10px] leading-tight text-white/70 sm:text-sm">{x.e}</p>
              </div>
            ))}
          </div>

          <Button asChild size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 animate-pulse-glow">
            <Link to="/bgmi">Register Now</Link>
          </Button>
        </div>
      </section>

      {/* MARATHON */}
      <section
        className="snap-start min-h-[calc(100vh-4rem)] flex items-center relative overflow-hidden bg-cover bg-center text-white"
        style={{ backgroundImage: `linear-gradient(135deg, rgba(220,38,38,0.85), rgba(0,0,0,0.7)), url(${marathonHero})` }}
      >
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/80 sm:text-sm">NAMA KUDLA MARTHON </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-5xl md:text-6xl">RUN FOR GLORY</h2>
          <p className="mt-2 text-base sm:text-lg">Total Cash Worth ₹21,000</p>

          <div className="mx-auto mt-6 flex flex-wrap justify-center gap-2">
            {["Men: Above 40", "Men: Below 40", "Women: Above 40", "Women: Below 40"].map((c) => (
              <span key={c} className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur sm:text-sm">
                {c}
              </span>
            ))}
          </div>

          <div className="mx-auto mt-6 grid max-w-3xl grid-cols-3 gap-2 sm:gap-4">
            {[
              { p: "🥇 1st", a: "₹4,000", e: "Trophy + Medal + Certificate" },
              { p: "🥈 2nd", a: "₹2,000", e: "Trophy + Medal + Certificate" },
              { p: "🥉 3rd", a: "₹1,000", e: "Medal + Certificate" },
            ].map((x) => (
              <div key={x.p} className="rounded-xl border border-white/20 bg-white/10 p-2 backdrop-blur sm:rounded-2xl sm:p-6">
                <p className="font-display text-sm font-bold sm:text-xl">{x.p}</p>
                <p className="mt-1 text-base font-extrabold sm:text-3xl">{x.a}</p>
                <p className="mt-1 text-[10px] leading-tight text-white/80 sm:text-sm">{x.e}</p>
              </div>
            ))}
          </div>

          <Button asChild size="lg" className="mt-8 bg-white text-primary hover:bg-white/90">
            <Link to="/marathon">Coming soon..</Link>
          </Button>
        </div>
      </section>

      {/* BEACH FEST */}
      <section className="snap-start min-h-[calc(100vh-4rem)] flex items-center bg-background">
        <div className="container mx-auto grid items-center gap-6 px-4 py-8 md:grid-cols-2">
          <img
            src={beachFest}
            alt="Beach sports festival 2026"
            loading="lazy"
            className="rounded-2xl shadow-card max-h-[40vh] w-full object-cover md:max-h-none"
            width={1600}
            height={900}
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary sm:text-sm">Coming Soon</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl md:text-5xl">Beach Fest 2K26</h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Sun, sand and the spirit of competition. Get ready for the most exciting beach sports
              festival of the year — volleyball, frisbee, tug-of-war and more.
            </p>
            <Button asChild size="lg" className="mt-5 bg-gradient-hero shadow-elegant">
              <Link to="/contact">Get in touch</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import bgmiHero from "@/assets/bgmi-hero.jpg";
import bgmiPlayer from "@/assets/bgmi-player.jpg";
import { Trophy, Calendar, ShieldAlert, Gamepad2, Users, Flag, Crown } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";
import { CountUp } from "@/components/CountUp";
import { cn } from "@/lib/utils";
import { initiatePayment, verifyPayment, type RazorpayPaymentResponse } from "@/hooks/use-razorpay";
import { API_BASE } from "@/lib/api";

const scheduleSteps = [
  { icon: Users, title: "Registration Closes", time: "Before 48-hrs", tag: "Open" },
  { icon: Flag, title: "Qualifier Round 1", time: "Day 1 | 10:00 AM", tag: "Erangel" },
  { icon: Gamepad2, title: "Qualifier Round 2", time: "Day 1 | 12:00 PM", tag: "Erangel" },
  { icon: Crown, title: "Grand Finals", time: "Day 1 | 03:00 PM", tag: "Live" },
];

type Prize = { p: string; t: string; a: number; e: string; c: string };

const prizes: Prize[] = [
  { p: "🥇", t: "1st Place", a: 12000, e: "Champion Squad", c: "border-yellow-400" },
  { p: "🥈", t: "2nd Place", a: 6000, e: "Runner-up Squad", c: "border-gray-400" },
  { p: "🥉", t: "3rd Place", a: 3000, e: "Second Runner-up", c: "border-orange-400" },
];

const RoadmapStep = ({ step, index }: { step: (typeof scheduleSteps)[number]; index: number }) => {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });
  const isLeft = index % 2 === 0;
  const Icon = step.icon;

  return (
    <div
      ref={ref}
      className={cn(
        "relative md:grid md:grid-cols-2 md:gap-8",
        "transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
      )}
      style={{ transitionDelay: `${index * 180}ms` }}
    >
      <span className={cn("absolute left-4 top-6 z-10 h-5 w-5 -translate-x-1/2 rounded-full border-4 border-background bg-primary shadow-elegant md:left-1/2", inView && "animate-pulse-glow")} />
      <div className={cn("ml-12 md:ml-0", isLeft ? "md:col-start-1 md:pr-12 md:text-right" : "md:col-start-2 md:pl-12")}>
        <Card className="inline-block w-full p-5 transition-smooth hover:shadow-elegant">
          <div className={cn("flex items-center gap-3", isLeft && "md:flex-row-reverse")}>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h4 className="font-display text-lg font-bold">{step.title}</h4>
              <p className="text-sm text-muted-foreground">{step.time}</p>
            </div>
          </div>
          <div className={cn("mt-3", isLeft && "md:text-right")}>
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{step.tag}</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

const PrizeCard = ({ prize, index }: { prize: Prize; index: number }) => {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.3 });
  return (
    <div ref={ref} className={cn("transition-all duration-700", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")} style={{ transitionDelay: `${index * 150}ms` }}>
      <Card className={`border-2 ${prize.c} bg-card/5 p-8 text-center text-secondary-foreground backdrop-blur h-full`}>
        <div className="text-5xl">{prize.p}</div>
        <h3 className="mt-3 font-display text-2xl font-bold">{prize.t}</h3>
        <p className="mt-2 font-display text-3xl font-extrabold text-accent"><CountUp end={prize.a} prefix="₹" /></p>
        <p className="mt-2 text-sm opacity-80">{prize.e}</p>
      </Card>
    </div>
  );
};

const BGMI = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const { ref: playerRef, inView: playerIn } = useInView<HTMLDivElement>({ threshold: 0.25 });

  const handlePaymentSuccess = async (paymentResponse: RazorpayPaymentResponse, refId: number, formEl: HTMLFormElement) => {
    const result = await verifyPayment({ type: 'bgmi', ref_id: refId, response: paymentResponse });
    if (result.success) {
      toast({ title: "Registration Complete!", description: "Payment confirmed. Your squad is registered for BGMI 2026!" });
      formEl.reset();
    } else {
      toast({ title: "Verification Failed", description: result.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formEl = e.currentTarget;
    const formData = new FormData(formEl);
    const inputData: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      inputData[key] = value.toString();
    }

    const teamMembers = [1, 2, 3, 4].map((n) => ({
      player: n,
      ign: inputData[`ign_${n}`] ?? '',
      bgmiId: inputData[`bgmiId_${n}`] ?? '',
      isLeader: n === 1,
    }));

    const payload = {
      squadName:     inputData.squadName,
      leaderName:    inputData.leaderName,
      contactNumber: inputData.contactNumber,
      email:         inputData.email,
      collegeName:   inputData.collegeName,
      teamMembers:   JSON.stringify(teamMembers),
    };

    // Step 1 — save registration details
    let regResult: { success: boolean; message: string; data?: { ref_id?: number } };
    try {
      const res = await fetch(`${API_BASE}/bgmi_register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      regResult = await res.json();
    } catch {
      toast({ title: "Network Error", description: "Unable to connect to server. Check PHP backend is running.", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    if (!regResult.success) {
      toast({ title: "Error", description: regResult.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const refId = regResult.data?.ref_id ?? 0;
    if (!refId) {
      toast({ title: "Error", description: "Registration reference missing", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Step 2 — open Razorpay payment
    await initiatePayment({
      type: 'bgmi',
      ref_id: refId,
      prefill: {
        name:    inputData.leaderName,
        email:   inputData.email,
        contact: inputData.contactNumber,
      },
      onSuccess: (paymentResponse) => {
        handlePaymentSuccess(paymentResponse, refId, formEl);
      },
      onFailure: (msg) => {
        toast({ title: "Payment Cancelled", description: msg, variant: "destructive" });
        setSubmitting(false);
      },
    });
  };

  return (
    <div className="bg-secondary text-secondary-foreground">
      {/* Hero */}
      <section
        className="relative overflow-hidden bg-cover bg-center py-20 md:py-32"
        style={{ backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.85), rgba(0,0,0,0.55)), url(${bgmiHero})` }}
      >
        <div className="container mx-auto px-4 text-center">
          <span className="inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-accent animate-fade-up">
            Prize Pool ₹21,000 | ₹1,000 Per Squad
          </span>
          <h1 className="mt-6 font-display text-4xl font-extrabold uppercase tracking-wider text-white md:text-7xl animate-fade-up">
            BGMI <span className="text-accent">Championship</span>
          </h1>
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { l: "Sunday", s: "Day" },
              { l: "03", s: "Date" },
              { l: "May", s: "Month" },
              { l: "2026", s: "Year" },
            ].map((x, i) => (
              <div
                key={x.s}
                className="rounded-xl border-2 border-accent/60 bg-black/60 p-4 backdrop-blur animate-fade-up"
                style={{ animationDelay: `${i * 120}ms`, animationFillMode: "backwards" }}
              >
                <p className="font-display text-2xl font-extrabold text-accent md:text-3xl">{x.l}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-white/70">{x.s}</p>
              </div>
            ))}
          </div>
          <Button asChild size="lg" className="mt-10 bg-accent text-accent-foreground hover:bg-accent/90 animate-pulse-glow">
            <a href="#register">Register Now</a>
          </Button>
        </div>
      </section>

      {/* Player showcase */}
      <section className="bg-background py-16 text-foreground md:py-24">
        <div ref={playerRef} className="container mx-auto grid items-center gap-10 px-4 md:grid-cols-2">
          <div className={cn("relative transition-all duration-1000", playerIn ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10")}>
            <div className="absolute -inset-3 rounded-3xl bg-gradient-hero opacity-30 blur-2xl" />
            <img src={bgmiPlayer} alt="Pro BGMI gamer" loading="lazy" width={1024} height={1024} className="relative w-full rounded-2xl object-cover shadow-elegant" />
            <span className="absolute -bottom-4 -right-4 hidden rounded-2xl bg-accent px-4 py-3 font-display text-sm font-bold text-accent-foreground shadow-elegant md:block">
              Mobile Only · No Emulators
            </span>
          </div>
          <div className={cn("transition-all duration-1000 delay-200", playerIn ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10")}>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary">Battle Begins</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold md:text-5xl">Drop In. Outplay. <span className="text-gradient-hero">Conquer.</span></h2>
            <p className="mt-4 text-muted-foreground">Squad up with your best four and battle for glory at Mangalore's biggest BGMI championship.</p>
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div className="rounded-xl border border-border bg-card p-4">
                <CountUp end={64} className="font-display text-3xl font-extrabold text-primary" />
                <p className="mt-1 text-xs text-muted-foreground">Squads</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <CountUp end={256} className="font-display text-3xl font-extrabold text-primary" />
                <p className="mt-1 text-xs text-muted-foreground">Players</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <CountUp end={21000} prefix="₹" className="font-display text-2xl font-extrabold text-primary" />
                <p className="mt-1 text-xs text-muted-foreground">Prize Pool</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prizes */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center font-display text-3xl font-bold md:text-4xl">
            Win Big — Prize Pool <CountUp end={21000} prefix="₹" className="text-accent" />
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {prizes.map((x, i) => <PrizeCard key={x.t} prize={x} index={i} />)}
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { t: "All Participants", items: ["Medal", "Certificate", "5% Discount on Courses"] },
              { t: "Top 40 Players", items: ["Medal", "Certificate", "10% Discount on Courses"] },
              { t: "Top 20 Players", items: ["Medal", "Certificate", "15% Discount on Courses"] },
            ].map((x) => (
              <div key={x.t} className="rounded-xl border border-white/10 bg-white/5 p-6">
                <Trophy className="h-7 w-7 text-accent" />
                <h4 className="mt-3 font-display text-lg font-bold">{x.t}</h4>
                <ul className="mt-3 space-y-1 text-sm opacity-80">{x.items.map((i) => <li key={i}>• {i}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rules + Roadmap */}
      <section className="bg-background py-16 text-foreground">
        <div className="container mx-auto px-4">
          <h2 className="text-center font-display text-3xl font-bold">Tournament Rules</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              { i: Gamepad2, t: "Device", d: "BGMI only — Emulators not allowed" },
              { i: Trophy, t: "Game Mode", d: "TPP Squad — Erangel" },
              { i: ShieldAlert, t: "Prohibited", d: "No third-party apps or hacks" },
            ].map((x) => (
              <Card key={x.t} className="p-6">
                <x.i className="h-8 w-8 text-primary" />
                <h3 className="mt-3 font-display text-lg font-bold">{x.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{x.d}</p>
              </Card>
            ))}
          </div>
          <h2 className="mt-20 text-center font-display text-3xl font-bold">Match <span className="text-gradient-hero">Roadmap</span></h2>
          <p className="mt-2 text-center text-muted-foreground">Your journey from registration to the grand finals</p>
          <div className="relative mx-auto mt-12 max-w-4xl">
            <span aria-hidden className="absolute left-4 top-0 h-full w-0.5 bg-gradient-to-b from-primary via-accent to-primary md:left-1/2 md:-translate-x-1/2" />
            <div className="space-y-10">
              {scheduleSteps.map((step, i) => <RoadmapStep key={step.title} step={step} index={i} />)}
            </div>
          </div>
        </div>
      </section>

      {/* Register form */}
      <section id="register" className="py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-center font-display text-3xl font-bold">Register Your Squad</h2>
          <p className="mt-2 text-center text-secondary-foreground/70">Enter details for all 4 squad members · Registration fee: ₹1,000</p>
          <form onSubmit={handleSubmit} className="mt-10 space-y-8">
            {[1, 2, 3, 4].map((n) => (
              <Card key={n} className="bg-background/5 p-6 text-secondary-foreground border-white/10">
                <h3 className="font-display text-lg font-bold">
                  <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm">{n}</span>
                  {n === 1 ? "Team Leader" : `Player ${n}`}
                </h3>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {n === 1 && (
                    <>
                      <div>
                        <Label className="text-secondary-foreground">Squad Name *</Label>
                        <Input required name="squadName" className="mt-1 bg-background/10 border-white/20" placeholder="e.g. Alpha Predators" />
                      </div>
                      <div>
                        <Label className="text-secondary-foreground">College Name *</Label>
                        <Input required name="collegeName" className="mt-1 bg-background/10 border-white/20" />
                      </div>
                    </>
                  )}
                  <div>
                    <Label className="text-secondary-foreground">In-game Name *</Label>
                    <Input required name={`ign_${n}`} className="mt-1 bg-background/10 border-white/20" />
                  </div>
                  <div>
                    <Label className="text-secondary-foreground">BGMI ID *</Label>
                    <Input required name={`bgmiId_${n}`} className="mt-1 bg-background/10 border-white/20" />
                  </div>
                  {n === 1 && (
                    <>
                      <div>
                        <Label className="text-secondary-foreground">Leader Full Name *</Label>
                        <Input required name="leaderName" className="mt-1 bg-background/10 border-white/20" />
                      </div>
                      <div>
                        <Label className="text-secondary-foreground">Phone *</Label>
                        <Input required name="contactNumber" type="tel" className="mt-1 bg-background/10 border-white/20" />
                      </div>
                      <div>
                        <Label className="text-secondary-foreground">Email *</Label>
                        <Input required name="email" type="email" className="mt-1 bg-background/10 border-white/20" />
                      </div>
                    </>
                  )}
                </div>
              </Card>
            ))}
            <Button type="submit" disabled={submitting} size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {submitting ? "Processing..." : "Register & Pay ₹1,000"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default BGMI;

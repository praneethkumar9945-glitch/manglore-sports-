import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Handshake, Megaphone, Trophy, Users } from "lucide-react";

const Collaboration = () => (
  <div className="bg-background">
    <section className="bg-gradient-hero py-20 text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <h1 className="font-display text-5xl font-extrabold md:text-6xl">Partner With Us</h1>
        <p className="mx-auto mt-4 max-w-2xl opacity-90">
          Join hands with Mangalore Sports Meet 2026 — sponsor, collaborate or co-host events that
          empower young athletes and reach thousands of college students.
        </p>
      </div>
    </section>

    <section className="py-16">
      <div className="container mx-auto grid gap-6 px-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { i: Handshake, t: "Title Sponsor", d: "Be the face of the entire festival across all events." },
          { i: Trophy, t: "Event Sponsor", d: "Sponsor a marquee event like BGMI or Marathon." },
          { i: Megaphone, t: "Media Partner", d: "Amplify reach with co-branded coverage and content." },
          { i: Users, t: "Community Partner", d: "Bring your network into a vibrant sports community." },
        ].map((x) => (
          <Card key={x.t} className="p-6 transition-smooth hover:-translate-y-1 hover:shadow-elegant">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground">
              <x.i className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold">{x.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{x.d}</p>
          </Card>
        ))}
      </div>
      <div className="mt-12 text-center">
        <Button asChild size="lg" className="bg-gradient-hero shadow-elegant">
          <Link to="/contact">Talk to our team</Link>
        </Button>
      </div>
    </section>
  </div>
);

export default Collaboration;

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { initiatePayment, verifyPayment, type RazorpayPaymentResponse } from "@/hooks/use-razorpay";
import { API_BASE } from "@/lib/api";

const SPORT_CONFIG: Record<string, { players: number; fee: number; label: string }> = {
  "100meter":  { players: 1, fee: 0,    label: "100 Meter" },
  "200meter":  { players: 1, fee: 0,    label: "200 Meter" },
  "400meter":  { players: 1, fee: 0,    label: "400 Meter" },
  "800meter":  { players: 1, fee: 0,    label: "800 Meter" },
  relay400:    { players: 4, fee: 0,    label: "Relay 400" },
  volleyball:  { players: 8, fee: 1000, label: "Volleyball" },
  kabbadi:     { players: 10, fee: 1000, label: "Kabbadi" },
  badminton:   { players: 3, fee: 1000, label: "Badminton" },
  tugofwar:    { players: 8, fee: 1000, label: "Tug of War" },
  longjump:    { players: 1, fee: 0,    label: "Long Jump" },
  shotput:     { players: 1, fee: 0,    label: "Shot Put" },
  discthrow:   { players: 1, fee: 0,    label: "Disc Throw" },
  chess:       { players: 1, fee: 400,  label: "Chess" },
  carrom:      { players: 2, fee: 400,  label: "Carrom" },
};

const PLAYER_LABELS: Record<string, string> = {
  volleyball: "6+2",
  badminton:  "2+1",
  tugofwar:   "6+2",
  kabbadi:    "7+3",
};

const INFO_CARDS = [
  {
    icon: "🏆",
    title: "Team Rules",
    points: [
      "Each college may register up to two men's and two women's teams per game.",
      "Team size will be according to event rules.",
      "All teams must follow fair play and discipline.",
      "Each participant can participate in only 5 Sports or Athletics Events.",
      "For each event (100m, 200m, 400m, 800m, relay, and field events), a maximum of 10 participants per college is allowed. Disqualification for use of banned performance-enhancing substances.",
    ],
  },
  {
    icon: "🎓",
    title: "Eligibility Criteria",
    points: [
      "Participation is strictly limited to undergraduate students.",
      "Participants must be under 23 years of age (born on or after April 6, 2002).",
      "Students must be enrolled in a recognized college affiliated with a university.",
      "All teams must complete registration on or before May 3, 2026 at 12:00 AM.",
    ],
  },
  {
    icon: "📄",
    title: "Required Documents",
    points: [
      "Valid College ID Card (mandatory).",
      "Authorization letter from the respective college.",
      "Aadhaar Card (original or photocopy) must be presented for verification.",
      "Recent Photograph (passport size) for registration purposes.",
    ],
  },
];

const InfoCard = ({ card }: { card: (typeof INFO_CARDS)[number] }) => (
  <Card className="flex h-full flex-col p-6 shadow-elegant">
    <div className="text-4xl">{card.icon}</div>
    <h3 className="mt-3 font-display text-xl font-bold text-primary">{card.title}</h3>
    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
      {card.points.map((p) => (
        <li key={p} className="flex gap-2">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>{p}</span>
        </li>
      ))}
    </ul>
  </Card>
);

const InfoCards = () => {
  const autoplay = useRef(Autoplay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: true }));
  return (
    <div className="mt-10">
      <div className="md:hidden">
        <Carousel opts={{ loop: true, align: "start" }} plugins={[autoplay.current]} className="w-full">
          <CarouselContent>
            {INFO_CARDS.map((card) => (
              <CarouselItem key={card.title} className="basis-full"><InfoCard card={card} /></CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
      <div className="hidden gap-5 md:grid md:grid-cols-3">
        {INFO_CARDS.map((card) => <InfoCard key={card.title} card={card} />)}
      </div>
    </div>
  );
};

const Registration = () => {
  const [params] = useSearchParams();
  const initialSport = params.get("sport");
  const { toast } = useToast();
  const [selectedSport, setSelectedSport] = useState<string | undefined>(initialSport ?? undefined);
  const [gender, setGender] = useState("");
  const [feeOpen, setFeeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const config = selectedSport ? SPORT_CONFIG[selectedSport] : undefined;
  const playerCount = config?.players ?? 1;

  useEffect(() => {
    if (initialSport && SPORT_CONFIG[initialSport]) {
      setFeeOpen(true);
    }
  }, [initialSport]);

  const handleSportChange = (value: string) => {
    setSelectedSport(value);
    setFeeOpen(true);
  };

  const handlePaymentSuccess = async (
    paymentResponse: RazorpayPaymentResponse,
    refId: number,
    formEl: HTMLFormElement,
  ) => {
    const result = await verifyPayment({ type: 'sport', ref_id: refId, response: paymentResponse });
    if (result.success) {
      toast({ title: "Registration Complete!", description: "Payment confirmed. Your registration is complete!" });
      formEl.reset();
      setSelectedSport(undefined);
      setGender("");
    } else {
      toast({ title: "Verification Failed", description: result.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSport || !gender) {
      toast({ title: "Error", description: "Please select both sport and gender", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const formEl = e.currentTarget as HTMLFormElement;
    const formData = new FormData(formEl);
    const inputData: Record<string, string> = Object.fromEntries(formData.entries()) as Record<string, string>;

    inputData.sport  = selectedSport;
    inputData.gender = gender;

    const playerNames: string[] = [];
    for (let i = 1; i <= playerCount; i++) {
      const player = inputData[`player_${i}`];
      if (player) playerNames.push(player);
    }
    inputData.player_names = JSON.stringify(playerNames);

    if (selectedSport === 'tugofwar') {
      toast({ title: "Tug of War Reminder", description: "Ensure team total weight ≤480kg to avoid disqualification.", duration: 5000 });
    }

    // Step 1 — save registration
    let regResult: { success: boolean; message: string; data?: { ref_id?: number; amount?: number; sport?: string } };
    try {
      const res = await fetch(`${API_BASE}/sports_register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(inputData),
      });
      regResult = await res.json();
    } catch {
      toast({ title: "Network Error", description: "Ensure PHP backend is running.", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    if (!regResult.success) {
      toast({ title: "Error", description: regResult.message || 'Submission failed', variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const refId  = regResult.data?.ref_id  ?? 0;
    const amount = regResult.data?.amount  ?? 0;

    if (!refId) {
      toast({ title: "Error", description: "Registration reference missing", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Free sports — already marked paid in backend, done
    if (amount === 0) {
      toast({ title: "Registration Success!", description: "You are registered for free entry event!" });
      formEl.reset();
      setSelectedSport(undefined);
      setGender("");
      setSubmitting(false);
      return;
    }

    // Paid sports — open Razorpay
    await initiatePayment({
      type: 'sport',
      ref_id: refId,
      sport: selectedSport,
      prefill: {
        email:   inputData.email,
        contact: inputData.phone,
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
    <div className="bg-background py-16">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="text-center">
          <h1 className="font-display text-3xl font-extrabold md:text-5xl">
            Who Can Participate in
            <span className="mt-2 block text-primary">Mangalore Inter-College Sports & Games Competition 2026</span>
          </h1>
        </div>

        <InfoCards />

        <div className="mt-12 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary">Sports Meet 2026</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">Athlete Registration</h2>
          {selectedSport && config && (
            <p className="mt-3 text-muted-foreground">
              Selected sport: <span className="font-semibold capitalize text-primary">{config.label}</span>
              {config.fee > 0 && <span className="ml-2 text-primary font-bold">· Fee: ₹{config.fee}</span>}
              {config.fee === 0 && <span className="ml-2 text-green-600 font-bold">· Free Entry</span>}
            </p>
          )}
        </div>

        <Card className="mt-8 p-8 shadow-elegant">
          <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
            <div><Label>College Name *</Label><Input name="college_name" required className="mt-1" /></div>
            <div><Label>Email *</Label><Input name="email" required type="email" className="mt-1" /></div>
            <div><Label>Phone *</Label><Input name="phone" required type="tel" className="mt-1" /></div>
            <div>
              <Label>Gender *</Label>
              <Select onValueChange={setGender} required>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sport *</Label>
              <Select required value={selectedSport} onValueChange={handleSportChange} name="sport">
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select sport" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SPORT_CONFIG).map(([s, cfg]) => (
                    <SelectItem key={s} value={s}>{cfg.label}{cfg.fee > 0 ? ` — ₹${cfg.fee}` : ' — Free'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedSport && (
              <div className="md:col-span-2">
                <Label className="text-base">
                  {playerCount > 1 ? `Player Names (${PLAYER_LABELS[selectedSport] || `${playerCount} members`}) *` : "Player Name *"}
                </Label>
                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  {Array.from({ length: playerCount }).map((_, i) => (
                    <Input key={`player_${i + 1}`} name={`player_${i + 1}`} required placeholder={`Player ${i + 1} full name`} className="mt-1" />
                  ))}
                </div>
              </div>
            )}
            <div><Label>Emergency Contact</Label><Input name="emergency_contact" placeholder="Name - Phone" className="mt-1" /></div>
            <div className="md:col-span-2"><Label>Address *</Label><Textarea name="address" required className="mt-1" /></div>
            <Button type="submit" size="lg" disabled={submitting} className="md:col-span-2 bg-gradient-hero shadow-elegant">
              {submitting
                ? "Processing..."
                : config && config.fee > 0
                  ? `Register & Pay ₹${config.fee}`
                  : "Submit Registration"}
            </Button>
          </form>
        </Card>
      </div>

      <AlertDialog open={feeOpen} onOpenChange={setFeeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{config?.label} Registration</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>{config?.label} registration is open. Please complete the form.</p>
                {config && config.fee > 0 && (
                  <p className="mt-2 font-semibold text-primary">Registration fee: ₹{config.fee}</p>
                )}
                {config && config.fee === 0 && (
                  <p className="mt-2 font-semibold text-green-600">This is a free entry event.</p>
                )}
                {selectedSport === 'tugofwar' && (
                  <p className="mt-2 text-destructive font-semibold">⚠️ Weight Limit: Team total must be under 480kg.</p>
                )}
                {config && config.players > 1 && (
                  <p className="mt-2">Please enter the names of all {config.players} team members below.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setFeeOpen(false)}>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Registration;

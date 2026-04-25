import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import marathonHero from "@/assets/marathon-hero.jpg";
import { initiatePayment, verifyPayment, type RazorpayPaymentResponse } from "@/hooks/use-razorpay";
import { API_BASE } from "@/lib/api";

const Marathon = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState("");
  const [tshirtSize, setTshirtSize] = useState("");

  const handlePaymentSuccess = async (
    paymentResponse: RazorpayPaymentResponse,
    refId: number,
    formEl: HTMLFormElement,
  ) => {
    const result = await verifyPayment({ type: 'marathon', ref_id: refId, response: paymentResponse });
    if (result.success) {
      toast({ title: "Registration Complete!", description: `Registered for Nama Kudla Marathon 2026!${result.registration_number ? ` Reg No: ${result.registration_number}` : ''} Confirmation email sent.` });
      formEl.reset();
      setCategory("");
      setTshirtSize("");
    } else {
      toast({ title: "Verification Failed", description: result.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!category) {
      toast({ title: "Error", description: "Please select a category", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    if (!tshirtSize) {
      toast({ title: "Error", description: "Please select a T-shirt size", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const formEl = e.currentTarget as HTMLFormElement;
    const formData = new FormData(formEl);
    const inputData = {
      ...Object.fromEntries(formData.entries()),
      category,
      tshirt_size: tshirtSize,
    };

    // Step 1 — save registration
    let regResult: { success: boolean; message: string; data?: { ref_id?: number } };
    try {
      const res = await fetch(`${API_BASE}/marathon_register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(inputData as Record<string, string>),
      });
      regResult = await res.json();
    } catch {
      toast({ title: "Network Error", description: "Check PHP backend is running.", variant: "destructive" });
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

    // Step 2 — open Razorpay ₹400
    await initiatePayment({
      type: 'marathon',
      ref_id: refId,
      prefill: {
        name:    (inputData.full_name as string) ?? '',
        email:   (inputData.email as string) ?? '',
        contact: (inputData.phone as string) ?? '',
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
      <section
        className="relative bg-cover bg-center py-24 md:py-32"
        style={{ backgroundImage: `linear-gradient(135deg, rgba(220,38,38,0.85), rgba(0,0,0,0.7)), url(${marathonHero})` }}
      >
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="font-display text-5xl font-extrabold md:text-7xl">NAMA KUDLA MARATHON</h1>
          <p className="mt-3 text-xl">Total Cash Worth ₹21,000</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-center font-display text-xl font-bold text-accent">Men Categories</h3>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <span className="rounded-full border border-accent/40 bg-accent/10 px-5 py-2 text-sm">Men - Below 40</span>
                  <span className="rounded-full border border-accent/40 bg-accent/10 px-5 py-2 text-sm">Men - Above 40</span>
                </div>
              </div>
              <div>
                <h3 className="text-center font-display text-xl font-bold text-accent">Women Categories</h3>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <span className="rounded-full border border-accent/40 bg-accent/10 px-5 py-2 text-sm">Women - Below 40</span>
                  <span className="rounded-full border border-accent/40 bg-accent/10 px-5 py-2 text-sm">Women - Above 40</span>
                </div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="font-display text-2xl font-bold text-accent">Registration Fee: ₹400</p>
              <p className="mt-3 font-semibold">Benefits for all participants:</p>
              <p className="text-sm opacity-80">Free T-shirt. Certificates & Medals to all. Breakfast for the participants</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-16 text-foreground">
        <div className="container mx-auto max-w-3xl px-4">
          <Card className="p-8">
            <h2 className="text-center font-display text-3xl font-bold text-primary">Register Now</h2>
            <p className="mt-2 text-center text-muted-foreground">Secure your spot · Registration fee ₹400</p>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
              <div><Label>Full Name *</Label><Input name="full_name" required className="mt-1" /></div>
              <div><Label>College Name *</Label><Input name="college_name" required className="mt-1" /></div>
              <div><Label>Email *</Label><Input name="email" required type="email" className="mt-1" /></div>
              <div><Label>Phone *</Label><Input name="phone" required type="tel" className="mt-1" /></div>
              <div>
                <Label>Category *</Label>
                <Select onValueChange={setCategory} required>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mb40">Men - Below 40</SelectItem>
                    <SelectItem value="ma40">Men - Above 40</SelectItem>
                    <SelectItem value="wb40">Women - Below 40</SelectItem>
                    <SelectItem value="wa40">Women - Above 40</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>T-Shirt Size *</Label>
                <Select onValueChange={setTshirtSize} required>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select Size" /></SelectTrigger>
                  <SelectContent>
                    {["XS", "S", "M", "L", "XL", "XXL"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date of Birth</Label><Input name="dob" type="date" className="mt-1" /></div>
              <div><Label>Emergency Contact</Label><Input name="emergency_contact" placeholder="Name - Phone" className="mt-1" /></div>
              <div className="md:col-span-2"><Label>Address *</Label><Textarea name="address" required placeholder="Your complete address" className="mt-1" /></div>
              <Button type="submit" disabled={submitting} size="lg" className="md:col-span-2 bg-gradient-hero shadow-elegant">
                {submitting ? "Processing..." : "Register & Pay ₹400"}
              </Button>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Marathon;

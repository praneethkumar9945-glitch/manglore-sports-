import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import marathonHero from "@/assets/marathon-hero.jpg";

const Marathon = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState("");
  const [tshirtSize, setTshirtSize] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  if (!category) {
  toast({
    title: "Error",
    description: "Please select a category",
    variant: "destructive"
  });
  setSubmitting(false);
  return;
}

if (!tshirtSize) {
  toast({
    title: "Error",
    description: "Please select T-shirt size",
    variant: "destructive"
  });
  setSubmitting(false);
  return;
}
  const formData = new FormData(e.currentTarget as HTMLFormElement);
  const inputData = {
  ...Object.fromEntries(formData.entries()),
  category,
  tshirt_size: tshirtSize
};

  try {
    const response = await fetch('/submit_marathon.php', {
      method: 'POST',
      headers: {
  'Content-Type': 'application/x-www-form-urlencoded',
},
body: new URLSearchParams(inputData as Record<string, string>)
    });

    const text = await response.text();
console.log("RAW RESPONSE:", text);
alert(text);

let result;
try {
  result = JSON.parse(text);
} catch (e) {
  console.error("Invalid JSON:", text);
  throw new Error("Invalid JSON response");
}

    if (result.status === "success") {
      toast({ title: "Success!", description: result.message });
      (e.currentTarget as HTMLFormElement).reset();
      setCategory("");
  setTshirtSize("");
    } else {
      toast({ 
        title: "Error", 
        description: result.message || 'Submission failed', 
        variant: "destructive" 
      });
    }

  } catch (error) {
    toast({ 
      title: "Network Error", 
      description: "Check PHP file & URL", 
      variant: "destructive" 
    });
  } finally {
    setSubmitting(false);
  }
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
            <p className="mt-2 text-center text-muted-foreground">Secure your spot in the marathon</p>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
              <div><Label>Full Name *</Label><Input name="full_name" required className="mt-1" /></div>
              <div><Label>College Name *</Label><Input name="college_name" required className="mt-1" /></div>
              <div><Label>Email *</Label><Input name="email" required type="email" className="mt-1" /></div>
              <div><Label>Phone *</Label><Input name="phone" required type="tel" className="mt-1" /></div>
              <div>
                <Label>Category *</Label>
                <Select onValueChange={(value) => setCategory(value)} required>
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
                <Label>T-Shirt Size</Label>
                <Select onValueChange={(value) => setTshirtSize(value)}>
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
                {submitting ? "Submitting..." : "Register Now"}
              </Button>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Marathon;

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Clock, Instagram, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { API_BASE } from "@/lib/api";


const Contact = () => {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);

  if (!subject) {
    toast({
      title: "Error",
      description: "Please select a subject",
      variant: "destructive"
    });
    setSubmitting(false); // ✅ IMPORTANT
    return;
  }

  const formData = new FormData(e.currentTarget as HTMLFormElement);

  const inputData = {
    ...Object.fromEntries(formData.entries()),
    subject
  };

  try {
    const response = await fetch(`${API_BASE}/submit_contact.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(inputData as Record<string, string>)
    });

    const text = await response.text();

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
      setSubject("");
    } else {
      toast({
        title: "Error",
        description: result.message,
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
    setSubmitting(false); // ✅ CORRECT PLACE
  }
};

  return (
    <div className="bg-secondary text-secondary-foreground">
      <section className="bg-gradient-dark py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-5xl font-extrabold md:text-6xl">Get In Touch</h1>
          <p className="mx-auto mt-4 max-w-xl text-secondary-foreground/70">
            Have questions about the Mangalore Inter-College Sports Festival 2026? We're here to help!
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-3">
          <Card className="bg-background/5 p-8 lg:col-span-2 border-white/10 text-secondary-foreground">
            <h2 className="font-display text-2xl font-bold">Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="mt-6 grid gap-5 md:grid-cols-2">
              <div><Label>Full Name *</Label><Input name="name" 
              required 
              placeholder="Enter your full name" 
               className="mt-1 bg-background/10 border-white/20" /></div>
              <div><Label>Email Address *</Label><Input name="email" required type="email" placeholder="Enter your email" className="mt-1 bg-background/10 border-white/20" /></div>
              <div><Label>Phone Number</Label><Input name="phone" type="tel" placeholder="Enter your phone number"  className="mt-1 bg-background/10 border-white/20" /></div>
              <div>
                <Label>Subject *</Label>
                <Select onValueChange={(value) => setSubject(value)} required>
                  <SelectTrigger className="mt-1 bg-background/10 border-white/20"><SelectValue placeholder="Select a subject" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reg">Registration Query</SelectItem>
                    <SelectItem value="event">Event Details</SelectItem>
                    <SelectItem value="venue">Venue Information</SelectItem>
                    <SelectItem value="sponsor">Sponsorship</SelectItem>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Message *</Label><Textarea name="message" required rows={6} placeholder="Write your message here..." className="mt-1 bg-background/10 border-white/20" /></div>
              <div className="md:col-span-2 flex gap-3">
                <Button type="submit" size="lg" className="bg-primary">Send Message</Button>
                <Button type="reset" size="lg" variant="outline" className="border-white/30 text-secondary-foreground hover:bg-white/10">Clear</Button>
              </div>
            </form>
          </Card>

          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">Contact Information</h2>
            <p className="text-sm text-secondary-foreground/70">Feel free to reach out for any queries about the sports festival.</p>
            {[
              { i: Mail, t: "Email", d: "enquiry@ssccmangalore.co.in" },
              { i: Phone, t: "Phone", d: "+91 7618783300" },
              { i: MapPin, t: "Venue", d: "6th floor Paradign Plaza, Pandeshwar, Mangalore" },
              { i: Clock, t: "Office Hours", d: "Mon – Sat: 9:00 AM – 6:00 PM · Sunday: Closed" },
            ].map((x) => (
              <Card key={x.t} className="flex items-start gap-4 bg-background/5 p-4 border-white/10 text-secondary-foreground">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <x.i className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold">{x.t}</p>
                  <p className="text-sm text-secondary-foreground/70">{x.d}</p>
                </div>
              </Card>
            ))}
            <div className="flex gap-3 pt-2">
              <a href="#" className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-smooth hover:scale-110"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-smooth hover:scale-110"><MessageCircle className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
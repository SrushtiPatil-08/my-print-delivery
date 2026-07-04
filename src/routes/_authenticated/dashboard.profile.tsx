import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth, signOut } from "@/lib/auth";
import { supabase } from "@/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, LogOut, Save } from "lucide-react";
import { resetAnalytics } from "@/lib/analytics";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [phone, setPhone] = useState(user?.user_metadata?.phone || "");
  const [address, setAddress] = useState(user?.user_metadata?.address || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName, phone, address },
      });
      if (error) throw error;
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    resetAnalytics();
    navigate({ to: "/auth" });
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Profile & Shipping</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage saved addresses, contact info, and account settings.
        </p>
      </header>

      <Card className="shadow-soft rounded-3xl border-border/60">
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
          <CardDescription>Used on delivery slips and invoices.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Default delivery address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="address" className="pl-9" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Hostel, room, campus…" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Button onClick={handleSave} disabled={saving} className="rounded-2xl">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft rounded-3xl border-border/60">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Sign out of this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleSignOut} className="rounded-2xl">
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

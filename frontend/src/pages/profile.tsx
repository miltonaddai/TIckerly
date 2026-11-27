import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Camera, ChevronRight } from "lucide-react";
import { GlassPanel } from "@/components/market";
import { useLoadingOverlay } from "@/components/rive-loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { formatAssetClasses } from "@/lib/assets";
import { readProfilePhoto } from "@/lib/avatar";
import { billingApi, profileApi } from "@/lib/queries";
import type { NotificationPrefs } from "@/lib/types";

const DEFAULT_PREFS: NotificationPrefs = {
  priceTargets: true,
  volumeSpikes: true,
  earnings: true,
  weeklyDigest: false,
};

export function ProfilePage() {
  const { profile, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<"portal" | "logout" | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.firstName ?? "");
  const [photo, setPhoto] = useState(profile?.avatarUrl ?? "");
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  useLoadingOverlay(busy !== null);
  const prefsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: profileApi.notifications,
  });
  const prefs = prefsQuery.data ?? DEFAULT_PREFS;

  const savePrefs = useMutation({
    mutationFn: profileApi.updateNotifications,
    onSuccess: (data) => queryClient.setQueryData(["notifications"], data),
  });

  function openEditor() {
    setName(profile?.firstName ?? "");
    setPhoto(profile?.avatarUrl ?? "");
    setEditError(null);
    setEditing(true);
  }

  async function onPickPhoto(file?: File) {
    if (!file) return;
    try {
      setPhoto(await readProfilePhoto(file));
      setEditError(null);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Could not read that photo.");
    }
  }

  async function saveProfile() {
    const firstName = name.trim();
    if (!firstName) {
      setEditError("Enter your first name.");
      return;
    }
    setSaving(true);
    setEditError(null);
    try {
      await updateProfile({
        firstName,
        avatarUrl: photo || null,
      });
      setEditing(false);
    } catch {
      setEditError("Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  }

  function toggle(key: keyof NotificationPrefs) {
    savePrefs.mutate({ ...prefs, [key]: !prefs[key] });
  }

  return (
    <section className="w-full px-6 pb-10 pt-12 sm:px-10 lg:px-16 xl:px-20">
      <header className="mb-8">
        <h1 className="font-serif text-4xl">Profile & Settings</h1>
        <p className="mt-2 text-sm text-white/45">
          Manage your account, alerts and trading preferences
        </p>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
        <div className="flex flex-col gap-5">
          <GlassPanel className="flex flex-col items-center p-8 text-center">
            <Avatar className="size-20">
              {profile?.avatarUrl ? <AvatarImage src={profile.avatarUrl} /> : null}
              <AvatarFallback className="text-xl">
                {(profile?.firstName?.[0] ?? "M").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="mt-4 text-lg font-medium">{profile?.firstName || "Demo User"}</div>
            <div className="text-sm text-white/45">{profile?.email || "demo@tickerly.app"}</div>
            <span className="mt-3 rounded-full border border-white/15 px-3 py-1 text-[10px] tracking-[0.14em] text-white/70">
              {(profile?.plan ?? "max").toUpperCase()} PLAN
            </span>
            <Button className="mt-6 w-full rounded-xl" variant="default" onClick={openEditor}>
              Edit profile
            </Button>
          </GlassPanel>

          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-white/35">Subscription</p>
            <GlassPanel className="p-6">
              <div className="font-serif text-3xl capitalize">{profile?.plan ?? "Max"}</div>
              <div className="mt-1 text-white/70">{profile?.plan === "pro" ? "$19" : "$49"} / month</div>
              <p className="mt-3 text-xs text-white/40">
                Renews {profile?.renewsAt ?? "Sep 20, 2026"} · Visa ending {profile?.cardLast4 ?? "4417"}
              </p>
              <Button
                variant="outline"
                className="mt-5 rounded-xl"
                size="sm"
                disabled={busy !== null}
                onClick={async () => {
                  setBusy("portal");
                  try {
                    const { url } = await billingApi.portal();
                    window.location.assign(url);
                  } catch {
                    setBusy(null);
                  }
                }}
              >
                Manage plan
              </Button>
            </GlassPanel>
          </div>

          <Button
            variant="destructive"
            className="w-full rounded-xl"
            disabled={busy !== null}
            onClick={async () => {
              setBusy("logout");
              try {
                await logout();
                navigate({ to: "/" });
              } catch {
                setBusy(null);
              }
            }}
          >
            Sign out
          </Button>
        </div>

        <div className="flex flex-col gap-5">
          <GlassPanel className="p-6">
            <h2 className="font-serif text-2xl">Notifications</h2>
            <p className="mt-1 text-sm text-white/40">Choose which alerts reach you and where</p>
            <Pref
              title="Price target alerts"
              hint="Push + email when a target is hit"
              checked={prefs.priceTargets}
              onChange={() => toggle("priceTargets")}
            />
            <Pref
              title="Volume & volatility spikes"
              hint="Unusual activity on watchlist tickers"
              checked={prefs.volumeSpikes}
              onChange={() => toggle("volumeSpikes")}
            />
            <Pref
              title="Earnings reminders"
              hint="24 hours before a scheduled call"
              checked={prefs.earnings}
              onChange={() => toggle("earnings")}
            />
            <Pref
              title="Weekly market digest"
              hint="Monday morning summary of your holdings"
              checked={prefs.weeklyDigest}
              onChange={() => toggle("weeklyDigest")}
            />
          </GlassPanel>

          <GlassPanel className="p-6">
            <h2 className="font-serif text-2xl">Trading Preferences</h2>
            <p className="mt-1 text-sm text-white/40">Defaults applied across your screener and watchlist</p>
            <Row label="Default asset class" value={formatAssetClasses(profile?.assetClass)} />
            <Row label="Base currency" value={profile?.currency ?? "USD ($)"} />
            <Row
              label="Time zone"
              value={profile?.timezone ?? "Eastern Time (UTC-5)"}
              onClick={() => updateProfile({ timezone: "Eastern Time (UTC-5)" })}
            />
          </GlassPanel>

          <GlassPanel className="p-6">
            <h2 className="font-serif text-2xl">Security & Data</h2>
            <Pref
              title="Two-factor authentication"
              hint="Protect your session with a second factor"
              checked={profile?.twoFactorEnabled ?? true}
              onChange={() => updateProfile({ twoFactorEnabled: !(profile?.twoFactorEnabled ?? true) })}
            />
            <Row label="Connected brokers" value={`${profile?.linkedBrokers ?? 2} linked`} />
          </GlassPanel>
        </div>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogTitle>Edit profile</DialogTitle>
          <form
            className="mt-5 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void saveProfile();
            }}
          >
            <input
              ref={photoInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                void onPickPhoto(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                className="relative"
                onClick={() => photoInput.current?.click()}
                aria-label="Upload profile photo"
              >
                <Avatar className="size-24">
                  {photo ? <AvatarImage src={photo} /> : null}
                  <AvatarFallback className="text-2xl">
                    {(name.trim()[0] || profile?.firstName?.[0] || "T").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border border-white/15 bg-zinc-900 text-white">
                  <Camera className="size-3.5" />
                </span>
              </button>
              <button
                type="button"
                className="text-xs text-white/55 hover:text-white"
                onClick={() => photoInput.current?.click()}
              >
                Upload photo
              </button>
            </div>
            <div className="space-y-1">
              <Label className="font-sans text-sm">First name</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} required />
            </div>
            {editError ? <p className="text-sm text-red-300">{editError}</p> : null}
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Pref({
  title,
  hint,
  checked,
  onChange,
}: {
  title: string;
  hint: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/8 pt-4">
      <div>
        <div className="text-sm">{title}</div>
        <div className="text-xs text-white/40">{hint}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function Row({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-5 flex w-full items-center justify-between gap-4 border-t border-white/8 pt-4 text-left"
    >
      <span className="text-sm">{label}</span>
      <span className="flex shrink-0 items-center gap-2 text-sm capitalize text-white/70">
        {value} <ChevronRight className="size-4 opacity-50" />
      </span>
    </button>
  );
}

import { useState, type ComponentProps, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, Clock3, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { ASSET_OPTIONS } from "@/lib/assets";
import { useOnboardingStore } from "@/stores/onboarding";
import type { ExperienceLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

function Frame({
  icon,
  title,
  children,
}: {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-lg flex-col items-center justify-center px-6 pb-20 text-center">
      <div className="flex w-full flex-col items-center">
        {icon}
        <h1 className="mt-6 font-serif text-4xl leading-tight sm:text-5xl">{title}</h1>
        {children}
      </div>
    </section>
  );
}

function ContinueButton({
  className,
  children,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button variant="auth" size="xl" className={cn("w-full max-w-md gap-3", className)} {...props}>
      {children ?? "Continue"}
      <ChevronRight className="size-5" />
    </Button>
  );
}

export function OnboardingNamePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const firstName = useOnboardingStore((state) => state.firstName);
  const setFirstName = useOnboardingStore((state) => state.setFirstName);
  const [name, setName] = useState(() => firstName || profile?.firstName || "");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = name.trim();
    if (!next) return;
    setFirstName(next);
    navigate({ to: "/onboarding/asset" });
  }

  return (
    <Frame icon={<UserRound className="size-10" />} title="What is Your First Name?">
      <form onSubmit={onSubmit} className="mt-8 flex w-full flex-col items-center gap-6">
        <Input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your first name"
          className="max-w-md"
        />
        <ContinueButton type="submit" />
      </form>
    </Frame>
  );
}

const ASSETS = ASSET_OPTIONS;

export function OnboardingAssetPage() {
  const navigate = useNavigate();
  const selected = useOnboardingStore((state) => state.assetClass);
  const toggleAsset = useOnboardingStore((state) => state.toggleAsset);

  return (
    <Frame title="What Asset Class Do You Invest in?">
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {ASSETS.map((item) => {
          const active = selected.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleAsset(item.id)}
              className={cn(
                "rounded-full px-7 py-2.5 text-sm transition-all duration-200",
                active
                  ? "neu-inset text-white"
                  : "neu-outset border border-white/6 bg-[rgba(22,22,32,0.72)] text-white/70 hover:text-white",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <ContinueButton
        className="mt-10"
        disabled={selected.length === 0}
        onClick={() => navigate({ to: "/onboarding/experience" })}
      />
    </Frame>
  );
}

export function OnboardingExperiencePage() {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const level = useOnboardingStore((state) => state.experience);
  const setExperience = useOnboardingStore((state) => state.setExperience);

  function onContinue() {
    const draft = useOnboardingStore.getState().draft(profile);
    setExperience(draft.experience);
    void updateProfile({
      firstName: draft.firstName,
      assetClass: draft.assetClass,
      experience: draft.experience,
      onboardingComplete: true,
    });
    useOnboardingStore.getState().reset();
    navigate({ to: "/home" });
  }

  return (
    <Frame icon={<Clock3 className="size-10" />} title="How Long Have You Been Investing?">
      <div className="mt-8 w-full max-w-md">
        <Select value={level} onValueChange={(value) => setExperience(value as ExperienceLevel)}>
          <SelectTrigger className="neu-inset rounded-[22px] border-[rgba(255,255,255,0.045)] bg-[rgba(12,12,20,0.4)]">
            <SelectValue placeholder="Select your experience level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="just_starting">Just starting</SelectItem>
            <SelectItem value="1_3_years">1–3 years</SelectItem>
            <SelectItem value="3_7_years">3–7 years</SelectItem>
            <SelectItem value="7_plus">7+ years</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ContinueButton className="mt-8" onClick={onContinue} />
    </Frame>
  );
}



import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Building2,
  MapPin,
  Layers3,
} from "lucide-react";

import { useAuth, type LoginLevel } from "@/lib/auth-context";
import { DIVISIONS, BLOCKS_OF } from "@/lib/districts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import lrmislogo from "@/assets/lrmis_logo.png";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/login copy 2")({
  head: () => ({
    meta: [{ title: "Sign in — LRMIS | NHM Madhya Pradesh" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [level, setLevel] = useState<LoginLevel>("state");
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [block, setBlock] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const districts =
    DIVISIONS.find((d) => d.name === division)?.districts ?? [];

  const blocks = district ? BLOCKS_OF[district] ?? [] : [];

  const canSubmit =
    Boolean(username.trim()) &&
    Boolean(password.trim()) &&
    (level === "state" ||
      (level === "district" && Boolean(district)) ||
      (level === "block" &&
        Boolean(division) &&
        Boolean(district) &&
        Boolean(block)));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) return;

    login({
      username,
      level,
      division: level === "state" ? undefined : division,
      district: level === "state" ? undefined : district,
      block: level === "block" ? block : undefined,
    });

    nav({ to: "/overview" });
  };

  const handleLevelChange = (newLevel: LoginLevel) => {
    setLevel(newLevel);

    if (newLevel === "state") {
      setDivision("");
      setDistrict("");
      setBlock("");
    }

    if (newLevel === "district") {
      setBlock("");
    }
  };

  return (
    <main className="min-h-screen bg-[#F7FBFA] text-slate-800">
      <div className="relative min-h-screen overflow-hidden">
        {/* Soft background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#DDF4EC]/70 blur-3xl" />

          <div className="absolute -bottom-48 -left-40 h-[520px] w-[520px] rounded-full bg-[#DDECFB]/80 blur-3xl" />

          <div className="absolute right-[20%] top-[30%] h-40 w-40 rounded-full bg-[#FFF1C9]/40 blur-3xl" />

          <div
            className="absolute inset-0 opacity-[0.25]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(15,118,110,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(15,118,110,0.045) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />
        </div>

        {/* Header */}
        <header className="relative z-10 border-b border-slate-200/70 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
            <div className="flex items-center gap-4">
              <img
                src={lrmislogo}
                alt="LRMIS logo"
                className="h-auto w-[150px] shrink-0 object-contain sm:w-[170px]"
              />

              <div className="hidden h-9 w-px bg-slate-200 sm:block" />

              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-tight text-slate-700">
                  Labour Room Management
                </p>
                <p className="text-sm font-semibold leading-tight text-slate-700">
                  Information System
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 text-xs font-medium text-slate-500 sm:flex">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              Government Health Platform
            </div>
          </div>
        </header>

        {/* Main */}
        <section className="relative z-10 mx-auto flex min-h-[calc(100vh-76px)] max-w-7xl items-center px-5 py-10 sm:px-8 lg:px-10">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            {/* Left content */}
            <div className="hidden lg:block">
              <div className="max-w-xl">
                {/* Small label */}
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white px-3.5 py-2 text-xs font-semibold text-teal-700 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                  NHM Madhya Pradesh
                </div>

                <h1 className="text-5xl font-bold leading-[1.08] tracking-tight text-slate-800 xl:text-6xl">
                  Better visibility.
                  <br />
                  <span className="text-teal-600">Better outcomes.</span>
                </h1>

                <p className="mt-6 max-w-lg text-base leading-7 text-slate-500">
                  Access the Labour Room Management Information System to
                  monitor maternal health services, facility performance,
                  resources and outcomes across Madhya Pradesh.
                </p>

                {/* Feature cards */}
                <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
                  <FeatureCard
                    icon={Building2}
                    title="Facility Insights"
                    description="Monitor labour room performance"
                  />

                  <FeatureCard
                    icon={MapPin}
                    title="District Visibility"
                    description="Track performance across locations"
                  />

                  <FeatureCard
                    icon={Layers3}
                    title="Operational Data"
                    description="Access current programme indicators"
                  />

                  <FeatureCard
                    icon={CheckCircle2}
                    title="Secure Access"
                    description="Role-based government access"
                  />
                </div>

                {/* Bottom note */}
                <div className="mt-10 flex items-center gap-3 text-xs text-slate-400">
                  <div className="h-px w-10 bg-slate-200" />
                  <span>
                    Real-time maternal health analytics across Madhya Pradesh
                  </span>
                </div>
              </div>
            </div>

            {/* Login area */}
            <div className="mx-auto w-full max-w-[470px]">
              {/* Mobile branding */}
              <div className="mb-8 text-center lg:hidden">
                <img
                  src={lrmislogo}
                  alt="LRMIS logo"
                  className="mx-auto h-auto w-[180px] object-contain"
                />

                <p className="mt-3 text-sm font-medium text-slate-500">
                  Labour Room Management Information System
                </p>
              </div>

              {/* Login card */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-25px_rgba(15,118,110,0.25)] sm:p-8">
                {/* Card heading */}
                <div>
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-[#DDF4EC] text-teal-700">
                    <Lock className="h-5 w-5" />
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight text-slate-800">
                    Sign in to LRMIS
                  </h2>

                  <p className="mt-1.5 text-sm leading-6 text-slate-500">
                    Use your authorised credentials to access the system.
                  </p>
                </div>

                {/* Access level */}
                <div className="mt-7">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Access level
                  </Label>

                  <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
                    {(["state", "district", "block"] as LoginLevel[]).map(
                      (item) => {
                        const active = level === item;

                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleLevelChange(item)}
                            className={[
                              "rounded-lg px-2 py-2.5 text-xs font-semibold capitalize transition-all",
                              active
                                ? "bg-white text-teal-700 shadow-sm ring-1 ring-slate-200"
                                : "text-slate-500 hover:text-slate-700",
                            ].join(" ")}
                          >
                            {item}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>

                <form onSubmit={onSubmit} className="mt-6 space-y-4">
                  {/* Division */}
                  {level === "block" && (
                    <div>
                      <Label className="text-sm font-medium text-slate-700">
                        Division
                      </Label>

                      <Select
                        value={division}
                        onValueChange={(value) => {
                          setDivision(value);
                          setDistrict("");
                          setBlock("");
                        }}
                      >
                        <SelectTrigger className="mt-1.5 h-11 rounded-lg border-slate-200 bg-white shadow-none focus:ring-teal-500">
                          <SelectValue placeholder="Select division" />
                        </SelectTrigger>

                        <SelectContent>
                          {DIVISIONS.map((item) => (
                            <SelectItem key={item.name} value={item.name}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* District */}
                  {level !== "state" && (
                    <div>
                      <Label className="text-sm font-medium text-slate-700">
                        District
                      </Label>

                      <Select
                        value={district}
                        onValueChange={(value) => {
                          setDistrict(value);
                          setBlock("");

                          if (level === "district") {
                            const selectedDivision = DIVISIONS.find((item) =>
                              item.districts.includes(value),
                            );

                            setDivision(selectedDivision?.name ?? "");
                          }
                        }}
                        disabled={level === "block" && !division}
                      >
                        <SelectTrigger className="mt-1.5 h-11 rounded-lg border-slate-200 bg-white shadow-none focus:ring-teal-500 disabled:bg-slate-50">
                          <SelectValue
                            placeholder={
                              level === "block"
                                ? division
                                  ? "Select district"
                                  : "Select division first"
                                : "Select your district"
                            }
                          />
                        </SelectTrigger>

                        <SelectContent>
                          {(
                            level === "district"
                              ? DIVISIONS.flatMap((item) => item.districts)
                              : districts
                          ).map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Block */}
                  {level === "block" && (
                    <div>
                      <Label className="text-sm font-medium text-slate-700">
                        Block
                      </Label>

                      <Select
                        value={block}
                        onValueChange={setBlock}
                        disabled={!district}
                      >
                        <SelectTrigger className="mt-1.5 h-11 rounded-lg border-slate-200 bg-white shadow-none focus:ring-teal-500 disabled:bg-slate-50">
                          <SelectValue
                            placeholder={
                              district
                                ? "Select block"
                                : "Select district first"
                            }
                          />
                        </SelectTrigger>

                        <SelectContent>
                          {blocks.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Username */}
                  <div>
                    <Label
                      htmlFor="username"
                      className="text-sm font-medium text-slate-700"
                    >
                      Username
                    </Label>

                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your employee ID"
                      autoComplete="username"
                      className="mt-1.5 h-11 rounded-lg border-slate-200 bg-white shadow-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500/20 focus-visible:ring-offset-0"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="password"
                        className="text-sm font-medium text-slate-700"
                      >
                        Password
                      </Label>

                      <a
                        href="#"
                        className="text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline"
                      >
                        Forgot password?
                      </a>
                    </div>

                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="mt-1.5 h-11 rounded-lg border-slate-200 bg-white shadow-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500/20 focus-visible:ring-offset-0"
                    />
                  </div>

                  {/* Sign in */}
                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="mt-2 h-11 w-full rounded-lg bg-teal-600 text-white shadow-sm transition-all hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    <span>Sign in to LRMIS</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>

                {/* Security note */}
                <div className="mt-6 flex gap-3 rounded-xl border border-[#DDF4EC] bg-[#F4FBF8] p-3.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />

                  <p className="text-[11px] leading-5 text-slate-500">
                    This is a restricted government application. Access is
                    limited to authorised users and is monitored for security
                    and administrative purposes.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-5 flex flex-col items-center justify-center gap-1 text-center text-[11px] text-slate-400 sm:flex-row sm:gap-2">
                <span>Government of Madhya Pradesh</span>
                <span className="hidden sm:inline">•</span>
                <span>National Health Mission</span>
                <span className="hidden sm:inline">•</span>
                <span>LRMIS v2.1.3</span>
              </div>

              <p className="mt-2 text-center text-[10px] text-slate-300">
                © 2026 NHM Madhya Pradesh
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Feature Card                                                               */
/* -------------------------------------------------------------------------- */

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-xl border border-slate-200/80 bg-white/80 p-4 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-teal-100 hover:bg-white hover:shadow-md">
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-[#DDF4EC] text-teal-700">
        <Icon className="h-4 w-4" />
      </div>

      <p className="text-sm font-semibold text-slate-700">{title}</p>

      <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
    </div>
  );
}
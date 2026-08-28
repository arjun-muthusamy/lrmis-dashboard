import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock } from "lucide-react";

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

export const Route = createFileRoute("/login copy 3")({
  head: () => ({
    meta: [{ title: "Sign in — LRMIS | NHM Madhya Pradesh" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [level, setLevel] = useState<LoginLevel>("state");
  const [division, setDivision] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [block, setBlock] = useState<string>("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const districts = DIVISIONS.find((d) => d.name === division)?.districts ?? [];

  const blocks = district ? (BLOCKS_OF[district] ?? []) : [];

  const canSubmit =
    username.trim() &&
    password.trim() &&
    (level === "state" ||
      (level === "district" && district) ||
      (level === "block" && division && district && block));

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

  const changeLevel = (newLevel: LoginLevel) => {
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
    <div className="min-h-screen bg-[#F7FBFA] text-slate-800">
      {/* Soft background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-48 -top-48 h-[600px] w-[600px] rounded-full bg-[#DDF4EC]/60 blur-3xl" />

        <div className="absolute -bottom-56 -left-48 h-[600px] w-[600px] rounded-full bg-[#DDECFB]/60 blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15,118,110,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15,118,110,0.035) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <img src={lrmislogo} alt="LRMIS logo" className="h-auto w-36 shrink-0 object-contain" />

            <div className="hidden h-8 w-px bg-slate-200 sm:block" />

            <div className="hidden flex-col sm:flex">
              <div className="text-base font-semibold leading-tight text-slate-700">
                Labour Room Management Information System
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex min-h-[calc(100vh-64px)] items-center justify-center px-5 py-10 sm:px-8">
        <div className="grid w-full max-w-[1120px] items-center gap-12 lg:grid-cols-[1fr_480px]">
          {/* Left branding area */}
          <div className="hidden lg:block">
            <div className="max-w-xl">
              <div className="mb-5">
                <img src={lrmislogo} alt="LRMIS logo" className="h-auto w-52 object-contain" />
              </div>

              <h1 className="text-5xl font-bold tracking-tight text-slate-800">LRMIS</h1>

              <p className="mt-4 text-xl font-medium leading-8 text-slate-600">
                Labour Room Management Information System
              </p>

              <p className="mt-2 text-sm font-medium text-teal-600">
                Government of Madhya Pradesh — NHM
              </p>

              <div className="mt-8 h-px w-20 bg-teal-500/30" />

              <p className="mt-6 max-w-md text-sm leading-6 text-slate-400">
                Real-time maternal health analytics across 52 districts and 1,200+ delivery points.
              </p>
            </div>
          </div>

          {/* Login card */}
          <div className="w-full">
            {/* Mobile logo */}
            <div className="mb-8 text-center lg:hidden">
              <img
                src={lrmislogo}
                alt="LRMIS logo"
                className="mx-auto h-auto w-48 object-contain"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(15,118,110,0.25)] sm:p-8">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-800">
                  Welcome back
                </h2>

                <p className="mt-1 text-sm text-slate-400">Sign in to continue</p>
              </div>

              {/* Level selector */}
              <div className="mt-6 grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                {(["state", "district", "block"] as LoginLevel[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => changeLevel(item)}
                    className={[
                      "rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all",
                      level === item
                        ? "bg-white text-teal-700 shadow-sm ring-1 ring-slate-200"
                        : "text-slate-400 hover:text-slate-700",
                    ].join(" ")}
                  >
                    {item} Level
                  </button>
                ))}
              </div>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                {/* Division */}
                {level === "block" && (
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Division</Label>

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
                        {DIVISIONS.map((d) => (
                          <SelectItem key={d.name} value={d.name}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* District */}
                {level !== "state" && (
                  <div>
                    <Label className="text-sm font-medium text-slate-700">District</Label>

                    <Select
                      value={district}
                      onValueChange={(value) => {
                        setDistrict(value);
                        setBlock("");

                        if (level === "district") {
                          const div = DIVISIONS.find((dv) => dv.districts.includes(value));

                          setDivision(div?.name ?? "");
                        }
                      }}
                      disabled={level === "block" && !division}
                    >
                      <SelectTrigger className="mt-1.5 h-11 rounded-lg border-slate-200 bg-white shadow-none focus:ring-teal-500 disabled:bg-slate-50">
                        <SelectValue
                          placeholder={
                            level === "block" ? "Select district" : "Select your district"
                          }
                        />
                      </SelectTrigger>

                      <SelectContent>
                        {(level === "district"
                          ? DIVISIONS.flatMap((d) => d.districts)
                          : districts
                        ).map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Block */}
                {level === "block" && (
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Block</Label>

                    <Select value={block} onValueChange={setBlock} disabled={!district}>
                      <SelectTrigger className="mt-1.5 h-11 rounded-lg border-slate-200 bg-white shadow-none focus:ring-teal-500 disabled:bg-slate-50">
                        <SelectValue placeholder="Select block" />
                      </SelectTrigger>

                      <SelectContent>
                        {blocks.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Username */}
                <div>
                  <Label htmlFor="username" className="text-sm font-medium text-slate-700">
                    Username
                  </Label>

                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="employee.id"
                    autoComplete="username"
                    className="mt-1.5 h-11 rounded-lg border-slate-200 bg-white shadow-none placeholder:text-slate-400 focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-500/15 focus-visible:ring-offset-0"
                  />
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Password
                  </Label>

                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="mt-1.5 h-11 rounded-lg border-slate-200 bg-white shadow-none placeholder:text-slate-400 focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-500/15 focus-visible:ring-offset-0"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="h-11 w-full rounded-lg bg-teal-600 text-white shadow-sm hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Sign In
                </Button>

                {/* Forgot password */}
                <a
                  className="block text-center text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline"
                  href="#"
                >
                  Forgot password?
                </a>
              </form>
            </div>

            {/* Existing footer content only */}
            <p className="mt-6 text-center text-[11px] text-slate-400">v2.1.3 · NHM MP © 2026</p>
          </div>
        </div>
      </main>
    </div>
  );
}

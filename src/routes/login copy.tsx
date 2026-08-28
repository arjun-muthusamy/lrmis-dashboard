import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
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

export const Route = createFileRoute("/login copy")({
  head: () => ({ meta: [{ title: "Sign in — LRMIS | NHM Madhya Pradesh" }] }),
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

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="relative hidden w-2/5 flex-col justify-between bg-navy p-12 text-navy-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 14px), repeating-linear-gradient(-45deg, #fff 0 1px, transparent 1px 14px)",
          }}
        />
        <div className="relative flex items-center gap-3">
          {/* <div className="grid h-12 w-12 place-items-center rounded-full bg-white/10 ring-1 ring-white/20">
            <ShieldCheck className="h-7 w-7 text-navy-foreground" />
          </div>
          <div className="text-xs uppercase tracking-widest text-navy-foreground/70">
            Government of MP
            <div className="text-[10px] text-navy-foreground/50">National Health Mission</div>
          </div> */}

          <div className="flex items-center gap-3">
            {" "}
            <img
              src={lrmislogo}
              alt={"LRMIS logo"}
              className="h-auto w-54 shrink-0 object-contain"
            />{" "}
            {/* <div className="flex flex-col">
              <div className="text-lg font-semibold leading-tight">
                Labour Room Management Information System
              </div>
            </div> */}
          </div>
        </div>

        <div className="relative">
          <h1 className="text-6xl font-extrabold leading-none tracking-tight">LRMIS</h1>
          <p className="mt-4 max-w-sm text-lg font-medium text-navy-foreground/90">
            Labour Room Management Information System
          </p>
          <p className="mt-2 text-sm text-teal-soft/80">Government of Madhya Pradesh — NHM</p>
          <p className="mt-8 max-w-sm text-sm text-navy-foreground/60">
            Real-time maternal health analytics across 52 districts and 1,200+ delivery points.
          </p>
        </div>

        <div className="relative text-xs text-navy-foreground/50">v2.1.3 · NHM MP © 2026</div>
      </div>

      {/* Right form */}
      <div className="flex w-full items-center justify-center bg-background px-6 lg:w-3/5">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold text-foreground">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to continue</p>

          <div className="mt-6 grid grid-cols-3 gap-1 rounded-lg bg-secondary p-1">
            {(["state", "district", "block"] as LoginLevel[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={`rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                  level === l
                    ? "bg-white text-navy shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l} Level
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {level === "block" && (
              <div>
                <Label>Division</Label>
                <Select
                  value={division}
                  onValueChange={(v) => {
                    setDivision(v);
                    setDistrict("");
                    setBlock("");
                  }}
                >
                  <SelectTrigger className="mt-1">
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

            {level !== "state" && (
              <div>
                <Label>District</Label>
                <Select
                  value={district}
                  onValueChange={(v) => {
                    setDistrict(v);
                    setBlock("");
                    if (level === "district") {
                      const div = DIVISIONS.find((dv) => dv.districts.includes(v));
                      setDivision(div?.name ?? "");
                    }
                  }}
                  disabled={level === "block" && !division}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue
                      placeholder={level === "block" ? "Select district" : "Select your district"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(level === "district" ? DIVISIONS.flatMap((d) => d.districts) : districts).map(
                      (d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {level === "block" && (
              <div>
                <Label>Block</Label>
                <Select value={block} onValueChange={setBlock} disabled={!district}>
                  <SelectTrigger className="mt-1">
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

            <div>
              <Label>Username</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="employee.id"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-11 w-full rounded-lg bg-navy text-navy-foreground hover:bg-navy/90"
            >
              <Lock className="mr-2 h-4 w-4" /> Sign In
            </Button>

            <a className="block text-center text-xs text-teal hover:underline" href="#">
              Forgot password?
            </a>
          </form>

          <p className="mt-10 text-center text-[11px] text-muted-foreground">
            v2.1.3 · NHM MP © 2026
          </p>
        </div>
      </div>
    </div>
  );
}

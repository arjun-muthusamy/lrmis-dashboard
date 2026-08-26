import { createFileRoute } from "@tanstack/react-router";
import { Check, Palette, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FONT_OPTIONS,
  getBrandForeground,
  isBrandColor,
  useBranding,
  type BrandingSettings,
} from "@/lib/branding-context";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Branding settings — LRMIS" }] }),
  component: SettingsPage,
});

const PRESETS: Array<{ name: string; note: string; value: BrandingSettings }> = [
  {
    name: "Government Navy",
    note: "Current LRMIS standard",
    value: {
      primaryColor: "#0F2D56",
      accentColor: "#0B7B8A",
      sidebarColor: "#FFFFFF",
      fontFamily: "inter",
    },
  },
  {
    name: "Civic Indigo",
    note: "Measured, analytical",
    value: {
      primaryColor: "#243B6B",
      accentColor: "#198B90",
      sidebarColor: "#182B4D",
      fontFamily: "publicSans",
    },
  },
  {
    name: "Health Ledger",
    note: "Clear operational focus",
    value: {
      primaryColor: "#24534A",
      accentColor: "#B85C38",
      sidebarColor: "#1A3934",
      fontFamily: "sourceSans",
    },
  },
];

function ColorField({
  label,
  field,
  description,
}: {
  label: string;
  field: keyof Pick<BrandingSettings, "primaryColor" | "accentColor" | "sidebarColor">;
  description: string;
}) {
  const { draft, updateDraft } = useBranding();
  const value = draft[field];
  const valid = isBrandColor(value);
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3">
        <Label htmlFor={field} className="text-sm font-semibold text-foreground">
          {label}
        </Label>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <input
          aria-label={`${label} color picker`}
          type="color"
          value={valid ? value : "#0F2D56"}
          onChange={(event) => updateDraft({ [field]: event.target.value.toUpperCase() })}
          className="h-10 w-12 cursor-pointer rounded-md border border-input bg-transparent p-1"
        />
        <Input
          id={field}
          value={value}
          onChange={(event) => updateDraft({ [field]: event.target.value.toUpperCase() })}
          className={`font-mono uppercase ${valid ? "" : "border-destructive focus-visible:ring-destructive"}`}
          maxLength={7}
          spellCheck={false}
        />
      </div>
      {!valid && (
        <p className="mt-2 text-xs font-medium text-destructive">
          Enter a six-digit hex value, for example #0F2D56.
        </p>
      )}
    </div>
  );
}

function SettingsPage() {
  const { draft, updateDraft, apply, cancel, reset, isDirty } = useBranding();
  const [savedNotice, setSavedNotice] = useState(false);
  const allColorsValid = [draft.primaryColor, draft.accentColor, draft.sidebarColor].every(
    isBrandColor,
  );
  const onApply = () => {
    if (!allColorsValid) return;
    apply();
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2600);
  };

  return (
    <div className="mx-auto max-w-6xl pb-8">
      <div className="mb-7 flex flex-col justify-between gap-4 border-b border-border pb-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-teal">
            <Palette className="h-4 w-4" /> Workspace settings
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Branding and appearance
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Set the visual identity for your personal LRMIS workspace. Changes preview immediately
            and apply only to this signed-in account.
          </p>
        </div>
        {savedNotice && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-md border border-teal/30 bg-teal-soft px-3 py-2 text-sm font-semibold text-navy"
          >
            <Check className="h-4 w-4 text-teal" /> Branding saved for this account
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="border-b border-border pb-5">
              <CardTitle>Theme presets</CardTitle>
              <CardDescription>
                Start with a tested combination, then tune individual values below.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 p-5 md:grid-cols-3">
              {PRESETS.map((preset) => {
                const selected = JSON.stringify(draft) === JSON.stringify(preset.value);
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => updateDraft(preset.value)}
                    className={`group rounded-lg border p-3 text-left transition-colors ${selected ? "border-teal bg-teal-soft/50 ring-1 ring-teal/30" : "border-border bg-background hover:border-teal/50"}`}
                  >
                    <div className="mb-4 flex h-8 overflow-hidden rounded-sm border border-black/10">
                      <span
                        className="w-1/2"
                        style={{ backgroundColor: preset.value.sidebarColor }}
                      />
                      <span
                        className="w-1/3"
                        style={{ backgroundColor: preset.value.primaryColor }}
                      />
                      <span
                        className="flex-1"
                        style={{ backgroundColor: preset.value.accentColor }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-foreground">{preset.name}</span>
                      {selected && <Check className="h-4 w-4 text-teal" />}
                    </div>
                    <span className="mt-1 block text-xs text-muted-foreground">{preset.note}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="border-b border-border pb-5">
              <CardTitle>Colour system</CardTitle>
              <CardDescription>
                Readable text, hover treatments, and softened surfaces are derived automatically
                from these three values.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 p-5 md:grid-cols-3">
              <ColorField
                field="primaryColor"
                label="Primary colour"
                description="Buttons, key headings, and focus states."
              />
              <ColorField
                field="accentColor"
                label="Accent colour"
                description="Active navigation and operational highlights."
              />
              <ColorField
                field="sidebarColor"
                label="Sidebar colour"
                description="The primary navigation surface."
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="border-b border-border pb-5">
              <CardTitle>Typography</CardTitle>
              <CardDescription>
                Choose from the approved LRMIS typefaces supported by the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <Label htmlFor="font-family" className="text-sm font-semibold">
                Interface typeface
              </Label>
              <Select
                value={draft.fontFamily}
                onValueChange={(fontFamily) =>
                  updateDraft({ fontFamily: fontFamily as BrandingSettings["fontFamily"] })
                }
              >
                <SelectTrigger id="font-family" className="mt-2 max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FONT_OPTIONS).map(([key, font]) => (
                    <SelectItem key={key} value={key} style={{ fontFamily: font.value }}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-muted-foreground">
                Used across navigation, reports, filters, and data views.
              </p>
            </CardContent>
          </Card>
        </div>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <Card className="overflow-hidden shadow-md">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <CardTitle className="text-base">Live workspace preview</CardTitle>
              <CardDescription>Preview is active across the application.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex min-h-[290px] bg-background">
                <div
                  className="w-20 border-r border-sidebar-border p-2"
                  style={{ backgroundColor: draft.sidebarColor }}
                >
                  <div className="grid h-8 w-8 place-items-center rounded bg-sidebar-foreground/15">
                    <ShieldCheck className="h-4 w-4 text-sidebar-foreground" />
                  </div>
                  <div className="mt-6 space-y-3">
                    <span className="block h-2 rounded bg-sidebar-foreground/70" />
                    <span className="block h-2 rounded bg-sidebar-foreground/30" />
                    <span className="block h-2 rounded bg-sidebar-foreground/30" />
                  </div>
                </div>
                <div
                  className="flex-1 p-4"
                  style={{ fontFamily: FONT_OPTIONS[draft.fontFamily].value }}
                >
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-bold" style={{ color: draft.primaryColor }}>
                      LRMIS
                    </span>
                    <span
                      className="h-5 w-5 rounded-full"
                      style={{ backgroundColor: draft.accentColor }}
                    />
                  </div>
                  <div className="mt-5">
                    <p className="text-xs text-muted-foreground">District oversight</p>
                    <p className="mt-1 text-lg font-bold" style={{ color: draft.primaryColor }}>
                      Maternal health summary
                    </p>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="rounded border border-border bg-card p-2">
                      <span className="text-[10px] text-muted-foreground">Reporting</span>
                      <strong className="mt-1 block text-sm">96.4%</strong>
                    </div>
                    <div
                      className="rounded p-2 text-xs font-bold"
                      style={{
                        backgroundColor: draft.accentColor,
                        color: getBrandForeground(draft.accentColor),
                      }}
                    >
                      Review records
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-border p-4">
                <p className="text-xs leading-5 text-muted-foreground">
                  Contrast treatments are automatically calculated to keep navigation and actions
                  legible.
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <div className="sticky bottom-0 z-20 mt-6 flex flex-col gap-3 border border-border bg-card/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={reset} className="justify-start text-muted-foreground">
          <RotateCcw /> Restore LRMIS defaults
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={cancel} disabled={!isDirty}>
            Cancel changes
          </Button>
          <Button onClick={onApply} disabled={!isDirty || !allColorsValid}>
            <Save /> Apply branding
          </Button>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Users, Building2, FileEdit, Plus, Trash2, Save, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { ALL_DISTRICTS } from "@/lib/districts";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Admin — LRMIS" }] }),
  component: AdminPage,
});

interface MockUser { id: string; username: string; level: "state" | "district" | "block"; district?: string; }
interface MockFacility { id: string; name: string; type: string; district: string; level: string; }
interface CmsBlock { id: string; facility: string; title: string; body: string; }

function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<MockUser[]>([
    { id: "1", username: "state.admin", level: "state" },
    { id: "2", username: "bhopal.admin", level: "district", district: "Bhopal" },
    { id: "3", username: "indore.admin", level: "district", district: "Indore" },
  ]);
  const [facilities, setFacilities] = useState<MockFacility[]>([
    { id: "1", name: "DH Bhopal", type: "DH", district: "Bhopal", level: "L3" },
    { id: "2", name: "CHC Bhopal Urban", type: "CHC", district: "Bhopal", level: "L2" },
    { id: "3", name: "PHC Bhopal Rural", type: "PHC", district: "Bhopal", level: "L1" },
  ]);
  const [cms, setCms] = useState<CmsBlock[]>([
    { id: "1", facility: "DH Bhopal", title: "Welcome", body: "Visiting hours 10am–6pm." },
  ]);

  // New entry forms
  const [nu, setNu] = useState<Partial<MockUser>>({ level: "district" });
  const [nf, setNf] = useState<Partial<MockFacility>>({ type: "PHC", level: "L1" });
  const [nc, setNc] = useState<Partial<CmsBlock>>({});

  if (user?.level !== "state") return <Navigate to="/overview" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-navy/10 text-navy">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Administration</h1>
          <p className="text-sm text-muted-foreground">Manage users, facilities and CMS content. State-level access only.</p>
        </div>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /> User Management</TabsTrigger>
          <TabsTrigger value="facilities" className="gap-2"><Building2 className="h-4 w-4" /> Facility Management</TabsTrigger>
          <TabsTrigger value="cms" className="gap-2"><FileEdit className="h-4 w-4" /> CMS Content</TabsTrigger>
        </TabsList>

        {/* USERS */}
        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">Add User</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div>
                <Label className="text-xs">Username</Label>
                <Input value={nu.username ?? ""} onChange={(e) => setNu({ ...nu, username: e.target.value })} placeholder="user.name" className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Level</Label>
                <Select value={nu.level} onValueChange={(v) => setNu({ ...nu, level: v as MockUser["level"] })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="state">State</SelectItem>
                    <SelectItem value="district">District</SelectItem>
                    <SelectItem value="block">Block</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">District</Label>
                <Select value={nu.district} onValueChange={(v) => setNu({ ...nu, district: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {ALL_DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  className="h-9 w-full gap-2"
                  onClick={() => {
                    if (!nu.username || !nu.level) return;
                    setUsers((u) => [...u, { id: String(Date.now()), username: nu.username!, level: nu.level!, district: nu.district }]);
                    setNu({ level: "district" });
                  }}
                >
                  <Plus className="h-4 w-4" /> Add User
                </Button>
              </div>
            </div>
          </div>

          <AdminTable
            columns={["Username", "Level", "District", ""]}
            rows={users.map((u) => [
              u.username,
              <span key="l" className="rounded bg-teal-soft px-2 py-0.5 text-[10px] font-semibold uppercase text-teal">{u.level}</span>,
              u.district ?? "—",
              <button key="d" onClick={() => setUsers((arr) => arr.filter((x) => x.id !== u.id))} className="text-rose-500 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button>,
            ])}
          />
        </TabsContent>

        {/* FACILITIES */}
        <TabsContent value="facilities" className="mt-4 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">Add Facility</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <div className="md:col-span-2">
                <Label className="text-xs">Facility Name</Label>
                <Input value={nf.name ?? ""} onChange={(e) => setNf({ ...nf, name: e.target.value })} placeholder="DH Sehore" className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={nf.type} onValueChange={(v) => setNf({ ...nf, type: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["DH","CH","CHC","PHC","SHC"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Level</Label>
                <Select value={nf.level} onValueChange={(v) => setNf({ ...nf, level: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["L1","L2","L3"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">District</Label>
                <Select value={nf.district} onValueChange={(v) => setNf({ ...nf, district: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {ALL_DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="mt-3 gap-2"
              onClick={() => {
                if (!nf.name || !nf.district) return;
                setFacilities((f) => [...f, { id: String(Date.now()), name: nf.name!, type: nf.type!, level: nf.level!, district: nf.district! }]);
                setNf({ type: "PHC", level: "L1" });
              }}
            >
              <Plus className="h-4 w-4" /> Add Facility
            </Button>
          </div>

          <AdminTable
            columns={["Facility", "Type", "Level", "District", ""]}
            rows={facilities.map((f) => [
              f.name, f.type, f.level, f.district,
              <button key="d" onClick={() => setFacilities((arr) => arr.filter((x) => x.id !== f.id))} className="text-rose-500 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button>,
            ])}
          />
        </TabsContent>

        {/* CMS */}
        <TabsContent value="cms" className="mt-4 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">Add Content Block</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label className="text-xs">Facility</Label>
                <Select value={nc.facility} onValueChange={(v) => setNc({ ...nc, facility: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select facility" /></SelectTrigger>
                  <SelectContent>
                    {facilities.map((f) => <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Title</Label>
                <Input value={nc.title ?? ""} onChange={(e) => setNc({ ...nc, title: e.target.value })} placeholder="Patient instructions" className="h-9" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Content</Label>
                <Textarea value={nc.body ?? ""} onChange={(e) => setNc({ ...nc, body: e.target.value })} rows={3} placeholder="Body text…" />
              </div>
            </div>
            <Button
              className="mt-3 gap-2"
              onClick={() => {
                if (!nc.facility || !nc.title) return;
                setCms((c) => [...c, { id: String(Date.now()), facility: nc.facility!, title: nc.title!, body: nc.body ?? "" }]);
                setNc({});
              }}
            >
              <Save className="h-4 w-4" /> Save Block
            </Button>
          </div>

          <AdminTable
            columns={["Facility", "Title", "Body", ""]}
            rows={cms.map((b) => [
              b.facility, b.title,
              <span key="b" className="line-clamp-2 text-xs text-muted-foreground">{b.body}</span>,
              <button key="d" onClick={() => setCms((arr) => arr.filter((x) => x.id !== b.id))} className="text-rose-500 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button>,
            ])}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminTable({ columns, rows }: { columns: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-secondary">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-muted-foreground">No entries yet</td></tr>
          ) : rows.map((r, i) => (
            <tr key={i} className={i % 2 ? "bg-[#FAFBFC]" : "bg-white"}>
              {r.map((cell, j) => <td key={j} className="px-4 py-2.5 text-[13px] text-foreground">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

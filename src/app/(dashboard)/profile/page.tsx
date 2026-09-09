"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { initials } from "@/lib/utils";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<{ user: any }>("/api/auth/me"),
  });

  useEffect(() => {
    if (meData?.user) setUser(meData.user);
  }, [meData, setUser]);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setAvatarUrl(user.avatarUrl || "");
    }
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await api.patch<{ user: any }>("/api/users/me", { firstName, lastName, avatarUrl });
      setUser(res.user);
      setProfileMsg("Profile updated successfully.");
    } catch (err: any) {
      setProfileMsg(err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordMsg(null);
    try {
      await api.patch("/api/users/me", { currentPassword, newPassword });
      setPasswordMsg("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const onAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <Topbar title="Profile" />
      <main className="p-4 md:p-6 max-w-2xl space-y-4">
        <Card>
          <CardHeader><CardTitle>Profile information</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4">
              {profileMsg && <p className="text-sm text-emerald-600">{profileMsg}</p>}
              <div className="flex items-center gap-4">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-primary/10 text-primary grid place-items-center text-xl font-semibold">
                    {user ? initials(user.firstName, user.lastName) : "?"}
                  </div>
                )}
                <div>
                  <Label htmlFor="avatar" className="cursor-pointer text-sm text-primary hover:underline">
                    Upload new photo
                  </Label>
                  <input id="avatar" type="file" accept="image/*" className="hidden" onChange={onAvatarFile} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>First name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Last name</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled />
              </div>
              <Button type="submit" disabled={profileSaving}>{profileSaving ? "Saving..." : "Save changes"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={savePassword} className="space-y-4">
              {passwordMsg && <p className="text-sm text-emerald-600">{passwordMsg}</p>}
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              <div className="space-y-1.5">
                <Label>Current password</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>New password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
              </div>
              <Button type="submit" disabled={passwordSaving}>{passwordSaving ? "Updating..." : "Update password"}</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

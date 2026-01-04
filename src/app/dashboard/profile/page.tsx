"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  IconUser,
  IconLock,
  IconDeviceFloppy,
  IconLoader,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { useToast } from "@/components/toast-provider";

interface Merchant {
  id: string;
  name: string;
  phoneNumber: string;
  merchantNumber: number;
  description: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
}

export default function MerchantProfilePage() {
  const { toast } = useToast();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch current merchant data
  const { data: merchant, isLoading } = useQuery({
    queryKey: ["merchant-me"],
    queryFn: async () => {
      const response = await fetch("/api/merchants/me");
      const result = await response.json();

      if (!result.success || !result.data?.merchant) {
        throw new Error("Failed to fetch merchant data");
      }

      return result.data.merchant as Merchant;
    },
  });

  // Initialize form when merchant data is loaded
  useEffect(() => {
    if (merchant) {
      setProfileForm({
        name: merchant.name,
        description: merchant.description || "",
        imageUrl: merchant.imageUrl || "",
      });
    }
  }, [merchant]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      const response = await fetch("/api/merchants/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to update profile");
      }

      return result.data;
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordForm) => {
      if (data.newPassword !== data.confirmPassword) {
        throw new Error("New passwords do not match");
      }

      const response = await fetch("/api/merchants/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to change password");
      }

      return result.data;
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
      // Reset password form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    changePasswordMutation.mutate(passwordForm);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <IconLoader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your merchant profile and security settings
        </p>
      </div>

      {/* Profile Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconUser className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your merchant information and public profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="merchantNumber">Merchant Number</FieldLabel>
              <Input
                id="merchantNumber"
                value={`#${merchant?.merchantNumber}`}
                disabled
                className="bg-muted"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="phoneNumber">Phone Number</FieldLabel>
              <Input
                id="phoneNumber"
                value={merchant?.phoneNumber}
                disabled
                className="bg-muted"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="name">
                Merchant Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="name"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, name: e.target.value })
                }
                placeholder="Enter merchant name"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <textarea
                id="description"
                value={profileForm.description}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    description: e.target.value,
                  })
                }
                placeholder="Describe your merchant (optional)"
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="imageUrl">Image URL</FieldLabel>
              <Input
                id="imageUrl"
                value={profileForm.imageUrl}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, imageUrl: e.target.value })
                }
                placeholder="Enter image URL (optional)"
                type="url"
              />
            </Field>

            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="w-full sm:w-auto"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <IconDeviceFloppy className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconLock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="currentPassword">
                Current Password <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                placeholder="Enter current password"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="newPassword">
                New Password <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                placeholder="Enter new password (min. 8 characters)"
                required
                minLength={8}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmPassword">
                Confirm New Password <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="Confirm new password"
                required
                minLength={8}
              />
            </Field>

            {passwordForm.newPassword &&
              passwordForm.confirmPassword &&
              passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-destructive text-sm">
                  Passwords do not match
                </p>
              )}

            <Button
              type="submit"
              disabled={
                changePasswordMutation.isPending ||
                passwordForm.newPassword !== passwordForm.confirmPassword
              }
              className="w-full sm:w-auto"
            >
              {changePasswordMutation.isPending ? (
                <>
                  <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <IconLock className="mr-2 h-4 w-4" />
                  Change Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

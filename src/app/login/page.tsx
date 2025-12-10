"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface LoginRequest {
  phoneNumber: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  error?: {
    message: string;
  };
}

export default function MerchantLogin() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const loginMutation = useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: async (credentials) => {
      const response = await fetch("/api/merchants/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        router.push("/dashboard");
      }
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ phoneNumber, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Merchant Login</CardTitle>
              <CardDescription>
                Sign in to your merchant dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <FieldGroup>
                  {loginMutation.isError && (
                    <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-lg text-sm">
                      {loginMutation.error?.message || "Login failed"}
                    </div>
                  )}

                  {loginMutation.data && !loginMutation.data.success && (
                    <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-lg text-sm">
                      {loginMutation.data.error?.message || "Login failed"}
                    </div>
                  )}

                  <Field>
                    <FieldLabel htmlFor="phoneNumber">Phone Number</FieldLabel>
                    <Input
                      id="phoneNumber"
                      data-testid="merchant-phone"
                      type="tel"
                      placeholder="+6281234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      disabled={loginMutation.isPending}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      data-testid="merchant-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loginMutation.isPending}
                    />
                  </Field>

                  <Field>
                    <Button
                      type="submit"
                      data-testid="merchant-login-btn"
                      disabled={loginMutation.isPending}
                      className="w-full"
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                    <FieldDescription className="text-center">
                      Test credentials: <br />
                      <span className="font-mono bg-slate-100 px-2 py-1 rounded text-xs">
                        +6281234567890 / password123
                      </span>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <FieldDescription className="px-6 text-center">
            By clicking continue, you agree to our{" "}
            <Link
              href="/"
              className="underline underline-offset-4 hover:no-underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/"
              className="underline underline-offset-4 hover:no-underline"
            >
              Privacy Policy
            </Link>
            .
          </FieldDescription>
        </div>
      </div>
    </div>
  );
}

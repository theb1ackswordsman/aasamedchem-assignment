"use client";

import React, { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error === "CredentialsSignin" || res.status === 401) {
          setError("Invalid email or password. Please try again.");
        } else {
          setError(res.error);
        }
        setIsLoading(false);
      } else {
        const session = await getSession();
        if (session?.user?.role === "admin") {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/seller/products");
        }
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="bg-white border border-gray-200 rounded-lg p-8 w-[380px] shadow-none">
        <CardHeader className="p-0 mb-6">
          <CardTitle className="text-[22px] font-medium text-gray-900 text-left">Sign in</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-0 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-[13px] text-red-600 border border-red-200 font-medium">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[12px] font-medium text-gray-700">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full h-9 border border-gray-200 rounded-md text-[13px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-none"
              />
            </div>
            <div className="space-y-1.5 mb-6">
              <Label htmlFor="password" className="text-[12px] font-medium text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full h-9 border border-gray-200 rounded-md text-[13px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-none"
              />
            </div>
          </CardContent>
          <CardFooter className="p-0 mt-6">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-[13px] font-medium rounded-md shadow-none"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}

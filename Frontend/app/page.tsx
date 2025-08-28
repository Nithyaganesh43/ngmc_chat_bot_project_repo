"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import ChatInterface from "@/components/chat-interface"

const API_BASE_URL = "https://ngmchatbot.onrender.com"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loginData, setLoginData] = useState({
    name: "",
    email: "",
    password: "",
  })
  const [loginLoading, setLoginLoading] = useState(false)
  const [error, setError] = useState("")

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const storedPassword = localStorage.getItem("ngmc-auth-key")
      if (storedPassword) {
        try {
          const response = await fetch(`${API_BASE_URL}/checkAuth`, {
            headers: {
              'x-api-key': storedPassword,
            },
          });
          if (response.ok) {
            setIsAuthenticated(true)
          } else {
            localStorage.removeItem("ngmc-auth-key")
            localStorage.removeItem("ngmc-user-name")
            localStorage.removeItem("ngmc-user-email")
          }
        } catch (error) {
          console.error("Auth check failed:", error)
          localStorage.removeItem("ngmc-auth-key")
          localStorage.removeItem("ngmc-user-name")
          localStorage.removeItem("ngmc-user-email")
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setError("")

    if (!loginData.name.trim() || !loginData.email.trim() || !loginData.password.trim()) {
      setError("All fields are required")
      setLoginLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/checkAuth`, {
        headers: {
          "x-api-key": loginData.password,
        },
      })

      if (response.ok) {
        // Store auth data in localStorage
        localStorage.setItem("ngmc-auth-key", loginData.password)
        localStorage.setItem("ngmc-user-name", loginData.name)
        localStorage.setItem("ngmc-user-email", loginData.email)
        setIsAuthenticated(true)
      } else {
        setError("Invalid credentials. Please check your password.")
      }
    } catch (error) {
      console.error("Login failed:", error)
      setError("Login failed. Please check your connection and try again.")
    }

    setLoginLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("ngmc-auth-key")
    localStorage.removeItem("ngmc-user-name")
    localStorage.removeItem("ngmc-user-email")
    setIsAuthenticated(false)
    setLoginData({ name: "", email: "", password: "" })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img
                src="https://www.ngmc.org/wp-content/uploads/2024/08/logoblue.png"
                alt="NGMC Logo"
                className="h-16 w-auto"
              />
            </div>
            <CardTitle className="text-2xl font-semibold">Welcome to NGMC Chat</CardTitle>
            <CardDescription>
              Nallamuthu Gounder Mahalingam College
              <br />
              Pollachi, Coimbatore District, Tamil Nadu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={loginData.name}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={loginLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={loginData.email}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, email: e.target.value }))}
                  disabled={loginLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Access Key</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your access key"
                  value={loginData.password}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                  disabled={loginLoading}
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}


              
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <ChatInterface onLogout={handleLogout} />
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, TrendingUp, Shield, Zap } from "lucide-react";
import logoUrl from '../assets/logo.png';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
   e.preventDefault();
   setIsLoading(true);
  
   try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
     });

    const data = await response.json();

    if (response.ok) {
      window.location.href = "/"; // Redirect to dashboard
    } else {
      alert(data.message || 'Login failed');
    }
  } catch (error) {
    alert('Login failed. Please try again.');
  } finally {
    setIsLoading(false);
  }
};



  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src={logoUrl} 
              alt="Next Trading Labs Logo" 
              className="w-12 h-12 object-contain"
              data-testid="img-logo-login"
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Next Trading Labs
            </h1>
          </div>
          <p className="text-muted-foreground">
            Sign in to access your AI trading dashboard
          </p>
        </div>

        <Card className="shadow-xl border-primary/10">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">

            {/* Email/Password Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  data-testid="input-email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                    data-testid="input-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="link"
                  className="px-0 text-sm text-primary hover:underline"
                  data-testid="link-forgot-password"
                >
                  Forgot password?
                </Button>
              </div>

              <Button 
                type="submit"
                className="w-full h-11"
                disabled={isLoading || !email || !password}
                data-testid="button-login"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Button
                  variant="link"
                  className="px-0 text-primary hover:underline"
                  onClick={() => window.location.href = '/signup'}
                  data-testid="link-signup"
                >
                  Sign up
                </Button>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">AI Signals</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Risk Management</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Real-time</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>&copy; 2024 Next Trading Labs. All rights reserved.</p>
          <p className="mt-1">
            By signing in, you agree to our{' '}
            <Button variant="link" className="px-0 text-xs h-auto">Terms</Button>
            {' '}and{' '}
            <Button variant="link" className="px-0 text-xs h-auto">Privacy Policy</Button>
          </p>
        </div>
      </div>
    </div>
  );
}

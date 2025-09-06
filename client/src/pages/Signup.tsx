import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Shield, Check, Users, Crown } from "lucide-react";
import logoUrl from '../assets/logo.png';

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    subscribeNewsletter: true
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match");
      return;
    }
    if (!formData.agreeToTerms) {
      alert("Please agree to the terms and conditions");
      return;
    }

    setIsLoading(true);
    
    // Simulate signup process
    setTimeout(() => {
      // In real implementation, this would handle user registration
      window.location.href = "/api/login"; // Redirect to OAuth after registration
    }, 1500);
  };

  const handleOAuthSignup = () => {
    window.location.href = "/api/login";
  };

  const isFormValid = formData.firstName && formData.lastName && formData.email && 
                     formData.password && formData.confirmPassword && 
                     formData.password === formData.confirmPassword && 
                     formData.agreeToTerms;

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
              data-testid="img-logo-signup"
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Next Trading Labs
            </h1>
          </div>
          <p className="text-muted-foreground">
            Start your AI trading journey today
          </p>
        </div>

        <Card className="shadow-xl border-primary/10">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Create account</CardTitle>
            <CardDescription className="text-center">
              Join thousands of traders using AI-powered signals
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* OAuth Signup Button */}
            <Button 
              onClick={handleOAuthSignup}
              className="w-full gradient-primary text-white font-semibold py-3 hover:shadow-lg hover:scale-105 transition-all duration-300"
              data-testid="button-oauth-signup"
            >
              <Shield className="mr-2 h-4 w-4" />
              Sign up with Replit
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or create account with email
                </span>
              </div>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="h-11"
                    data-testid="input-first-name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="h-11"
                    data-testid="input-last-name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="h-11"
                  data-testid="input-signup-email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="h-11 pr-10"
                    data-testid="input-signup-password"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="h-11 pr-10"
                    data-testid="input-confirm-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    data-testid="button-toggle-confirm-password"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-sm text-destructive">Passwords don't match</p>
                )}
              </div>

              {/* Terms and Newsletter */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked as boolean)}
                    data-testid="checkbox-terms"
                  />
                  <Label htmlFor="terms" className="text-sm leading-none">
                    I agree to the{' '}
                    <Button variant="link" className="px-0 text-sm h-auto text-primary">
                      Terms of Service
                    </Button>
                    {' '}and{' '}
                    <Button variant="link" className="px-0 text-sm h-auto text-primary">
                      Privacy Policy
                    </Button>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="newsletter"
                    checked={formData.subscribeNewsletter}
                    onCheckedChange={(checked) => handleInputChange('subscribeNewsletter', checked as boolean)}
                    data-testid="checkbox-newsletter"
                  />
                  <Label htmlFor="newsletter" className="text-sm leading-none text-muted-foreground">
                    Subscribe to trading insights and platform updates
                  </Label>
                </div>
              </div>

              <Button 
                type="submit"
                className="w-full h-11"
                disabled={isLoading || !isFormValid}
                data-testid="button-signup"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Button
                  variant="link"
                  className="px-0 text-primary hover:underline"
                  onClick={() => window.location.href = '/login'}
                  data-testid="link-login"
                >
                  Sign in
                </Button>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Plans Preview */}
        <div className="mt-8 grid grid-cols-3 gap-2">
          <div className="text-center p-3 bg-card/50 rounded-lg border">
            <Badge variant="secondary" className="mb-2">Free</Badge>
            <p className="text-xs text-muted-foreground">Basic confirmation</p>
          </div>
          <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
            <Badge className="mb-2 bg-primary">Starter</Badge>
            <p className="text-xs text-muted-foreground">50 daily signals</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-secondary/5 to-accent/5 rounded-lg border border-secondary/20">
            <Badge className="mb-2 bg-gradient-to-r from-secondary to-accent text-white">
              <Crown className="w-3 h-3 mr-1" />
              Pro
            </Badge>
            <p className="text-xs text-muted-foreground">Unlimited signals</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>&copy; 2024 Next Trading Labs. All rights reserved.</p>
          <p className="mt-1">Start with our Free plan, upgrade anytime</p>
        </div>
      </div>
    </div>
  );
}
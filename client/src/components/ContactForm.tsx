import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
}

export default function ContactForm({ isOpen, onClose, onBack }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit contact form');
      }

      const result = await response.json();
      
      setIsSubmitted(true);
      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 24 hours.",
      });
      
    } catch (error) {
      console.error("Contact form error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: ""
    });
    setIsSubmitted(false);
  };

  if (!isOpen) return null;

  if (isSubmitted) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 h-96 max-h-[80vh]">
        <Card className="h-full flex flex-col shadow-xl border-success/20 overflow-hidden">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm">Message Sent!</CardTitle>
                  <CardDescription className="text-xs">We'll respond soon</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
                data-testid="button-close-success"
              >
                ×
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col justify-center items-center p-4 text-center">
            <CheckCircle className="w-16 h-16 text-success mb-4" />
            <h3 className="text-lg font-semibold mb-2">Thank you!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Your message has been sent to our support team. We typically respond within 24 hours.
            </p>
            <div className="space-y-2 w-full">
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full"
                data-testid="button-send-another"
              >
                Send Another Message
              </Button>
              <Button
                onClick={onBack}
                className="w-full"
                data-testid="button-back-to-chat"
              >
                Back to Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 h-96 max-h-[80vh]">
      <Card className="h-full flex flex-col shadow-xl border-primary/20 overflow-hidden">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-8 w-8 p-0 mr-2"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Mail className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm">Contact Support</CardTitle>
                <CardDescription className="text-xs">Send us a message</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              data-testid="button-close-form"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-4 pt-2 space-y-3 min-h-0">
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-3 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs">Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your full name"
                className="text-sm"
                required
                data-testid="input-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                className="text-sm"
                required
                data-testid="input-email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-xs">Subject</Label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Brief description"
                className="text-sm"
                data-testid="input-subject"
              />
            </div>
            
            <div className="space-y-2 flex-1">
              <Label htmlFor="message" className="text-xs">Message *</Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Describe your question or issue in detail..."
                className="text-sm resize-none min-h-[80px]"
                required
                data-testid="textarea-message"
              />
            </div>
            
            <div className="flex space-x-2 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting || !formData.name || !formData.email || !formData.message}
                className="flex-1"
                data-testid="button-submit-form"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </form>
          
          <div className="flex flex-wrap gap-1 pt-2 border-t">
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => setFormData(prev => ({ ...prev, subject: "Billing Question" }))}
              data-testid="quick-subject-billing"
            >
              Billing
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => setFormData(prev => ({ ...prev, subject: "Technical Issue" }))}
              data-testid="quick-subject-technical"
            >
              Technical
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => setFormData(prev => ({ ...prev, subject: "Signal Question" }))}
              data-testid="quick-subject-signals"
            >
              Signals
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
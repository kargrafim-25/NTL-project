import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { User, Settings, CreditCard, LogOut, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfileAvatarProps {
  user: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    subscriptionTier: string;
  } | null | undefined;
  onLogout: () => void;
}

// Predefined avatar options including 2 female avatars
const AVATAR_OPTIONS = [
  { id: 'business_man', emoji: '👨‍💼', label: 'Business Man' },
  { id: 'business_woman', emoji: '👩‍💼', label: 'Business Woman' },
  { id: 'professional_woman', emoji: '👩‍💻', label: 'Professional Woman' },
  { id: 'trader_man', emoji: '🧑‍💻', label: 'Trader' },
  { id: 'analyst', emoji: '👨‍🔬', label: 'Analyst' },
  { id: 'executive', emoji: '🤵', label: 'Executive' }
];

export default function ProfileAvatar({ user, onLogout }: ProfileAvatarProps) {
  const [selectedAvatar, setSelectedAvatar] = useState('business_man');
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [showAccountDialog, setShowAccountDialog] = useState(false);

  const currentAvatar = AVATAR_OPTIONS.find(avatar => avatar.id === selectedAvatar);

  const getSubscriptionBadgeColor = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'bg-gradient-to-r from-secondary to-accent text-white';
      case 'starter':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getSubscriptionLabel = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'Pro Trader';
      case 'starter':
        return 'Starter Trader';
      default:
        return 'Free User';
    }
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0" data-testid="button-profile-avatar">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:scale-105 transition-transform">
              <span className="text-lg">{currentAvatar?.emoji || '👤'}</span>
            </div>
            {/* Subscription tier indicator */}
            {user.subscriptionTier !== 'free' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center">
                <Crown className="w-2 h-2 text-white" />
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2">
              <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              <Badge 
                className={`w-fit text-xs ${getSubscriptionBadgeColor(user.subscriptionTier)}`}
                data-testid="badge-profile-subscription"
              >
                {getSubscriptionLabel(user.subscriptionTier)}
              </Badge>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowAvatarDialog(true)} data-testid="menu-change-avatar">
            <User className="mr-2 h-4 w-4" />
            <span>Change Avatar</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowAccountDialog(true)} data-testid="menu-account-settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>Account Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem data-testid="menu-billing">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing & Plans</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} data-testid="menu-logout">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Avatar Selection Dialog */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Your Avatar</DialogTitle>
            <DialogDescription>
              Select a profile avatar that represents you best.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            {AVATAR_OPTIONS.map((avatar) => (
              <Button
                key={avatar.id}
                variant={selectedAvatar === avatar.id ? "default" : "outline"}
                className="h-20 w-20 flex flex-col items-center justify-center space-y-1"
                onClick={() => {
                  setSelectedAvatar(avatar.id);
                  setShowAvatarDialog(false);
                }}
                data-testid={`avatar-option-${avatar.id}`}
              >
                <span className="text-2xl">{avatar.emoji}</span>
                <span className="text-xs">{avatar.label.split(' ')[0]}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Account Settings Dialog */}
      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Account Settings</DialogTitle>
            <DialogDescription>
              Manage your account information and preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <p className="text-sm text-muted-foreground">{getUserDisplayName()}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subscription</label>
              <Badge className={`w-fit ${getSubscriptionBadgeColor(user.subscriptionTier)}`}>
                {getSubscriptionLabel(user.subscriptionTier)}
              </Badge>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Contact support for account changes or billing questions.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
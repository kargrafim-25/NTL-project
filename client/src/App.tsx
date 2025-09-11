import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import AdminLogs from "@/pages/AdminLogs";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import { useEffect } from "react";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/admin/logs" component={AdminLogs} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Lightweight security protection
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Only block right-click on non-interactive elements
      const target = e.target as HTMLElement;
      if (!target.closest('input, textarea, [contenteditable], button, a, [role="button"]')) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      
      // Don't block shortcuts in input fields
      if (target.matches('input, textarea, [contenteditable]')) {
        return;
      }
      
      // Only block developer tools shortcuts, not common user shortcuts
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))
      ) {
        e.preventDefault();
      }
    };

    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // Allow selection in input fields and editable content
      if (target.matches('input, textarea, [contenteditable], [role="textbox"]')) {
        return;
      }
      
      // Block selection on content areas only
      e.preventDefault();
    };

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      
      // Only prevent dragging of images, not other elements
      if (target.tagName === 'IMG') {
        e.preventDefault();
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);

    // Cleanup event listeners
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

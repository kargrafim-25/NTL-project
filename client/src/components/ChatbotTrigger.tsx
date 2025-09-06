import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import SupportChatbot from "./SupportChatbot";

export default function ChatbotTrigger() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Button */}
      {!isChatOpen && (
        <div className="fixed bottom-4 right-4 z-40">
          <Button
            onClick={() => setIsChatOpen(true)}
            className="w-14 h-14 rounded-full gradient-primary text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            data-testid="button-open-chat"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Chatbot Component */}
      <SupportChatbot 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </>
  );
}
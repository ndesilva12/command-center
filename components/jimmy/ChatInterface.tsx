"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  message: string;
  sender: "user" | "assistant";
  userId: string;
  timestamp: any;
  status: "pending" | "processing" | "completed";
  sessionId: string;
}

export function ChatInterface() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Real-time listener for messages
  useEffect(() => {
    if (!user) return;

    const messagesRef = collection(db, "jimmy_chat_messages");
    const q = query(
      messagesRef,
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Filter by sessionId client-side
        if (data.sessionId === sessionId) {
          loadedMessages.push({ id: doc.id, ...data } as Message);
        }
      });
      
      // Sort client-side by timestamp
      loadedMessages.sort((a, b) => {
        const aTime = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
        const bTime = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
        return aTime - bTime;
      });
      
      setMessages(loadedMessages);
      
      // Check if there's a processing message (show loading indicator)
      const hasProcessing = loadedMessages.some(
        (msg) => msg.sender === "user" && msg.status === "processing"
      );
      setIsLoading(hasProcessing);
    });

    return () => unsubscribe();
  }, [user, sessionId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || !user) return;

    const messageText = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    try {
      // Add message to Firestore
      await addDoc(collection(db, "jimmy_chat_messages"), {
        message: messageText,
        sender: "user",
        userId: user.uid,
        timestamp: serverTimestamp(),
        status: "pending",
        sessionId: sessionId,
      });

      // Message will appear via onSnapshot listener
      inputRef.current?.focus();
    } catch (error) {
      console.error("Failed to send message:", error);
      
      // Show error message locally
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        message: "Sorry, I encountered an error sending your message. Please try again.",
        sender: "assistant",
        userId: user.uid,
        timestamp: Timestamp.now(),
        status: "completed",
        sessionId: sessionId,
      };

      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--foreground-muted)" }}>
        <p>Please log in to chat with Jimmy</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)", maxHeight: "800px" }}>
      {/* Chat Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--foreground-muted)" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: "28px",
              }}
            >
              💬
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
              Start a conversation with Jimmy
            </h3>
            <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
              Ask questions, request analysis, or get insights
            </p>
            <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "12px", fontStyle: "italic" }}>
              Messages are processed asynchronously. Responses may take a moment.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: "flex",
                justifyContent: message.sender === "user" ? "flex-end" : "flex-start",
                animation: "fadeIn 0.3s ease-in",
              }}
            >
              <div
                style={{
                  maxWidth: "70%",
                  padding: "12px 16px",
                  borderRadius: "16px",
                  background:
                    message.sender === "user"
                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      : "rgba(255, 255, 255, 0.06)",
                  color: message.sender === "user" ? "white" : "var(--foreground)",
                  border: message.sender === "assistant" ? "1px solid var(--glass-border)" : "none",
                  position: "relative",
                }}
              >
                <div style={{ fontSize: "14px", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {message.message}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    marginTop: "6px",
                    opacity: 0.7,
                    textAlign: message.sender === "user" ? "right" : "left",
                    display: "flex",
                    justifyContent: message.sender === "user" ? "flex-end" : "flex-start",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {formatTime(message.timestamp)}
                  {message.sender === "user" && message.status === "pending" && (
                    <span style={{ fontSize: "10px" }}>⏳</span>
                  )}
                  {message.sender === "user" && message.status === "processing" && (
                    <span style={{ fontSize: "10px" }}>⚡</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "16px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid var(--glass-border)",
              }}
            >
              <Loader2 style={{ width: "16px", height: "16px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        className="glass"
        style={{
          padding: "16px",
          borderTop: "1px solid var(--glass-border)",
          display: "flex",
          gap: "12px",
          alignItems: "flex-end",
        }}
      >
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Jimmy..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "12px",
            border: "1px solid var(--glass-border)",
            background: "rgba(255, 255, 255, 0.03)",
            color: "var(--foreground)",
            fontSize: "14px",
            resize: "none",
            minHeight: "48px",
            maxHeight: "120px",
            fontFamily: "inherit",
            outline: "none",
          }}
          rows={1}
        />
        <button
          onClick={sendMessage}
          disabled={!inputValue.trim() || isLoading}
          style={{
            padding: "12px 20px",
            borderRadius: "12px",
            border: "none",
            background: inputValue.trim() && !isLoading
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "rgba(255, 255, 255, 0.1)",
            color: "white",
            cursor: inputValue.trim() && !isLoading ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: 600,
            transition: "all 0.15s",
            height: "48px",
          }}
        >
          {isLoading ? (
            <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} />
          ) : (
            <Send style={{ width: "18px", height: "18px" }} />
          )}
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

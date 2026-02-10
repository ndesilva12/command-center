"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("jimmy-chat-messages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed);
      } catch (e) {
        console.error("Failed to parse messages:", e);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("jimmy-chat-messages", JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Call the API route (proxy to OpenClaw gateway)
      const response = await fetch("/api/jimmy/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "No response received",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

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
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: "flex",
                justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                animation: "fadeIn 0.3s ease-in",
              }}
            >
              <div
                style={{
                  maxWidth: "70%",
                  padding: "12px 16px",
                  borderRadius: "16px",
                  background:
                    message.role === "user"
                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      : "rgba(255, 255, 255, 0.06)",
                  color: message.role === "user" ? "white" : "var(--foreground)",
                  border: message.role === "assistant" ? "1px solid var(--glass-border)" : "none",
                }}
              >
                <div style={{ fontSize: "14px", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {message.content}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    marginTop: "6px",
                    opacity: 0.7,
                    textAlign: message.role === "user" ? "right" : "left",
                  }}
                >
                  {formatTime(message.timestamp)}
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

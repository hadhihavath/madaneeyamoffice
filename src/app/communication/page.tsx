"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { AppShell } from "@/components/layout/AppShell";
import {
  MessageSquare,
  Hash,
  Send,
  Building2,
  Users,
  Paperclip,
  Smile,
  Search,
  Plus,
} from "lucide-react";

export default function CommunicationPage() {
  const [session, setSession] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setSession(meData.user);
      }

      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        const convs = data.conversations || [];
        setConversations(convs);
        if (convs.length > 0 && !activeConv) {
          setActiveConv(convs[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConv?.id) {
      fetchMessages(activeConv.id);
      const interval = setInterval(() => fetchMessages(activeConv.id), 4000);
      return () => clearInterval(interval);
    }
  }, [activeConv?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;
    setSending(true);

    try {
      const res = await fetch(`/api/conversations/${activeConv.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // Group conversations
  const generalChannels = conversations.filter(
    (c) => c.type === "CHANNEL" && !c.isOfficeChannel && !c.isDepartmentChannel
  );
  const officeChannels = conversations.filter((c) => c.isOfficeChannel);
  const deptChannels = conversations.filter((c) => c.isDepartmentChannel);
  const directMessages = conversations.filter((c) => c.type === "DIRECT");

  return (
    <AppShell>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden h-[calc(100vh-135px)] flex flex-col md:flex-row">
        {/* Left Channels Sidebar */}
        <div className="w-full md:w-72 bg-slate-50/80 border-r border-slate-200 flex flex-col flex-shrink-0">
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-600" />
              <span>Workspace Channels</span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
            {/* General */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                General
              </span>
              <div className="space-y-0.5">
                {generalChannels.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveConv(c)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors ${
                      activeConv?.id === c.id
                        ? "bg-brand-600 text-white font-bold shadow-xs"
                        : "text-slate-700 hover:bg-slate-200/70"
                    }`}
                  >
                    <Hash className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                    <span className="truncate">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Offices */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                Regional Offices
              </span>
              <div className="space-y-0.5">
                {officeChannels.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveConv(c)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors ${
                      activeConv?.id === c.id
                        ? "bg-brand-600 text-white font-bold shadow-xs"
                        : "text-slate-700 hover:bg-slate-200/70"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                    <span className="truncate">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Departments */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                Departments
              </span>
              <div className="space-y-0.5">
                {deptChannels.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveConv(c)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors ${
                      activeConv?.id === c.id
                        ? "bg-brand-600 text-white font-bold shadow-xs"
                        : "text-slate-700 hover:bg-slate-200/70"
                    }`}
                  >
                    <Hash className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                    <span className="truncate">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Messages */}
            {directMessages.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                  Direct Messages
                </span>
                <div className="space-y-0.5">
                  {directMessages.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveConv(c)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors ${
                        activeConv?.id === c.id
                          ? "bg-brand-600 text-white font-bold shadow-xs"
                          : "text-slate-700 hover:bg-slate-200/70"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Active Chat Stream */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-brand-600" />
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  {activeConv?.name || "Select a channel"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {activeConv?.description || "Real-time team channel"}
                </p>
              </div>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-400">
                No messages yet in this channel. Send the first message!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === session?.id;
                const senderName = msg.sender?.employee
                  ? `${msg.sender.employee.firstName} ${msg.sender.employee.lastName}`
                  : msg.sender?.email || "Colleague";

                return (
                  <div key={msg.id} className="flex items-start gap-3 text-xs">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-brand-100 border border-brand-200 flex-shrink-0 mt-0.5">
                      {msg.sender?.employee?.avatarUrl ? (
                        <Image
                          src={msg.sender.employee.avatarUrl}
                          alt={senderName}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-brand-700 text-xs">
                          {senderName.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-slate-900">
                          {senderName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 leading-relaxed max-w-2xl">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-slate-200 bg-slate-50/50 flex items-center gap-2"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${activeConv?.name || "channel"}...`}
              className="flex-1 text-xs py-2.5 px-4 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white text-slate-800"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white shadow-xs transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

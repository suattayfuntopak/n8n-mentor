import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import LinksDisplay from './components/LinksDisplay';
import ContactDisplay from './components/ContactDisplay';
import OtherAppsDisplay from './components/OtherAppsDisplay';
import { ChatMessage, MessageRole, MessagePart, Attachment, AppView } from './types';
import { getGeminiResponse } from './services/geminiService';

const STORAGE_KEY = 'n8n_mentor_messages_v1';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeView, setActiveView] = useState<AppView>('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  // localStorage'dan geçmiş mesajları yükle
  useEffect(() => {
    try {
      const kayitliMesajlar = localStorage.getItem(STORAGE_KEY);

      if (kayitliMesajlar) {
        const parsed = JSON.parse(kayitliMesajlar);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      }
    } catch (error) {
      console.error('Mesaj geçmişi yüklenemedi:', error);
    } finally {
      setIsStorageLoaded(true);
    }
  }, []);

  // Mesajlar her değiştiğinde localStorage'a kaydet
  useEffect(() => {
    if (!isStorageLoaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Mesaj geçmişi kaydedilemedi:', error);
    }
  }, [messages, isStorageLoaded]);

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    const userParts: MessagePart[] = [];

    attachments.forEach(att => {
      userParts.push({
        inlineData: {
          mimeType: att.type,
          data: att.base64.split(',')[1],
        },
      });
    });

    if (text.trim()) {
      userParts.push({ text: text.trim() });
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      parts: userParts,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      const responseText = await getGeminiResponse(updatedMessages, text, attachments);

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        parts: [{ text: responseText }],
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat Error:', error);

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        parts: [{ text: 'Bir hata oluştu. Lütfen tekrar dene.' }],
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const getHeaderTitle = () => {
    switch (activeView) {
      case 'chat':
        return 'Ekran Görüntüsü, Json ya da Dosya Yükleyip Sorular Sorarak Çok Başarılı İş Akışları Yapabilirsin!';
      case 'links':
        return 'Faydalı Kaynaklar ve Hızlı Erişim Bağlantıları';
      case 'other-apps':
        return 'Yapay Zeka Destekli Diğer Çözümlerimiz';
      case 'contact':
        return 'Suat Tayfun Topak ile İletişime Geçin!';
      default:
        return 'N8N Mentor';
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-800 antialiased text-[15px]">
      <Sidebar
        onViewChange={setActiveView}
        activeView={activeView}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className="flex-1 flex flex-col h-full bg-slate-50 relative min-w-0">
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-10 shadow-sm shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            {isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 shrink-0"
                title="Menüyü Aç"
              >
                <i className="fas fa-bars text-lg"></i>
              </button>
            )}
            <h2 className="text-[15px] font-bold text-[#1e293b] whitespace-nowrap overflow-hidden text-ellipsis">
              {getHeaderTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[12px] font-bold border border-green-100">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Gemini Aktif
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0 bg-[#f8fafc] overflow-hidden">
          {activeView === 'chat' && (
            <>
              <MessageList messages={messages} isTyping={isTyping} />
              <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
            </>
          )}
          {activeView === 'links' && <LinksDisplay />}
          {activeView === 'other-apps' && <OtherAppsDisplay />}
          {activeView === 'contact' && <ContactDisplay />}
        </div>
      </main>
    </div>
  );
};

export default App;

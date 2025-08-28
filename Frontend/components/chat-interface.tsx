import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Send,
  Plus,
  LogOut,
  FileText,
  X,
  Mic,
  MicOff,
} from 'lucide-react';

const API_BASE_URL = 'https://ngmchatbot.onrender.com';

interface Message {
  id: string;
  role: 'user' | 'AI';
  message: string;
  created_at: string;
}

interface Chat {
  id: string;
  title: string;
  created_at: string;
  conversations: Message[];
}

interface ChatInterfaceProps {
  onLogout: () => void;
}

export default function ChatInterface({ onLogout }: ChatInterfaceProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfTitle, setPdfTitle] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.conversations]);

  useEffect(() => {
    const name = localStorage.getItem('ngmc-user-name') || 'User';
    setUserName(name);
    loadChats();
    initializeSpeechRecognition();
  }, []);

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsListening(true);
      };

      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setMessage((prev) => {
            const newText = prev
              ? prev + ' ' + finalTranscript
              : finalTranscript;
            return newText.trim();
          });
        }

        if (interimTranscript && !finalTranscript) {
          const currentValue = message || '';
          setMessage(
            currentValue + (currentValue ? ' ' : '') + interimTranscript
          );
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setError(
            'Microphone access denied. Please allow microphone access and try again.'
          );
        } else if (event.error === 'no-speech') {
          setError('No speech detected. Please try again.');
        } else {
          setError('Speech recognition error. Please try again.');
        }
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  };

  const toggleVoiceInput = () => {
    if (!recognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setError('');
      recognition.start();
    }
  };

  const getAuthHeaders = () => {
    const authKey = localStorage.getItem('ngmc-auth-key');
    return {
      'Content-Type': 'application/json',
      'x-api-key': authKey || '',
    };
  };

  const loadChats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/getchat/`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const extractPdfUrls = (
    text: string
  ): Array<{ url: string; title: string }> => {
    const pdfs: Array<{ url: string; title: string }> = [];

    const markdownRegex = /\[([^\]]+)\]\(([^)]+\.pdf)\)/g;
    let match;
    while ((match = markdownRegex.exec(text)) !== null) {
      pdfs.push({
        title: match[1],
        url: match[2],
      });
    }

    const customRegex = /\[([^\]]+)\]$$(https?:\/\/[^)]+\.pdf)$$/g;
    while ((match = customRegex.exec(text)) !== null) {
      pdfs.push({
        title: match[1],
        url: match[2],
      });
    }

    return pdfs;
  };

  const handlePdfClick = (url: string, title: string) => {
    setPdfUrl(url);
    setPdfTitle(title);
    setShowPdfViewer(true);
  };

  const autoOpenPdf = (message: string) => {
    const pdfs = extractPdfUrls(message);
    if (pdfs.length > 0) {
      handlePdfClick(pdfs[0].url, pdfs[0].title);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    if (isListening && recognition) {
      recognition.stop();
    }

    const userMessage = message.trim();
    setMessage('');

    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      message: userMessage,
      created_at: new Date().toISOString(),
    };

    if (currentChat) {
      setCurrentChat((prev) =>
        prev
          ? {
              ...prev,
              conversations: [...prev.conversations, tempUserMessage],
            }
          : null
      );
    } else {
      const tempChat: Chat = {
        id: `temp-chat-${Date.now()}`,
        title: 'New Chat',
        created_at: new Date().toISOString(),
        conversations: [tempUserMessage],
      };
      setCurrentChat(tempChat);
    }

    setIsLoading(true);
    setError('');

    try {
      let response;
      if (currentChat) {
        response = await fetch(`${API_BASE_URL}/postchat/${currentChat.id}/`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ message: userMessage }),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/postchat/`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ message: userMessage }),
        });
      }

      if (response.ok) {
        const data = await response.json();

        await loadChats();

        let updatedChat = null;

        if (!currentChat && data.chatId) {
          const updatedChats = await fetch(`${API_BASE_URL}/getchat/`, {
            headers: getAuthHeaders(),
          }).then((res) => res.json());
          const newChat = updatedChats.find(
            (chat: Chat) => chat.id === data.chatId
          );
          if (newChat) {
            setCurrentChat(newChat);
            updatedChat = newChat;
          }
        } else if (currentChat && !currentChat.id.startsWith('temp-chat-')) {
          const updatedChats = await fetch(`${API_BASE_URL}/getchat/`, {
            headers: getAuthHeaders(),
          }).then((res) => res.json());
          const newUpdatedChat = updatedChats.find(
            (chat: Chat) => chat.id === currentChat.id
          );
          if (newUpdatedChat) {
            setCurrentChat(newUpdatedChat);
            updatedChat = newUpdatedChat;
          }
        } else if (
          currentChat &&
          currentChat.id.startsWith('temp-chat-') &&
          data.chatId
        ) {
          const updatedChats = await fetch(`${API_BASE_URL}/getchat/`, {
            headers: getAuthHeaders(),
          }).then((res) => res.json());
          const newChat = updatedChats.find(
            (chat: Chat) => chat.id === data.chatId
          );
          if (newChat) {
            setCurrentChat(newChat);
            updatedChat = newChat;
          }
        }

        if (updatedChat && updatedChat.conversations.length > 0) {
          const latestMessage =
            updatedChat.conversations[updatedChat.conversations.length - 1];
          if (latestMessage.role === 'AI') {
            autoOpenPdf(latestMessage.message);
          }
        }
      } else {
        setError('Failed to send message. Please try again.');
        if (currentChat) {
          if (currentChat.id.startsWith('temp-chat-')) {
            setCurrentChat(null);
          } else {
            setCurrentChat((prev) =>
              prev
                ? {
                    ...prev,
                    conversations: prev.conversations.filter(
                      (msg) => !msg.id.startsWith('temp-')
                    ),
                  }
                : null
            );
          }
        }
      }
    } catch (error) {
      console.error('Send message failed:', error);
      setError('Network error. Please check your connection.');
      if (currentChat) {
        if (currentChat.id.startsWith('temp-chat-')) {
          setCurrentChat(null);
        } else {
          setCurrentChat((prev) =>
            prev
              ? {
                  ...prev,
                  conversations: prev.conversations.filter(
                    (msg) => !msg.id.startsWith('temp-')
                  ),
                }
              : null
          );
        }
      }
    }

    setIsLoading(false);
  };

  const startNewChat = () => {
    setCurrentChat(null);
    setShowPdfViewer(false);
    setPdfUrl('');
    setPdfTitle('');
    if (isListening && recognition) {
      recognition.stop();
    }
  };

  const selectChat = (chat: Chat) => {
    setCurrentChat(chat);
    setShowPdfViewer(false);
    setPdfUrl('');
    setPdfTitle('');
    if (isListening && recognition) {
      recognition.stop();
    }
  };

  const formatText = (text: string) => {
    const lines = text.split('\n');

    return lines.map((line, lineIndex) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);

      return (
        <div key={lineIndex} className={lineIndex > 0 ? 'mt-2' : ''}>
          {parts.map((part, partIndex) => {
            if (
              part.startsWith('**') &&
              part.endsWith('**') &&
              part.length > 4
            ) {
              const boldText = part.slice(2, -2);
              return (
                <strong key={partIndex} className="font-semibold">
                  {boldText}
                </strong>
              );
            }
            return part;
          })}
        </div>
      );
    });
  };

  const renderMessage = (msg: Message) => {
    if (msg.role === 'AI') {
      const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = markdownLinkRegex.exec(msg.message)) !== null) {
        if (match.index > lastIndex) {
          const textBefore = msg.message.slice(lastIndex, match.index);
          parts.push({ type: 'text', content: textBefore });
        }

        const title = match[1];
        const url = match[2];
        const isPdf = url.toLowerCase().includes('.pdf');

        parts.push({
          type: 'link',
          title: title,
          url: url,
          isPdf: isPdf,
        });

        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < msg.message.length) {
        const textAfter = msg.message.slice(lastIndex);
        parts.push({ type: 'text', content: textAfter });
      }

      if (parts.length === 0) {
        parts.push({ type: 'text', content: msg.message });
      }

      return (
        <div className="text-sm leading-relaxed">
          {parts.map((part, index) => {
            if (part.type === 'link') {
              if (part.isPdf) {
                return (
                  <Button
                    key={index}
                    variant="link"
                    className="text-blue-500 hover:text-blue-400 underline p-0 h-auto font-normal text-sm inline break-all max-w-full"
                    onClick={() => handlePdfClick(part.url, part.title)}>
                    <span className="break-words">{part.title}</span>
                  </Button>
                );
              } else {
                return (
                  <Button
                    key={index}
                    variant="link"
                    className="text-blue-500 hover:text-blue-400 underline p-0 h-auto font-normal text-sm inline break-all max-w-full"
                    onClick={() =>
                      window.open(part.url, '_blank', 'noopener,noreferrer')
                    }>
                    <span className="break-words">{part.title}</span>
                  </Button>
                );
              }
            } else {
              const lines = part.content.split('\n');
              return (
                <span key={index}>
                  {lines.map((line, lineIndex) => {
                    const boldParts = line.split(/(\*\*[^*]+\*\*)/g);
                    return (
                      <span key={lineIndex}>
                        {lineIndex > 0 && <br />}
                        {boldParts.map((boldPart, boldIndex) => {
                          if (
                            boldPart.startsWith('**') &&
                            boldPart.endsWith('**') &&
                            boldPart.length > 4
                          ) {
                            const boldText = boldPart.slice(2, -2);
                            return (
                              <strong key={boldIndex} className="font-semibold">
                                {boldText}
                              </strong>
                            );
                          }
                          return boldPart;
                        })}
                      </span>
                    );
                  })}
                </span>
              );
            }
          })}
        </div>
      );
    }

    return (
      <div className="text-sm leading-relaxed">{formatText(msg.message)}</div>
    );
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen">
        <div className="p-4 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <img
              src="https://www.ngmc.org/wp-content/uploads/2024/08/logoblue.png"
              alt="NGMC Logo"
              className="h-8 w-auto"
            />
            <div className="text-sm font-medium text-sidebar-foreground">
              NGMC Chat
            </div>
          </div>
          <Button
            onClick={startNewChat}
            className="w-full justify-start gap-2 bg-transparent"
            variant="outline">
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full p-2">
            <div className="space-y-1">
              {chats.map((chat) => (
                <Button
                  key={chat.id}
                  onClick={() => selectChat(chat)}
                  variant={currentChat?.id === chat.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start text-left h-auto p-3">
                  <div className="truncate text-sm">{chat.title}</div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="p-4 border-t border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-sidebar-foreground truncate">
                {userName}
              </div>
            </div>
            <Button
              onClick={onLogout}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className={`flex-1 flex flex-col ${showPdfViewer ? 'w-1/2' : ''}`}>
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4">
            {currentChat ? (
              <div className="space-y-6 max-w-3xl mx-auto pb-4">
                {currentChat.conversations
                  .filter((msg) => !msg.id.startsWith('temp-'))
                  .map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-4 ${
                        msg.role === 'user' ? 'flex-row-reverse' : ''
                      }`}>
                      <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                        <AvatarFallback
                          className={
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }>
                          {msg.role === 'user'
                            ? userName.charAt(0).toUpperCase()
                            : 'AI'}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`flex-1 space-y-2 ${
                          msg.role === 'user' ? 'text-right' : ''
                        }`}>
                        <div
                          className={`inline-block max-w-[80%] p-3 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground ml-auto'
                              : 'bg-muted'
                          }`}>
                          {renderMessage(msg)}
                        </div>
                      </div>
                    </div>
                  ))}
                {currentChat.conversations.some((msg) =>
                  msg.id.startsWith('temp-')
                ) && (
                  <>
                    {currentChat.conversations
                      .filter((msg) => msg.id.startsWith('temp-'))
                      .map((msg) => (
                        <div
                          key={msg.id}
                          className="flex gap-4 flex-row-reverse">
                          <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {userName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2 text-right">
                            <div className="inline-block max-w-[80%] p-3 rounded-lg bg-primary text-primary-foreground ml-auto">
                              <div className="text-sm leading-relaxed">
                                {renderMessage(msg)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    {isLoading && (
                      <div className="flex gap-4">
                        <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                          <AvatarFallback className="bg-muted">
                            AI
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="inline-block bg-muted p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {!currentChat.conversations.some((msg) =>
                  msg.id.startsWith('temp-')
                ) &&
                  isLoading && (
                    <div className="flex gap-4">
                      <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                        <AvatarFallback className="bg-muted">AI</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="inline-block bg-muted p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="text-4xl font-semibold text-muted-foreground">
                    Welcome to NGMC Chat
                  </div>
                  <div className="text-lg text-muted-foreground">
                    How can I help you today?
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isListening ? 'Listening...' : 'Ask anything...'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                className={`flex-1 ${
                  isListening ? 'ring-2 ring-red-500 ring-opacity-50' : ''
                }`}
              />
              <Button
                onClick={toggleVoiceInput}
                disabled={isLoading}
                size="icon"
                variant={isListening ? 'destructive' : 'outline'}
                className={isListening ? 'animate-pulse' : ''}>
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !message.trim()}
                size="icon">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {isListening && (
              <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Listening... Click the microphone again to stop
              </div>
            )}
          </div>
        </div>
      </div>

      {showPdfViewer && (
        <div className="w-1/2 border-l border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">
                {pdfTitle || 'PDF Document'}
              </span>
            </div>
            <Button
              onClick={() => setShowPdfViewer(false)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="PDF Document"
              onError={() =>
                setError(
                  'Failed to load PDF. Please check if the URL is accessible.'
                )
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

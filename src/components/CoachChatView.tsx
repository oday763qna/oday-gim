import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, WorkoutPlan, WorkoutLogSession, MealLogItem, BodyweightEntry, PlayerProfile, PlanProposal } from '../types/gym';
import { Send, Bot, User, Sparkles, Image as ImageIcon, X, AlertTriangle, ShieldCheck, Check, CornerDownLeft } from 'lucide-react';

interface CoachChatViewProps {
  plan: WorkoutPlan;
  workouts: WorkoutLogSession[];
  todayMeals: MealLogItem[];
  weights: BodyweightEntry[];
  profile: PlayerProfile;
  onApproveProposal: (prop: PlanProposal) => void;
}

export const CoachChatView: React.FC<CoachChatViewProps> = ({
  plan,
  workouts,
  todayMeals,
  weights,
  profile,
  onApproveProposal,
}) => {
  const userName = profile?.name ? `يا ${profile.name}` : 'يا بطل';
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `أهلاً بك ${userName}! أنا المحرك الذكي الرسمي لتطبيق **Ode Gym AI**.

أنا هنا لمساعدتك في:
- الإجابة عن أي تساؤل يخص تمارينك ووجباتك المسجلة بدقة.
- تحليل الوجبات وتقدير الماكروز والسعرات من الصور أو الوصف.
- فهم التكنيك الحركي للتمارين وأجهزة الجيم وتفادي الإصابات.
- تقديم اقتراحات اختيارية تتطلب موافقتك الصريحة دون تعديل تلقائي.

تذكير دستوري: أنا ملتزم بـ 20 قاعدة صارمة تمنع اختراع أي معلومة أو تقديم تشخيص طبي. كيف يمكنني مساعدتك؟`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputVal, setInputVal] = useState<string>('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedMime, setAttachedMime] = useState<string>('image/jpeg');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickPrompts = [
    'كيف أبدأ بتسجيل أول تمرين وتتبع أوزاني؟',
    'ما هي أفضل طريقة لتوزيع الماكروز والبروتين اليومي؟',
    'اشرح لي التكنيك الآمن لتمارين السحب والظهر',
    'كيف يحلل التطبيق صوري للوجبات وفق قواعد عدم التخمين؟',
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend !== undefined ? textToSend : inputVal;
    if (!messageText.trim() && !attachedImage) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: messageText.trim() || 'تحليل الصورة المرفقة',
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      attachedImage: attachedImage || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputVal('');
    const currentImg = attachedImage;
    const currentMime = attachedMime;
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          playerDataContext: {
            currentPlan: plan,
            recentWorkouts: workouts.slice(-4),
            todayMeals,
            recentWeight: weights.slice(-5),
            profile,
          },
          imageBase64: currentImg,
          mimeType: currentMime,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'فشلت معالجة المحادثة');
      }

      const data = await response.json();

      // Check if message implies a proposal requiring approval
      const isProposal =
        data.reply.includes('اقتراح') ||
        data.reply.includes('موافقة') ||
        data.reply.includes('يحتاج موافقتك');

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        proposal: isProposal
          ? {
              id: `prop-${Date.now()}`,
              title: 'اقتراح تدريبي / غذائي من Ode Gym AI',
              description: 'اقتراح مستخرج من إجابة المحرك الذكي يتطلب موافقتك لاعتماده في خطتك.',
              reasoning: 'بناءً على المحادثة والبيانات الحالية.',
              type: 'modify_sets',
              status: 'pending',
              createdAt: new Date().toISOString().split('T')[0],
            }
          : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ تعذر استلام الرد: ${err.message || 'يرجى التحقق من الاتصال وإعادة المحاولة.'}`,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-12 flex flex-col h-[calc(100vh-160px)] min-h-[580px]">
      {/* Active Context Banner */}
      <div className="glass-panel px-4 py-2.5 rounded-2xl border border-white/10 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white">سياق اللاعب النشط المتصل بالمحرك:</span>
          <span className="text-slate-400 hidden md:inline">
            الخطة: {plan.title} • الجلسات: {workouts.length} • وجبات اليوم: {todayMeals.length} • الوزن: {profile.currentWeightKg} كجم
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>مراقب بالـ 20 قاعدة الصارمة</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 glass-card p-4 sm:p-6 rounded-3xl border border-white/10 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-md ${
                  isUser
                    ? 'bg-slate-700 border border-white/15'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-400/30 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[85%] sm:max-w-[75%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Attached Image if present */}
                {msg.attachedImage && (
                  <img
                    src={msg.attachedImage}
                    alt="صورة مرفقة"
                    className="max-h-48 rounded-2xl object-cover border border-white/10 shadow-lg mb-1"
                  />
                )}

                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                    isUser
                      ? 'bg-emerald-600/90 text-white rounded-tr-none'
                      : 'bg-slate-900/90 text-slate-100 border border-white/10 rounded-tl-none shadow-md'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Proposal approval card if AI suggested a plan modification */}
                {msg.proposal && msg.proposal.status === 'pending' && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span>اقتراح تدريبي يتطلب موافقتك الصريحة (القاعدة 11 و 12):</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          if (msg.proposal) {
                            onApproveProposal(msg.proposal);
                            msg.proposal.status = 'approved';
                            setMessages([...messages]);
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>موافق واعتماد في الخطة</span>
                      </button>
                      <button
                        onClick={() => {
                          if (msg.proposal) {
                            msg.proposal.status = 'rejected';
                            setMessages([...messages]);
                          }
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                      >
                        تجاهل
                      </button>
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-slate-500 px-1 font-mono block">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Ode Gym AI يراجع بياناتك ويطبق القواعد الصارمة...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-white/5 whitespace-nowrap transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="glass-panel p-3 rounded-2xl border border-white/10 space-y-2">
        {attachedImage && (
          <div className="relative inline-block">
            <img
              src={attachedImage}
              alt=""
              className="w-14 h-14 object-cover rounded-xl border border-emerald-500/40"
            />
            <button
              onClick={() => setAttachedImage(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Photo attachment trigger */}
          <label className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 border border-white/10 cursor-pointer transition-colors">
            <ImageIcon className="w-5 h-5" />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>

          {/* Text Input */}
          <input
            type="text"
            placeholder="اسأل Ode Gym AI عن تمرينك، وجبتك، أو أوزانك المسجلة..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || (!inputVal.trim() && !attachedImage)}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-950/40 disabled:opacity-40"
          >
            <Send className="w-5 h-5 transform -rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
};

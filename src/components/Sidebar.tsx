/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Play, Film, Layers, Settings, History } from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: string;
}

export function Sidebar({ activeTab }: SidebarProps) {
  const items = [
    { id: 'create', icon: Plus, label: 'مشروع جديد' },
    { id: 'storyboard', icon: Layers, label: 'لوحة المشاهد' },
    { id: 'history', icon: History, label: 'المكتبة' },
    { id: 'settings', icon: Settings, label: 'الإعدادات' },
  ];

  return (
    <aside className="w-20 lg:w-64 border-r border-white/10 h-screen flex flex-col bg-[#0a0a0b]">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
          <Film className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-xl hidden lg:block tracking-tight text-white">
          CINEGEN<span className="text-indigo-400">.AI</span>
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border ${
              activeTab === item.id 
                ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                : 'text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-300'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium hidden lg:block text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-[#111112] border border-white/10 rounded-xl p-4 hidden lg:block">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">استهلاك الذاكرة</p>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-2/3 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-[10px] text-indigo-400 font-mono">PRO PLAN</p>
            <p className="text-[10px] text-slate-500">67%</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Plus(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M5 12h14" /><path d="12 5v14" />
    </svg>
  );
}

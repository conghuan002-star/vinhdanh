/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Play, Pause, Settings, Eye, EyeOff, FastForward, ChevronRight, ChevronLast, Edit3, Type, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Contributor {
  name: string;
  amount: string;
}

export default function App() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [lastFileName, setLastFileName] = useState<string>('');
  const [title, setTitle] = useState('DANH SÁCH ỦNG HỘ');
  const [footerText, setFooterText] = useState('XIN CHÂN THÀNH CẢM ƠN!');
  const [speed, setSpeed] = useState(1); // 0.5: slow, 1: medium, 2: fast
  const [isScrolling, setIsScrolling] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);

  // Appearance State
  const [bgColor, setBgColor] = useState('#001f3f');
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(36);
  const [lineSpacing, setLineSpacing] = useState(32);
  const [containerWidth, setContainerWidth] = useState(80); // percentage
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process File Data
  const readFileData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      const parsedContributors: Contributor[] = data
        .slice(1) // Skip header row
        .filter(row => row[0] && row[1])
        .map(row => ({
          name: String(row[0]),
          amount: typeof row[1] === 'number' ? row[1].toLocaleString('vi-VN') : String(row[1])
        }));

      setContributors(parsedContributors);
      setIsScrolling(false);
      setLastFileName(file.name);
    };
    reader.readAsBinaryString(file);
  };

  // Handle Excel Import (Standard Method)
  const handleOpenFile = () => {
    fileInputRef.current?.click();
  };

  // Handle Standard File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFileData(file);
    // Reset input value to allow selecting the same file again if needed
    e.target.value = '';
  };

  // Handle Refresh (Re-trigger file picker for security/compatibility)
  const handleRefresh = () => {
    handleOpenFile();
  };

  // Keyboard shortcut to hide/show controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setShowControls(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowControls(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate animation duration based on content height and speed
  const animationDuration = useMemo(() => {
    const baseSpeed = 100; // pixels per second at speed 1
    const contentHeight = contributors.length * 60 + 400; // estimate
    return contentHeight / (baseSpeed * speed);
  }, [contributors.length, speed]);

  return (
    <div 
      className="min-h-screen font-sans overflow-hidden relative select-none transition-colors duration-500"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {/* Header Area - Fixed at top */}
      <div 
        className="absolute top-0 left-0 w-full z-20 pt-12 pb-8 px-4 text-center shadow-2xl"
        style={{ backgroundColor: bgColor }}
      >
        <h1 
          className="text-4xl md:text-6xl font-bold tracking-widest cursor-pointer hover:text-white/80 transition-colors"
          onClick={() => setShowEditModal(true)}
        >
          {title}
        </h1>
        <div className="mt-4 h-1 w-32 bg-white/20 mx-auto rounded-full" />
      </div>

      {/* Fading Mask Overlay */}
      <div 
        className="absolute top-[160px] left-0 w-full h-32 z-10 pointer-events-none" 
        style={{ background: `linear-gradient(to bottom, ${bgColor}, transparent)` }}
      />

      {/* Scrolling Content */}
      <div className="relative h-screen flex flex-col items-center pt-[200px]">
        <AnimatePresence mode="wait">
          {isScrolling && contributors.length > 0 ? (
            <motion.div
              key="scroller"
              initial={{ y: '100vh' }}
              animate={{ y: '-120%' }}
              transition={{ 
                duration: animationDuration, 
                ease: "linear",
                repeat: Infinity 
              }}
              className="w-full flex flex-col items-center py-20"
              style={{ 
                maxWidth: `${containerWidth}%`,
                gap: `${lineSpacing}px`
              }}
            >
              {contributors.map((c, i) => (
                <div 
                  key={i} 
                  className="flex justify-between w-full px-8 border-b border-white/10"
                  style={{ 
                    fontSize: `${fontSize}px`,
                    paddingBottom: `${lineSpacing / 2}px`
                  }}
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="font-mono opacity-90">{c.amount}</span>
                </div>
              ))}
              
              {/* Footer text at the end of the scroll */}
              <div className="mt-40 text-center px-4">
                <p 
                  className="font-serif italic text-white/90 leading-relaxed"
                  style={{ fontSize: `${fontSize * 1.2}px` }}
                >
                  {footerText}
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] text-white/40">
              {contributors.length === 0 ? (
                <div className="text-center">
                  <Upload size={64} className="mx-auto mb-4 opacity-20" />
                  <p className="text-xl">Vui lòng nhập file Excel để bắt đầu</p>
                  <p className="text-sm mt-2 opacity-50">(Cột 1: Họ tên, Cột 2: Số tiền)</p>
                </div>
              ) : (
                <div className="text-center">
                  <Play size={64} className="mx-auto mb-4 opacity-20" />
                  <p className="text-xl">Nhấn Play để bắt đầu chạy chữ</p>
                  <p className="text-sm mt-2 opacity-50">{contributors.length} người trong danh sách</p>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Panel */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl flex flex-wrap items-center gap-4 max-w-[95vw]"
          >
            {/* File Import */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handleOpenFile}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                title="Nhập file Excel"
              >
                <Upload size={18} />
                <span className="hidden sm:inline">Nhập Excel</span>
              </button>
              
              {lastFileName && (
                <button 
                  onClick={handleRefresh}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-emerald-400"
                  title={`Cập nhật từ: ${lastFileName}`}
                >
                  <RefreshCw size={18} />
                </button>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".xlsx, .xls" 
              className="hidden" 
            />

            <div className="h-6 w-px bg-white/10 mx-2" />

            {/* Play/Pause */}
            <button 
              onClick={() => setIsScrolling(!isScrolling)}
              disabled={contributors.length === 0}
              className={`p-3 rounded-full transition-all ${isScrolling ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'} disabled:opacity-30`}
            >
              {isScrolling ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>

            <div className="h-6 w-px bg-white/10 mx-2" />

            {/* Speed Controls */}
            <div className="flex items-center bg-white/5 rounded-xl p-1">
              {[
                { label: 'Chậm', val: 0.5, icon: <ChevronRight size={16} /> },
                { label: 'Vừa', val: 1, icon: <FastForward size={16} /> },
                { label: 'Nhanh', val: 2, icon: <ChevronLast size={16} /> }
              ].map((s) => (
                <button
                  key={s.val}
                  onClick={() => setSpeed(s.val)}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all ${speed === s.val ? 'bg-white text-[#001f3f] font-bold' : 'text-white/60 hover:text-white'}`}
                >
                  {s.icon}
                  <span className="hidden md:inline">{s.label}</span>
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-white/10 mx-2" />

            {/* Edit Content (Title & Footer) */}
            <button 
              onClick={() => setShowEditModal(!showEditModal)}
              className={`p-2 rounded-xl transition-all ${showEditModal ? 'bg-white text-[#001f3f]' : 'bg-white/10 hover:bg-white/20'}`}
              title="Sửa tiêu đề & lời cảm ơn"
            >
              <Edit3 size={18} />
            </button>

            {/* Appearance Settings */}
            <button 
              onClick={() => setShowAppearanceModal(true)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
              title="Cài đặt giao diện"
            >
              <Settings size={18} />
            </button>

            {/* Hide Controls */}
            <button 
              onClick={() => setShowControls(false)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
              title="Ẩn thanh công cụ (Phím H)"
            >
              <EyeOff size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Edit Modal (Title & Footer) */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#002b55] border border-white/20 p-8 rounded-3xl w-full max-w-lg shadow-2xl text-white"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Edit3 size={24} />
                Chỉnh sửa nội dung
              </h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium opacity-70">Tiêu đề chính</label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-lg outline-none focus:border-white/30 transition-all"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tiêu đề..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium opacity-70">Lời cảm ơn (cuối trang)</label>
                  <textarea
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-3 text-lg outline-none focus:border-white/30 transition-all resize-none"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="Nhập lời cảm ơn..."
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="px-8 py-2 bg-white text-[#001f3f] font-bold rounded-xl hover:bg-white/90 transition-all"
                >
                  Hoàn tất
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Appearance Modal */}
      <AnimatePresence>
        {showAppearanceModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#002b55] border border-white/20 p-8 rounded-3xl w-full max-w-md shadow-2xl text-white"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Settings size={24} />
                Cài đặt giao diện
              </h2>
              
              <div className="space-y-6">
                {/* Background Color */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium opacity-70">Màu nền</label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono opacity-50">{bgColor}</span>
                    <input 
                      type="color" 
                      value={bgColor} 
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
                    />
                  </div>
                </div>

                {/* Text Color */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium opacity-70">Màu chữ</label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono opacity-50">{textColor}</span>
                    <input 
                      type="color" 
                      value={textColor} 
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
                    />
                  </div>
                </div>

                {/* Font Size */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium opacity-70">Cỡ chữ</label>
                    <span className="text-sm font-bold">{fontSize}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="16" 
                    max="80" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>

                {/* Line Spacing */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium opacity-70">Khoảng cách dòng</label>
                    <span className="text-sm font-bold">{lineSpacing}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="150" 
                    value={lineSpacing} 
                    onChange={(e) => setLineSpacing(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>

                {/* Container Width */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium opacity-70">Độ rộng danh sách</label>
                    <span className="text-sm font-bold">{containerWidth}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="30" 
                    max="95" 
                    value={containerWidth} 
                    onChange={(e) => setContainerWidth(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => setShowAppearanceModal(false)}
                  className="px-8 py-2 bg-white text-[#001f3f] font-bold rounded-xl hover:bg-white/90 transition-all"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Hint to show controls */}
      {!showControls && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          whileHover={{ opacity: 1 }}
          className="fixed bottom-4 right-4 z-50 cursor-pointer"
          onClick={() => setShowControls(true)}
        >
          <div className="bg-white/10 p-3 rounded-full backdrop-blur-md border border-white/10">
            <Eye size={20} />
          </div>
        </motion.div>
      )}
    </div>
  );
}

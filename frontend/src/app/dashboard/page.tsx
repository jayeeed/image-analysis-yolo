'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, X, MessageCircle } from 'lucide-react';
import axios from 'axios';

interface Detection {
    class_name: string;
    confidence: number;
    bbox: number[];
}

interface User {
    id: number;
    email: string;
    full_name: string;
}

interface ChatMessage {
    role: 'user' | 'ai';
    content: string;
}

export default function Dashboard() {
    const router = useRouter();
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [user, setUser] = useState<User | null>(null);
    const [imageId, setImageId] = useState<number | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [detections, setDetections] = useState<Detection[]>([]);
    const [annotatedImage, setAnnotatedImage] = useState<string>('');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [question, setQuestion] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [isAsking, setIsAsking] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => setUser(res.data))
            .catch(() => router.push('/login'));
    }, [router]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFileUpload(file);
        }
    };

    const handleFileUpload = async (file: File) => {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setDetections([]);
        setAnnotatedImage('');
        setChatMessages([]);
        setImageId(null);

        await detectObjects(file);
    };

    const detectObjects = async (file: File) => {
        setIsDetecting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/detect`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setImageId(response.data.image_id);
            setDetections(response.data.detections);
            setAnnotatedImage(response.data.annotated_image);
        } catch (error) {
            console.error('Detection failed:', error);
            alert('Detection failed. Please try again.');
        } finally {
            setIsDetecting(false);
        }
    };



    const handleAskQuestion = async () => {
        if (!question.trim() || detections.length === 0 || !imageId) return;

        const currentQuestion = question;
        const userMessage: ChatMessage = { role: 'user', content: currentQuestion };
        setChatMessages(prev => [...prev, userMessage]);
        setQuestion('');
        setIsAsking(true);

        try {
            const token = localStorage.getItem('token');
            
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/chat`,
                {
                    question: currentQuestion,
                    image_id: imageId
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const aiMessage: ChatMessage = { role: 'ai', content: response.data.response };
            setChatMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Chat failed:', error);
            const errorMessage: ChatMessage = { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsAsking(false);
        }
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedDetections = [...detections].sort((a, b) => {
        if (!sortConfig) return 0;

        let aValue: any = a[sortConfig.key as keyof Detection];
        let bValue: any = b[sortConfig.key as keyof Detection];

        if (sortConfig.key === 'bbox') {
            aValue = JSON.stringify(a.bbox);
            bValue = JSON.stringify(b.bbox);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const getInitials = (name: string) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <header className="bg-white border-b border-[#e2e8f0] py-3 sm:py-[18px] sticky top-0 z-50 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-[38px] sm:h-[38px] rounded-[9px] flex items-center justify-center" style={{
                            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
                        }}>
                            <Camera className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-white" strokeWidth={2.5} />
                        </div>
                        <h1 className="text-base sm:text-xl font-bold text-[#0f172a] tracking-tight">AI Vision Platform</h1>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-5">
                        <div className="flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2 px-2 sm:px-4 sm:pl-2 bg-[#f8fafc] rounded-3xl cursor-pointer hover:bg-[#f1f5f9] transition-colors">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold" style={{
                                background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
                            }}>
                                {getInitials(user.full_name || user.email)}
                            </div>
                            <div className="hidden md:block">
                                <div className="text-sm font-semibold text-[#0f172a] leading-tight">{user.full_name || 'User'}</div>
                                <div className="text-xs text-[#64748b]">{user.email}</div>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="py-1.5 sm:py-2 px-3 sm:px-[18px] bg-white border-[1.5px] border-[#e2e8f0] rounded-lg text-xs sm:text-sm font-semibold text-[#475569] hover:border-[#cbd5e1] hover:bg-[#f8fafc] transition-all cursor-pointer"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-8 sm:pb-[60px]">
                <section className="bg-white rounded-2xl p-5 sm:p-7 lg:p-9 mb-5 sm:mb-7 shadow-sm border border-[#e2e8f0]">
                    <h2 className="text-lg sm:text-xl font-bold text-[#0f172a] mb-1 sm:mb-2 tracking-tight">Upload Image for Detection</h2>
                    <p className="text-xs sm:text-sm text-[#64748b] mb-5 sm:mb-7">Upload an image to detect objects using our advanced YOLO model</p>

                    {!selectedFile ? (
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            className="border-2 border-dashed border-[#cbd5e1] rounded-xl p-8 sm:p-12 text-center bg-[#f8fafc] hover:border-[#2563eb] hover:bg-[#eff6ff] transition-all cursor-pointer"
                            onClick={() => document.getElementById('fileInput')?.click()}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-[18px] shadow-md">
                                <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-[#2563eb]" />
                            </div>
                            <div className="text-sm sm:text-base font-semibold text-[#0f172a] mb-1.5">Drop your image here</div>
                            <div className="text-xs sm:text-sm text-[#64748b] mb-4 sm:mb-5">or click to browse (PNG, JPG, JPEG up to 10MB)</div>
                            <button className="py-2.5 sm:py-[11px] px-5 sm:px-6 text-white border-none rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer" style={{
                                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
                            }}>
                                Select Image
                            </button>
                            <input
                                id="fileInput"
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            <div className="relative">
                                <div className="rounded-xl overflow-hidden bg-[#f1f5f9] border border-[#e2e8f0]">
                                    {isDetecting ? (
                                        <div className="relative">
                                            <img src={previewUrl} alt="Preview" className="w-full h-auto block opacity-50" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                                    <p className="text-xs sm:text-sm font-semibold text-[#0f172a]">Detecting objects...</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : annotatedImage ? (
                                        <img src={annotatedImage} alt="Annotated" className="w-full h-auto block" />
                                    ) : (
                                        <img src={previewUrl} alt="Preview" className="w-full h-auto block" />
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedFile(null);
                                        setPreviewUrl('');
                                        setDetections([]);
                                        setAnnotatedImage('');
                                        setChatMessages([]);
                                        setImageId(null);
                                    }}
                                    className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 bg-white/90 hover:bg-white text-[#ef4444] rounded-lg shadow-lg hover:shadow-xl transition-all border border-[#fecaca] cursor-pointer"
                                    title="Remove Image"
                                >
                                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            </div>

                            <div>
                                {detections.length > 0 ? (
                                    <div>
                                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                                            <h3 className="text-base sm:text-lg font-bold text-[#0f172a]">Detection Results</h3>
                                            <span className="py-1 px-2.5 sm:px-3 bg-[#eff6ff] text-[#2563eb] rounded-2xl text-[10px] sm:text-xs font-semibold">
                                                {detections.length} Objects
                                            </span>
                                        </div>
                                        <div className="overflow-x-auto rounded-[10px] border border-[#e2e8f0]">
                                            <table className="w-full border-collapse text-xs sm:text-sm">
                                                <thead className="bg-[#f8fafc]">
                                                    <tr>
                                                        <th
                                                            onClick={() => handleSort('class_name')}
                                                            className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-left font-semibold text-[#475569] text-[10px] sm:text-xs uppercase tracking-wide cursor-pointer hover:bg-[#f1f5f9] select-none"
                                                        >
                                                            Object <span className="ml-1 sm:ml-1.5 opacity-40">▼</span>
                                                        </th>
                                                        <th
                                                            onClick={() => handleSort('confidence')}
                                                            className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-left font-semibold text-[#475569] text-[10px] sm:text-xs uppercase tracking-wide cursor-pointer hover:bg-[#f1f5f9] select-none"
                                                        >
                                                            Confidence <span className="ml-1 sm:ml-1.5 opacity-40">▼</span>
                                                        </th>
                                                        <th
                                                            onClick={() => handleSort('bbox')}
                                                            className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-left font-semibold text-[#475569] text-[10px] sm:text-xs uppercase tracking-wide cursor-pointer hover:bg-[#f1f5f9] select-none"
                                                        >
                                                            <span className="hidden sm:inline">Bounding Box</span>
                                                            <span className="sm:hidden">BBox</span>
                                                            <span className="ml-1 sm:ml-1.5 opacity-40">▼</span>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sortedDetections.map((detection, idx) => (
                                                        <tr key={idx} className="hover:bg-[#f8fafc]">
                                                            <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 border-t border-[#e2e8f0] text-[#334155]">
                                                                <span className="inline-flex items-center py-0.5 sm:py-1 px-1.5 sm:px-2.5 bg-[#f1f5f9] text-[#475569] rounded-md font-medium text-[10px] sm:text-xs">
                                                                    {detection.class_name}
                                                                </span>
                                                            </td>
                                                            <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 border-t border-[#e2e8f0] text-[#334155]">
                                                                <div className="flex items-center gap-1.5 sm:gap-2.5">
                                                                    <div className="flex-1 h-1 sm:h-1.5 bg-[#e2e8f0] rounded-sm overflow-hidden">
                                                                        <div
                                                                            className="h-full rounded-sm transition-all"
                                                                            style={{
                                                                                width: `${detection.confidence * 100}%`,
                                                                                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <span className="font-semibold text-[#0f172a] text-[10px] sm:text-xs min-w-[35px] sm:min-w-[45px]">
                                                                        {Math.round(detection.confidence * 100)}%
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 border-t border-[#e2e8f0] text-[#334155]">
                                                                <span className="font-mono text-[9px] sm:text-xs text-[#64748b]">
                                                                    ({detection.bbox.map(v => Math.round(v)).join(', ')})
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : !isDetecting ? (
                                    <div className="text-center py-8 sm:py-12 text-[#94a3b8]">
                                        <Upload className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-[#cbd5e1]" strokeWidth={1.5} />
                                        <p className="text-xs sm:text-sm">Detection results will appear here</p>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )}
                </section>

                {detections.length > 0 && (
                    <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-[#e2e8f0]">
                        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                            }}>
                                <MessageCircle className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-white" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-[17px] font-bold text-[#0f172a] tracking-tight">Ask Questions About Results</h3>
                                <p className="text-xs sm:text-sm text-[#64748b]">Powered by Gemini</p>
                            </div>
                        </div>

                        <div
                            ref={chatContainerRef}
                            className="h-64 sm:h-80 overflow-y-auto mb-4 sm:mb-5 p-3 sm:p-4 bg-[#f8fafc] rounded-[10px] border border-[#e2e8f0]"
                        >
                            {chatMessages.length === 0 ? (
                                <div className="text-center py-12 sm:py-20 text-[#94a3b8]">
                                    <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-[#cbd5e1]" strokeWidth={1.5} />
                                    <p className="text-xs sm:text-sm">Ask a question about the detected objects to get started</p>
                                </div>
                            ) : (
                                chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`mb-3 sm:mb-4 flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-semibold flex-shrink-0 ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-[#ec4899] to-[#be185d]'
                                            : 'bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed]'
                                            }`}>
                                            {msg.role === 'user' ? getInitials(user.full_name || user.email) : 'AI'}
                                        </div>
                                        <div className={`max-w-[75%] py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-[#2563eb] text-white rounded-br-sm'
                                            : 'bg-white text-[#334155] border border-[#e2e8f0] rounded-bl-sm'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex gap-2 sm:gap-3">
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                                placeholder="Ask a question about the detected objects..."
                                className="flex-1 py-2.5 sm:py-3 px-3 sm:px-[18px] border-[1.5px] border-[#e2e8f0] rounded-[10px] text-xs sm:text-sm transition-all focus:outline-none focus:border-[#8b5cf6] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
                                disabled={isAsking}
                            />
                            <button
                                onClick={handleAskQuestion}
                                disabled={isAsking || !question.trim()}
                                className="py-2.5 sm:py-3 px-4 sm:px-6 text-white border-none rounded-[10px] text-xs sm:text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}
                            >
                                {isAsking ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const VoiceAssistant = () => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef(null);
    const navigate = useNavigate();

    // Initialize Speech Recognition once
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported in this browser');
            setIsSupported(false);
            return;
        }

        setIsSupported(true);

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) {
                    // ignore
                }
            }
        };
    }, []);

    const handleCommand = useCallback((command) => {
        const cmd = command.toLowerCase().trim();
        console.log('Voice Command:', cmd);

        if (cmd.includes('dashboard') || cmd.includes('home')) {
            navigate('/');
            toast.success('🏠 Navigating to Dashboard');
        } else if (cmd.includes('attendance') || cmd.includes('attend')) {
            navigate('/attendance');
            toast.success('📋 Showing Attendance');
        } else if (cmd.includes('employee') || cmd.includes('staff') || cmd.includes('team')) {
            navigate('/employees');
            toast.success('👥 Opening Employees');
        } else if (cmd.includes('ops') || cmd.includes('operations') || cmd.includes('strategic')) {
            navigate('/ops');
            toast.success('⚡ Navigating to Strategic Ops');
        } else if (cmd.includes('salary') || cmd.includes('pay')) {
            navigate('/salary');
            toast.success('💰 Opening Salary Hub');
        } else if (cmd.includes('leave') || cmd.includes('vacation')) {
            navigate('/leaves');
            toast.success('🏖️ Opening Leaves');
        } else if (cmd.includes('message') || cmd.includes('chat')) {
            navigate('/messages');
            toast.success('💬 Opening Messages');
        } else if (cmd.includes('advance') || cmd.includes('loan')) {
            navigate('/advance');
            toast.success('💳 Opening Advance');
        } else if (cmd.includes('calendar')) {
            navigate('/calendar');
            toast.success('📅 Opening Calendar');
        } else if (cmd.includes('task') || cmd.includes('work')) {
            navigate('/tasks');
            toast.success('📝 Opening Tasks');
        } else if (cmd.includes('setting') || cmd.includes('config')) {
            navigate('/settings');
            toast.success('⚙️ Opening Settings');
        } else if (cmd.includes('profile')) {
            navigate('/profile');
            toast.success('👤 Opening Profile');
        } else {
            toast.warn(`❓ Unknown command: "${command}"`);
        }
    }, [navigate]);

    const startListening = useCallback(() => {
        if (!recognitionRef.current) {
            toast.error('Voice recognition not available');
            return;
        }

        // Check microphone permission
        if (navigator.permissions) {
            navigator.permissions.query({ name: 'microphone' }).then((result) => {
                if (result.state === 'denied') {
                    toast.error('Microphone access is denied. Please enable it in browser settings.');
                    return;
                }
            }).catch(() => {
                // permissions API not fully supported, proceed anyway
            });
        }

        try {
            const recognition = recognitionRef.current;

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setIsListening(false);
                handleCommand(transcript);
            };

            recognition.onerror = (event) => {
                setIsListening(false);
                console.error('Speech recognition error:', event.error);

                switch (event.error) {
                    case 'not-allowed':
                        toast.error('🎤 Microphone access denied. Please allow microphone permission.');
                        break;
                    case 'no-speech':
                        toast.info('🎤 No speech detected. Try again.');
                        break;
                    case 'network':
                        toast.error('🌐 Network error. Speech recognition requires internet.');
                        break;
                    case 'aborted':
                        // User cancelled, no need to show error
                        break;
                    default:
                        toast.error(`🎤 Error: ${event.error}`);
                }
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.start();
            setIsListening(true);
            toast.info('🎤 Listening... Say a command like "dashboard", "attendance", "salary"', { autoClose: 3000 });
        } catch (error) {
            setIsListening(false);
            console.error('Failed to start speech recognition:', error);

            if (error.message?.includes('already started')) {
                recognitionRef.current.stop();
                setTimeout(() => {
                    try {
                        recognitionRef.current.start();
                        setIsListening(true);
                    } catch (e) {
                        toast.error('🎤 Please try again');
                    }
                }, 300);
            } else {
                toast.error('🎤 Could not start voice recognition. Check microphone permissions.');
            }
        }
    }, [handleCommand]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // ignore
            }
        }
        setIsListening(false);
    }, []);

    if (!isSupported) return null;

    return (
        <button
            onClick={isListening ? stopListening : startListening}
            className={`fixed bottom-8 right-8 z-50 p-4 rounded-full shadow-2xl transition-all duration-500 active:scale-90 group ${isListening
                    ? 'bg-rose-500 animate-pulse shadow-rose-500/40 scale-110'
                    : 'bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-105'
                }`}
            title={isListening ? 'Stop listening' : 'Voice Control - Say a command'}
        >
            {isListening ? (
                <MicOff className="w-6 h-6 text-white" />
            ) : (
                <Mic className="w-6 h-6 text-white" />
            )}

            {/* Ripple effect when listening */}
            {isListening && (
                <>
                    <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-30" />
                    <span className="absolute inset-[-4px] rounded-full border-2 border-rose-400 animate-pulse opacity-50" />
                </>
            )}

            {/* Tooltip */}
            <div className="absolute -top-14 right-0 bg-white dark:bg-gray-800 px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-primary-600 shadow-lg">
                {isListening ? '🔴 Listening...' : '🎤 Voice Control'}
            </div>
        </button>
    );
};

export default VoiceAssistant;

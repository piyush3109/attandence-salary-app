import React, { useState, useEffect } from 'react';
import { Mic, MicOff, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const VoiceAssistant = () => {
    const [isListening, setIsListening] = useState(false);
    const navigate = useNavigate();
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    const startListening = () => {
        setIsListening(true);
        recognition.start();
        toast.info('Listening for HR commands...', { autoClose: 2000 });
    };

    recognition.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        setIsListening(false);
        console.log('Voice Command:', command);

        if (command.includes('dashboard')) {
            navigate('/');
            toast.success('Navigating to Dashboard');
        } else if (command.includes('attendance')) {
            navigate('/attendance');
            toast.success('Showing Attendance');
        } else if (command.includes('ops') || command.includes('operations')) {
            navigate('/ops');
            toast.success('Navigating to Strategic Ops');
        } else if (command.includes('salary')) {
            navigate('/salary');
            toast.success('Opening Salary hub');
        } else {
            toast.warn(`Unknown command: "${command}"`);
        }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    return (
        <button
            onClick={startListening}
            className={`fixed bottom-8 right-8 z-50 p-4 rounded-full shadow-2xl transition-all duration-500 scale-100 active:scale-90 ${isListening ? 'bg-rose-500 animate-pulse' : 'bg-primary-600 hover:bg-primary-700'
                }`}
        >
            {isListening ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
            <div className="absolute -top-12 right-0 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap text-[10px] font-black uppercase text-primary-600">
                Voice Control
            </div>
        </button>
    );
};

export default VoiceAssistant;

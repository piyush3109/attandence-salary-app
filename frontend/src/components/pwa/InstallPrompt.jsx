import React, { useState, useEffect } from 'react';
import { X, Download, Monitor, Smartphone, Share } from 'lucide-react';

const InstallPrompt = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [installing, setInstalling] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if user has dismissed the prompt before
        const dismissed = localStorage.getItem('install-prompt-dismissed');
        const dismissedTime = dismissed ? parseInt(dismissed) : 0;
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

        // Show again after 7 days
        if (dismissed && daysSinceDismissed < 7) {
            return;
        }

        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(isIOSDevice);

        // For non-iOS, listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show prompt after a brief delay for better UX
            setTimeout(() => setShowPrompt(true), 2000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // For iOS, show custom instructions after delay
        if (isIOSDevice) {
            setTimeout(() => setShowPrompt(true), 3000);
        }

        // Listen for successful installation
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        setInstalling(true);
        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                setShowPrompt(false);
                setIsInstalled(true);
            }
        } catch (err) {
            console.error('Install error:', err);
        } finally {
            setInstalling(false);
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('install-prompt-dismissed', Date.now().toString());
    };

    if (!showPrompt || isInstalled) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                {/* Header Gradient */}
                <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-blue-600 p-8 text-center relative overflow-hidden">
                    {/* Decorative circles */}
                    <div className="absolute top-[-20px] left-[-20px] w-32 h-32 bg-white/10 rounded-full" />
                    <div className="absolute bottom-[-10px] right-[-10px] w-24 h-24 bg-white/10 rounded-full" />

                    <div className="relative z-10">
                        <div className="w-16 h-16 mx-auto bg-white/20 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center mb-4 shadow-xl rotate-6 hover:rotate-0 transition-transform duration-300">
                            <Download className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-1">Install Our App</h3>
                        <p className="text-primary-100 text-sm font-medium">Get quick access from your home screen</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isIOS ? (
                        /* iOS Instructions */
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium text-center mb-4">
                                Install this app on your iPhone for quick access
                            </p>

                            <div className="space-y-3">
                                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Share className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">Step 1</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Tap the Share button in Safari</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Monitor className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">Step 2</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Scroll down and tap "Add to Home Screen"</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Smartphone className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">Step 3</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Tap "Add" to install</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Android / Desktop */
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                    <p className="text-2xl mb-1">⚡</p>
                                    <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Fast Access</p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                    <p className="text-2xl mb-1">🔔</p>
                                    <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Notifications</p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                    <p className="text-2xl mb-1">📱</p>
                                    <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">App-like</p>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center font-medium">
                                Works offline • No app store needed • Lightweight
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleDismiss}
                            className="flex-1 py-3.5 px-4 rounded-2xl text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                        >
                            Not Now
                        </button>

                        {!isIOS && deferredPrompt && (
                            <button
                                onClick={handleInstall}
                                disabled={installing}
                                className="flex-1 py-3.5 px-4 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {installing ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        Install App
                                    </>
                                )}
                            </button>
                        )}

                        {isIOS && (
                            <button
                                onClick={handleDismiss}
                                className="flex-1 py-3.5 px-4 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg shadow-primary-500/30 transition-all"
                            >
                                Got It!
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;

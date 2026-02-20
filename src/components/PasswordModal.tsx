import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

interface PasswordModalProps {
    onPasswordSubmit: (password: string) => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ onPasswordSubmit }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) {
            setError('Veuillez entrer un mot de passe');
            return;
        }
        onPasswordSubmit(password);
    };

    useEffect(() => {
        // Focus on input when modal opens
        const input = document.getElementById('password-input');
        if (input) input.focus();
    }, []);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md border border-zinc-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
                        <Lock className="text-zinc-900" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900">Authentification requise</h2>
                        <p className="text-sm text-zinc-500">Entrez le mot de passe pour accéder aux données</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="password-input" className="block text-sm font-medium text-zinc-700 mb-2">
                            Mot de passe
                        </label>
                        <input
                            id="password-input"
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            className="w-full px-4 py-3 rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all"
                            placeholder="••••••••"
                        />
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-zinc-900 text-white py-3 rounded-md font-semibold hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
                    >
                        Valider
                    </button>
                </form>

                <p className="text-xs text-zinc-400 mt-4 text-center">
                    Le mot de passe sera stocké uniquement en mémoire pour cette session
                </p>
            </div>
        </div>
    );
};

export default PasswordModal;

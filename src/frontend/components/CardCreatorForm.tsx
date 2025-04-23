import React, { useState } from 'react';

// Potremmo definire un tipo specifico per i dati del form
interface CardFormData {
    dbId: string;
    nome: string;
    attacco: string; // Usiamo stringhe per i campi input
    vita: string;
    tempoSchieramento: string;
    velocitaAttacco: string;
}

const CardCreatorForm: React.FC = () => {
    const [formData, setFormData] = useState<CardFormData>({
        dbId: '', nome: '', attacco: '', vita: '', tempoSchieramento: '', velocitaAttacco: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            const response = await fetch('http://localhost:3001/api/cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                 // Usa il messaggio di errore dal backend se disponibile
                throw new Error(result.error || `Errore server: ${response.status}`);
            }

            setSubmitMessage({ type: 'success', text: `Carta "${result.nome}" creata con successo!` });
            // Resetta il form dopo successo
            setFormData({ dbId: '', nome: '', attacco: '', vita: '', tempoSchieramento: '', velocitaAttacco: '' });
            // Qui dovresti anche triggerare un refresh della lista carte nel componente padre (App.tsx)
        } catch (error: any) {
            setSubmitMessage({ type: 'error', text: error.message || 'Errore sconosciuto durante la creazione.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h3>Crea Nuova Carta</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px'}}>
                <input type="text" name="dbId" placeholder="ID Unico (es. goblin_v2)" value={formData.dbId} onChange={handleChange} required />
                <input type="text" name="nome" placeholder="Nome Carta" value={formData.nome} onChange={handleChange} required />
                <input type="number" name="attacco" placeholder="Attacco" value={formData.attacco} onChange={handleChange} required min="0"/>
                <input type="number" name="vita" placeholder="Vita" value={formData.vita} onChange={handleChange} required min="1"/>
                <input type="number" name="tempoSchieramento" placeholder="Tempo Schieramento (tick)" value={formData.tempoSchieramento} onChange={handleChange} required min="1"/>
                <input type="number" name="velocitaAttacco" placeholder="Velocità Attacco (tick)" value={formData.velocitaAttacco} onChange={handleChange} required min="1"/>
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creazione...' : 'Crea Carta'}
                </button>
                {submitMessage && (
                    <p style={{ color: submitMessage.type === 'success' ? 'green' : 'red' }}>
                        {submitMessage.text}
                    </p>
                )}
            </form>
        </div>
    );
};

export default CardCreatorForm;
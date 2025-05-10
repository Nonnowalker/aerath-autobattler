// src/frontend/components/CardCreatorForm.tsx
import React, { useState } from 'react';

interface CardCreatorFormProps {
    onCardCreated?: () => void; // Callback opzionale per aggiornare la lista
}

// Definizione Tipi Corretta
interface CardFormData {
    dbId: string;
    nome: string;
    tipo: 'Unità' | 'Potere'; // <--- CORRETTO
    attacco: string; // Stringhe dal form
    vita: string;
    punteggioPreparazioneIniziale: string;
    descrizioneAbilita: string;
}

const CardCreatorForm: React.FC<CardCreatorFormProps> = ({ onCardCreated }) => {
    const [formData, setFormData] = useState<CardFormData>({
        dbId: '',
        nome: '',
        tipo: 'Unità', // <--- CORRETTO (Default con accento)
        attacco: '',
        vita: '',
        punteggioPreparazioneIniziale: '',
        descrizioneAbilita: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Gestore specifico per il select per resettare ATK/VIT se si passa a Potere
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
         const newType = e.target.value as 'Unità' | 'Potere'; // <--- CORRETTO
         setFormData(prev => ({
             ...prev,
             tipo: newType,
             attacco: newType === 'Potere' ? '' : prev.attacco, // Resetta se è Potere
             vita: newType === 'Potere' ? '' : prev.vita,       // Resetta se è Potere
            }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitMessage(null);

         // Prepara i dati da inviare, parsando numeri e gestendo null/undefined
         const dataToSend = {
             dbId: formData.dbId,
             nome: formData.nome,
             tipo: formData.tipo, // Invia la stringa corretta ('Unità' o 'Potere')
             // Invia null se non applicabile (Potere) o se vuoto/non numero
             attacco: formData.tipo === 'Unità' && formData.attacco !== '' && !isNaN(parseInt(formData.attacco, 10))
                 ? parseInt(formData.attacco, 10)
                 : null,
             vita: formData.tipo === 'Unità' && formData.vita !== '' && !isNaN(parseInt(formData.vita, 10))
                 ? parseInt(formData.vita, 10)
                 : null,
             punteggioPreparazioneIniziale: !isNaN(parseInt(formData.punteggioPreparazioneIniziale, 10))
                 ? parseInt(formData.punteggioPreparazioneIniziale, 10)
                 : 0, // O gestisci l'errore se prep è obbligatorio
             descrizioneAbilita: formData.descrizioneAbilita || null, // Invia null se vuoto
         };


        try {
            // Verifica pre-invio per Unità (se richiede Att/Vit)
            if (dataToSend.tipo === 'Unità' && (dataToSend.attacco === null || dataToSend.vita === null)) {
                throw new Error("Per le Unità, Attacco e Vita sono obbligatori.");
            }
            // Verifica pre-invio preparazione
             if (dataToSend.punteggioPreparazioneIniziale <= 0) {
                 throw new Error("Il Punteggio Preparazione Iniziale deve essere maggiore di 0.");
             }

            const response = await fetch('http://localhost:3001/api/cards', { // URL API Backend
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });
            const result = await response.json();
            if (!response.ok) {
                 // Prova a usare il messaggio di errore dal backend
                 throw new Error(result.error || `Errore server: ${response.status}`);
            }

            setSubmitMessage({ type: 'success', text: `Carta "${result.nome}" creata con successo!` });
            // Reset form con valori di default
            setFormData({ dbId: '', nome: '', tipo: 'Unità', attacco: '', vita: '', punteggioPreparazioneIniziale: '', descrizioneAbilita: '' });
            // Chiama la callback per aggiornare la lista in App.tsx
            if (onCardCreated) {
                 onCardCreated();
             }
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
                {/* Campi Input */}
                <input type="text" name="dbId" placeholder="ID Unico (es. goblin_v2)" value={formData.dbId} onChange={handleInputChange} required />
                <input type="text" name="nome" placeholder="Nome Carta" value={formData.nome} onChange={handleInputChange} required />

                <label htmlFor="cardType">Tipo:</label>
                <select id="cardType" name="tipo" value={formData.tipo} onChange={handleTypeChange} required>
                    <option value="Unità">Unità</option> {/* <-- CORRETTO */}
                    <option value="Potere">Potere</option>
                </select>

                {/* Campi visibili solo per Unità */}
                {formData.tipo === 'Unità' && ( // <--- CORRETTO
                    <>
                       <input type="number" name="attacco" placeholder="Attacco" value={formData.attacco} onChange={handleInputChange} min="0"/>
                       <input type="number" name="vita" placeholder="Vita" value={formData.vita} onChange={handleInputChange} min="1"/>
                    </>
                )}

                <input type="number" name="punteggioPreparazioneIniziale" placeholder="Preparazione Iniziale" value={formData.punteggioPreparazioneIniziale} onChange={handleInputChange} required min="1"/>
                <textarea name="descrizioneAbilita" placeholder="Descrizione Abilità (opzionale)" value={formData.descrizioneAbilita} onChange={handleInputChange} rows={3}/>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creazione...' : 'Crea Carta'}
                </button>
                {/* Messaggio Risultato */}
                {submitMessage && (
                    <p style={{ color: submitMessage.type === 'success' ? 'green' : 'red', marginTop: '10px' }}>
                        {submitMessage.text}
                    </p>
                )}
            </form>
        </div>
    );
};

export default CardCreatorForm;
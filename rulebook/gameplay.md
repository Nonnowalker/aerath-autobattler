# Undertow - Regolamento Base (Versione 1.4)

---

## 1. Inizio Turno

- Il sistema determina casualmente quale giocatore inizia.
- Entrambi i giocatori schierano:
  - Eroe
  - Equipaggiamenti associati
- Risoluzione immediata di eventuali effetti "inizio battaglia".
- Fase di pesca:
  - Ogni giocatore pesca 1 carta.
  - **Eccezione**: il primo giocatore salta la prima pesca.

## 2. Pesca Carte

- All'inizio del proprio turno, il giocatore attivo pesca 1 carta.
- Massimo 7 carte in mano.
- Se a fine turno ci sono più di 7 carte:
  - Scartare automaticamente le carte con più alto punteggio di Preparazione.
  - A parità, scartare la carta più a destra.

## 3. Sottrazione Preparazione e Giocata Carte

- Sottrarre 1 al punteggio di Preparazione di ogni carta in mano.
- Carte che raggiungono 0:
  - **Unità**: schierata automaticamente nello slot libero più a sinistra.
  - **Potere**: lanciato immediatamente se le condizioni di bersaglio sono soddisfatte.
- Se il campo è pieno (7 unità):
  - Le unità pronte restano in mano a 0 Preparazione e tenteranno di essere schierate ogni turno successivo.
- Se un Potere non ha bersagli validi:
  - Rimane in mano a 0 Preparazione e tenterà di essere lanciato a ogni fase di Giocata Carte.

## 4. Risoluzione Attacchi/Difese

- Gli attacchi si risolvono da **sinistra a destra**.
- Ogni unità attacca:
  - L'unità nemica nello slot opposto.
  - Se lo slot opposto è vuoto, attacca l'Eroe nemico.
- L'Eroe attacca insieme alle unità.
- Nessun contrattacco automatico.
- Alcune abilità (es. Rappresaglia) possono attivarsi subendo danno.
- I Poteri sono lanciati dall'Eroe, non occupano slot.

## 5. Gestione Morti / Effetti di Campo

- Quando un'unità muore:
  - Rimuoverla immediatamente dal campo.
  - Attivare eventuali effetti "On Death".
  - Subito dopo ogni morte, far scalare verso sinistra tutte le unità a destra della posizione liberata.
- Se un Eroe raggiunge 0 HP, la partita termina immediatamente.

## 6. Controllo Vittoria

- Se un Eroe scende a 0 o meno HP:
  - Partita terminata.
  - Il suo avversario vince immediatamente.
- Nessuna possibilità di pareggio naturale.

## 7. Regola della Fatica

- Se un giocatore deve pescare e il mazzo è vuoto:
  - Subisce danno da Fatica.
  - Danno cumulativo:
    - Prima pescata fallita: 1 danno.
    - Seconda: 2 danni.
    - Terza: 3 danni.
    - Etc.
- Il Contatore di Fatica è separato per ogni giocatore.

---

# Schema di Turno Sintetico

1. Determinazione primo giocatore.
2. Schieramento Eroi ed Equipaggiamenti.
3. Risoluzione effetti "inizio battaglia".
4. Pesca carta (se consentito).
5. Sottrazione Preparazione.
6. Gioco automatico delle carte a 0 Preparazione.
7. Risoluzione Attacchi/Difese.
8. Gestione Morti e scorrimento campo dopo ogni morte.
9. Controllo Vittoria.
10. Fine turno / Passaggio al turno successivo.

---

# Dettagli Aggiuntivi

- **Mano del Giocatore**: rappresentata da carte con dorso visibile, ogni carta mostra il tempo di preparazione residuo e il nome.
- **Unità ed Eroi sul Campo**: mostrano nome, attacco base (es. 2* = 2 danni), punti vita e affiliazioni.
- **Affiliazioni**: ruolo (es. Supporto) / fazione (es. Celestiale) / razza (es. Umano).
- **Parole Chiave**: abilità passive o modificatori come "ARMATURA (2)" o "BENEDIZIONE (2)", espandibili.
- **Equipaggiamenti**:
  - Schierati all'inizio della partita insieme all'Eroe.
  - Conferiscono bonus passivi o abilità speciali.
  - Non occupano slot di campo.
  - Ogni Equipaggiamento richiede un Livello minimo dell'Eroe per essere equipaggiato.
  - Un Eroe può equipaggiare solo equipaggiamenti del suo Livello o inferiore.
- **Livello dell'Eroe e Progressione**:
  - Ogni Eroe ha un Livello massimo determinato dalla sua rarità:
    - Comune: fino al Livello 4.
    - Non Comune: fino al Livello 6.
    - Raro: fino al Livello 8.
    - Leggendario: fino al Livello 10.
  - A ogni aumento di livello:
    - Incrementano i Punti Vita.
    - Aumenta il numero massimo di carte nel mazzo.
  - Ogni 2 livelli si sblocca uno slot Equipaggiamento:
    - Livello 2: Pozione (temporanea).
    - Livello 4: Arma principale.
    - Livello 6: Arma secondaria.
    - Livello 8: Armatura.
    - Livello 10: Elmo.
  - L'Amuleto sarà riservato agli Eroi Mitici (definizioni future).
- **Log di Partita**: due modalità previste:
  - Semplificato: eventi principali.
  - Dettagliato: ogni singola azione, compatibile con tecnologie assistive.
- **Prevedibilità e solidità dell'esito garantite**.
- **Scalamento del campo**: automatico dopo ogni morte.
- **Poteri**: lanciati dall'Eroe, controllano la presenza di bersagli a ogni fase di Giocata Carte.

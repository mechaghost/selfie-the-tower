import { useGameStore } from '../../store/gameStore';
import { EventChoice } from '../../data/events';
import { eightiesIcon } from '../ui/EightiesIcons';
import { Zap, DollarSign, Trash2, PlusCircle, Heart, ArrowRight, HelpCircle } from 'lucide-react';
import './MysteryEventView.css';

/** Pick a lucide icon that fits the choice's primary effect */
function choiceIcon(choice: EventChoice) {
    const firstEffect = choice.effects[0];
    if (!firstEffect) return <HelpCircle size={16} />;

    switch (firstEffect.type) {
        case 'heal':
        case 'healFull':
        case 'healPercent':
            return <Heart size={16} />;
        case 'damage':
            return <Zap size={16} />;
        case 'gold':
            return (firstEffect.amount ?? 0) > 0
                ? <DollarSign size={16} />
                : <DollarSign size={16} />;
        case 'removeRandomCard':
            return <Trash2 size={16} />;
        case 'addRandomCard':
            return <PlusCircle size={16} />;
        case 'loseMaxHp':
            return <Zap size={16} />;
        case 'nothing':
        default:
            return <ArrowRight size={16} />;
    }
}

/** Map event ID to a decorative 80s icon index */
function eventDecoIcon(eventId: string): number {
    const map: Record<string, number> = {
        boombox_oracle: 0,   // boombox
        neon_graffiti: 15,   // star
        arcade_machine: 7,   // joystick
        back_alley_ramen: 3, // crt_tv
        vinyl_dealer: 1,     // cassette
    };
    return map[eventId] ?? 4; // disco_ball fallback
}

export function MysteryEventView() {
    const {
        currentEvent,
        eventOutcome,
        player,
        chooseEventOption,
        dismissNodeEvent,
    } = useGameStore(state => ({
        currentEvent: state.currentEvent,
        eventOutcome: state.eventOutcome,
        player: state.player,
        chooseEventOption: state.chooseEventOption,
        dismissNodeEvent: state.dismissNodeEvent,
    }));

    if (!currentEvent) return null;

    const meetsCondition = (condition?: EventChoice['condition']): boolean => {
        if (!condition) return true;
        if (condition === 'hasGold50') return player.gold >= 50;
        if (condition === 'hasGold40') return player.gold >= 40;
        return true;
    };

    const visibleChoices = currentEvent.choices.filter(c => meetsCondition(c.condition));

    return (
        <div className="mystery-container">
            <div className="mystery-content">
                {/* Decorative 80s icon */}
                <img
                    src={eightiesIcon(eventDecoIcon(currentEvent.id))}
                    alt=""
                    className="mystery-icon-decor"
                />

                <h1 className="mystery-title">{currentEvent.title}</h1>

                <p className="mystery-description">{currentEvent.description}</p>

                {!eventOutcome ? (
                    <div className="mystery-choices">
                        {visibleChoices.map(choice => (
                            <button
                                key={choice.id}
                                className="mystery-choice"
                                onClick={() => chooseEventOption(choice.id)}
                            >
                                <span className="mystery-choice-label">
                                    {choiceIcon(choice)}
                                    {choice.label}
                                </span>
                                <span className="mystery-choice-desc">{choice.description}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="mystery-outcome">
                        <p className="mystery-outcome-text">{eventOutcome}</p>
                        <button
                            className="mystery-continue-btn"
                            onClick={dismissNodeEvent}
                        >
                            Continue
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

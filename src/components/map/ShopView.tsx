import { useState, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Card } from '../../core/models';
import { Store, Coins, Flame, LogOut, ShoppingCart } from 'lucide-react';
import { eightiesIcon } from '../ui/EightiesIcons';
import './ShopView.css';

interface ConfirmState {
    type: 'buy' | 'remove';
    card: Card;
    price: number;
}

export function ShopView() {
    const {
        player,
        shopCards,
        shopPrices,
        cardRemovalCost,
        masterDeck,
        buyCard,
        removeCard,
        dismissNodeEvent,
    } = useGameStore();

    const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
    const [showRemovalPicker, setShowRemovalPicker] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 1800);
    }, []);

    const handleCardClick = (card: Card) => {
        const price = shopPrices[card.instanceId];
        if (price == null || player.gold < price) return;
        setConfirmState({ type: 'buy', card, price });
    };

    const handleConfirmBuy = () => {
        if (!confirmState || confirmState.type !== 'buy') return;
        buyCard(confirmState.card.instanceId, confirmState.price);
        setConfirmState(null);
        showToast('Pleasure doing biz.');
    };

    const handleRemovalClick = () => {
        if (player.gold < cardRemovalCost) return;
        setShowRemovalPicker(true);
    };

    const handleRemoveCard = (card: Card) => {
        setConfirmState({ type: 'remove', card, price: cardRemovalCost });
    };

    const handleConfirmRemove = () => {
        if (!confirmState || confirmState.type !== 'remove') return;
        removeCard(confirmState.card.instanceId);
        setConfirmState(null);
        setShowRemovalPicker(false);
        showToast('Torched. Good riddance.');
    };

    const canAffordRemoval = player.gold >= cardRemovalCost;

    return (
        <div className="shop-container">
            <div className="shop-scanlines" />

            {/* --- Header --- */}
            <div className="shop-header">
                <h1 className="shop-neon-sign">
                    <Store size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                    The Neon Bazaar
                </h1>
                <p className="shop-tagline">Cash talks. Everything else walks.</p>
                <div className="shop-gold-display">
                    <Coins size={20} className="shop-gold-icon" />
                    <span>{player.gold}g</span>
                </div>
            </div>

            {/* --- Cards for sale --- */}
            <div className="shop-section">
                <h2 className="shop-section-title">
                    <ShoppingCart size={16} />
                    Cards for Sale
                </h2>

                {shopCards.length > 0 ? (
                    <div className="shop-cards-row">
                        {shopCards.map(card => {
                            const price = shopPrices[card.instanceId] ?? 0;
                            const canAfford = player.gold >= price;
                            return (
                                <div
                                    key={card.instanceId}
                                    className={`shop-card-slot ${!canAfford ? 'shop-card-slot--broke' : ''}`}
                                    onClick={() => handleCardClick(card)}
                                >
                                    <div className={`shop-card-preview type-${card.type.toLowerCase()} ${!canAfford ? 'shop-card-preview--broke' : ''}`}>
                                        <div className="shop-card-cost">{card.cost}</div>
                                        <div className="shop-card-name">{card.name}</div>
                                        {(card.imageUrl || card.imageId) ? (
                                            <div className="shop-card-artwork-wrap">
                                                <img
                                                    src={card.imageUrl || `/assets/cards/${card.imageId}.webp`}
                                                    className="shop-card-artwork"
                                                    alt={card.name}
                                                />
                                                <div className="shop-card-type-badge">{card.type}</div>
                                            </div>
                                        ) : (
                                            <div className="shop-card-artwork-wrap" style={{ background: 'rgba(255,255,255,0.03)' }} />
                                        )}
                                        <div className="shop-card-desc">{card.description}</div>
                                    </div>

                                    <div className={`shop-price-tag ${!canAfford ? 'shop-price-tag--broke' : ''}`}>
                                        <Coins size={14} className="shop-price-icon" />
                                        {price}g
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="shop-broke-hint">Sold out. You cleaned me out, champ.</p>
                )}
            </div>

            {/* --- Card removal --- */}
            <div className="shop-removal">
                <h2 className="shop-section-title">
                    <Flame size={16} />
                    Services
                </h2>

                <div
                    className={`shop-removal-offer ${!canAffordRemoval ? 'shop-removal-offer--broke' : ''}`}
                    onClick={handleRemovalClick}
                >
                    <div className="shop-removal-info">
                        <div className="shop-removal-title">
                            <Flame size={16} />
                            Torch a Card
                        </div>
                        <div className="shop-removal-desc">
                            {canAffordRemoval
                                ? 'Burn the dead weight from your deck.'
                                : "Come back when you've got the scratch."}
                        </div>
                    </div>
                    <div className={`shop-price-tag ${!canAffordRemoval ? 'shop-price-tag--broke' : ''}`}>
                        <Coins size={14} className="shop-price-icon" />
                        {cardRemovalCost}g
                    </div>
                </div>
            </div>

            {/* --- Decorative 80s icon --- */}
            <div style={{ textAlign: 'center', padding: '0.5rem', opacity: 0.15 }}>
                <img src={eightiesIcon(1)} alt="" style={{ width: 32, height: 32 }} />
            </div>

            {/* --- Leave button --- */}
            <div className="shop-footer">
                <button className="shop-leave-btn" onClick={dismissNodeEvent}>
                    <LogOut size={18} />
                    I'm Out
                </button>
            </div>

            {/* --- Card removal picker overlay --- */}
            {showRemovalPicker && (
                <div className="shop-removal-overlay">
                    <div className="shop-removal-overlay-header">
                        <h2 className="shop-removal-overlay-title">Pick a Card to Torch</h2>
                        <p className="shop-removal-overlay-sub">
                            Choose a card to permanently remove from your deck ({cardRemovalCost}g)
                        </p>
                    </div>

                    <div className="shop-removal-grid">
                        {masterDeck.map(card => (
                            <div
                                key={card.instanceId}
                                className="shop-removal-card-slot"
                                onClick={() => handleRemoveCard(card)}
                            >
                                <div className={`shop-card-preview type-${card.type.toLowerCase()} ${card.isHeroCard ? 'hero-card' : ''}`}>
                                    <div className="shop-card-cost">{card.cost}</div>
                                    <div className="shop-card-name">{card.name}</div>
                                    {(card.imageUrl || card.imageId) ? (
                                        <div className="shop-card-artwork-wrap">
                                            <img
                                                src={card.imageUrl || `/assets/cards/${card.imageId}.webp`}
                                                className="shop-card-artwork"
                                                alt={card.name}
                                            />
                                            <div className="shop-card-type-badge">{card.type}</div>
                                        </div>
                                    ) : (
                                        <div className="shop-card-artwork-wrap" style={{ background: 'rgba(255,255,255,0.03)' }} />
                                    )}
                                    <div className="shop-card-desc">{card.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        className="shop-removal-cancel"
                        onClick={() => setShowRemovalPicker(false)}
                    >
                        Never Mind
                    </button>
                </div>
            )}

            {/* --- Confirm dialog --- */}
            {confirmState && (
                <div className="shop-confirm-overlay" onClick={() => setConfirmState(null)}>
                    <div className="shop-confirm-dialog" onClick={e => e.stopPropagation()}>
                        <h3 className="shop-confirm-title">
                            {confirmState.type === 'buy'
                                ? `Buy ${confirmState.card.name}?`
                                : `Torch ${confirmState.card.name}?`}
                        </h3>
                        <div className="shop-confirm-price">
                            <Coins size={18} />
                            {confirmState.price}g
                        </div>
                        <div className="shop-confirm-buttons">
                            <button
                                className="shop-confirm-btn shop-confirm-btn--buy"
                                onClick={confirmState.type === 'buy' ? handleConfirmBuy : handleConfirmRemove}
                            >
                                {confirmState.type === 'buy' ? 'Buy It' : 'Torch It'}
                            </button>
                            <button
                                className="shop-confirm-btn shop-confirm-btn--cancel"
                                onClick={() => setConfirmState(null)}
                            >
                                Nah
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Toast --- */}
            {toast && <div className="shop-toast">{toast}</div>}
        </div>
    );
}

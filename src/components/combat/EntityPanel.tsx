import { Entity } from '../../core/models';
import { Shield } from 'lucide-react';
import './EntityPanel.css';

interface EntityPanelProps {
    entity: Entity;
    isPlayer?: boolean;
}

export function EntityPanel({ entity, isPlayer }: EntityPanelProps) {
    const hpPercentage = (entity.hp / entity.maxHp) * 100;

    return (
        <div className={`entity-panel ${isPlayer ? 'player' : 'enemy'}`}>
            <div className="entity-avatar">
                {isPlayer ? '🛡️' : '👹'}
            </div>

            <div className="entity-info">
                <div className="entity-name">{entity.name}</div>

                {entity.block > 0 && (
                    <div className="entity-block">
                        <Shield size={16} /> <span>{entity.block}</span>
                    </div>
                )}

                <div className="hp-bar-container">
                    <div className="hp-text">{entity.hp} / {entity.maxHp}</div>
                    <div className="hp-bar-bg">
                        <div
                            className="hp-bar-fill"
                            style={{ width: `${hpPercentage}%` }}
                        />
                    </div>
                </div>

                <div className="status-container">
                    {entity.statuses.map(status => (
                        <div key={status.id} className={`status-icon ${status.id}`} title={status.name}>
                            {status.id === 'vulnerable' ? '💔' : '🛡️'} {status.amount}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

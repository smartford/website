import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  title: string;
  description: string;
  date?: string;
  overline?: string;
  imageSrc: string;
  onClick?: () => void;
  badge?: React.ReactNode;
  isFeatureBlock?: boolean;
  variant?: 'column' | 'row';   
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  date,
  overline,
  imageSrc,
  onClick,
  badge,
  isFeatureBlock,
  variant = 'column',
}) => {
  const classNames = [
    styles.card,
    variant === 'row' ? styles['variant-row'] : '',
    isFeatureBlock ? styles['feature-block'] : '',
  ].filter(Boolean).join(' ');

  return (
    <a className={classNames} onClick={onClick}>
      <div className={styles['card-thumb']} style={{ backgroundImage: `url(${imageSrc})` }} />
      {badge && <div className={styles['card-badge']}>{badge}</div>}
      <div className={styles['card-content']}>
        {date && <span className={styles['card-date']}>{date}</span>}
        {overline && <span className={styles['card-overline']}>{overline}</span>}
        <h3 className={styles['card-title']}>{title}</h3>
        <p className={styles['card-description']}>{description}</p>
      </div>
    </a>
  );
};

export const CardGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className={styles['card-grid']}>{children}</div>
);
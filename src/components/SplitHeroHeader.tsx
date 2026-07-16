import React from 'react';
import styles from '@smartford/components/SplitHeroHeader.module.css';
import { M3eButton } from '@m3e/react/button';

interface SplitHeroHeaderProps {
  header: string;
  description: string;
  showButton?: boolean;
  buttonText?: string;
  onButtonClick?: () => void;
  imageSrc: string;
  imageAlt: string;
}

export const SplitHeroHeader: React.FC<SplitHeroHeaderProps> = ({
  header,
  description,
  showButton = true,
  buttonText = "Get started",
  onButtonClick,
  imageSrc,
  imageAlt
}) => {
  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <h1 className={styles.header}>{header}</h1>
        <p className={styles.description}>{description}</p>
        
        {showButton && (
          <M3eButton 
            variant="filled" 
            size="large"
            onClick={onButtonClick}
          >
            {buttonText}
          </M3eButton>
        )}
      </div>

      <div className={styles.imageContainer}>
        <img loading="lazy" src={imageSrc} alt={imageAlt} />
      </div>
    </section>
  );
};
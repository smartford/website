import React from 'react';
import styles from './Footer.module.css';
import { M3eButton } from '@m3e/react/button';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.squiggle}>
        <svg aria-hidden="true" width="100%" height="8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <pattern id="squiggle-pattern" width="91" height="8" patternUnits="userSpaceOnUse">
            <path d="M114 4c-5.067 4.667-10.133 4.667-15.2 0S88.667-.667 83.6 4 73.467 8.667 68.4 4 58.267-.667 53.2 4 43.067 8.667 38 4 27.867-.667 22.8 4 12.667 8.667 7.6 4-2.533-.667-7.6 4s-10.133 4.667-15.2 0S-32.933-.667-38 4s-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0" stroke="var(--md-sys-color-outline-variant)" strokeLinecap="square" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#squiggle-pattern)" />
        </svg>
      </div>
      <div className={styles.container}>
        <div className={styles.main}>
          <div className={styles.about}>
            <div className={styles.logo}>
              <span>Smartford OS</span>
            </div>
            <p>
              SmartfordOS это PowerPoint OS, с красивым и энтуитивно-понятным дизайном. 
              Авторство пренадлежит Smartford Corporation (дочерняя компания TSD)
            </p>
          </div>
          <div className={styles.linksGroup}>
            <div className={styles.column}>
              <h3>Сообщество</h3>
              <div className={styles.links}>
                <M3eButton shape="rounded" variant="text" href="https://t.me/SmartfordOS" target="_blank" size="small">
                  Telegram
                </M3eButton>

                <M3eButton shape="rounded" variant="text" href="https://web.telegram.org/k/#-1072147542764" target="_blank" size="small">
                  Telegram (поддержка)
                </M3eButton>
                <M3eButton shape="rounded" variant="text" href="https://vk.ru/club236430266" target="_blank" size="small">
                  ВКонтакте
                </M3eButton>
                <M3eButton shape="rounded" variant="text" href="https://youtube.com/@SmartfordCo_official" target="_blank" size="small">
                  YouTube
                </M3eButton>
              </div>
            </div>
            <div className={styles.column}>
              <h3>Другое</h3>
              <div className={styles.links}>
                <M3eButton shape="rounded" variant="text" href="https://smartfordos-official.github.io/SmartfordCompany.github.io/index.html" target="_blank" size="small">
                  Другой сайт
                </M3eButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
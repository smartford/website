
import { useOutletContext } from 'react-router-dom';
import styles from './NotFound.module.css';

interface ContextType {
  isLeaving: boolean;
  handleAnimationEnd: (e: React.AnimationEvent) => void;
}

export function NotFound() {
  const { isLeaving, handleAnimationEnd } = useOutletContext<ContextType>();

  return (
    <div
      id="page-notfound"
      className={`page-view ${isLeaving ? 'leaving' : ''}`}
      onAnimationEnd={handleAnimationEnd}
    >

      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <h2 className={styles.errorCode}>404</h2>
          <p className={styles.errorMessage}>
            К сожалению, запрашиваемая страница не существует или была перемещена.
          </p>
          <p className={styles.errorHint}>
            Попробуйте вернуться на <a href="/">главную страницу</a> или воспользоваться навигацией.
          </p>
        </div>
      </div>
    </div>
  );
}
import { useOutletContext } from 'react-router-dom';
import { M3eShape } from '@m3e/react/shape';
import styles from './About.module.css';
import { Link } from 'react-router-dom';

interface ContextType {
  isLeaving: boolean;
  handleAnimationEnd: (e: React.AnimationEvent) => void;
}

export function About() {
  const { isLeaving, handleAnimationEnd } = useOutletContext<ContextType>();

  return (
    <div
      id="page-about"
      className={`page-view ${isLeaving ? 'leaving' : ''}`}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className={styles.container}>
        {}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>О нас</h1>
            <p className={styles.heroSubtitle}>
              История создания и развития Smartford Company
            </p>
          </div>
          <div className={styles.heroShapes}>
            <M3eShape 
              name="soft-burst" 
              className={`${styles.floatingShape} ${styles.shape1}`}
            />
            <M3eShape 
              name="9-sided-cookie" 
              className={`${styles.floatingShape} ${styles.shape2}`}
            />
            <M3eShape 
              name="4-leaf-clover" 
              className={`${styles.floatingShape} ${styles.shape3}`}
            />
          </div>
        </section>

        {}
        <section className={styles.content}>
          <div className={styles.sectionHeader}>
            <h2>Основное</h2>
          </div>

          <div className={styles.card}>
            <p>
              Компания <span className={styles.boldText}>Smartford Company</span> - была основана в 2021 году Андреем Грекболевичем (нынешним главным директором компании). Компания была специализирована на производcтво продуктов на основе Microsoft PowerPoint, однако долгое время наша компания была в абсолютном затишье, а об её продуктах никто не знал.
            </p>
          </div>

          <div className={styles.card}>
            <p>
              Все изменилось с 2024 года, когда началась разработка Smartford OS, позиционировавшая себя как аналог Shindows SG с более современным интерфейсом и дизайном. Мы старались сделать систему как можно лучше конкурента и прилаживали к этому все возможные усилия.
            </p>
          </div>

          <div className={styles.card}>
            <p>
              Спустя долгое время с начала разработки 31 августа 2025 года выходит первая официальная бета-версия системы, что значительно повысило интерес к нам как производителя ПО и в будущем привело к выпуску более доработанных бета-версий системы. Уже 1 декабря 2025 года выходит официальный релиз нашей ОС, что ознаменовало собой конец 1 стадии разработки (создание системы) и начало 2 стадии (дальнейшая разработка и улучшение). Вскоре в начале января 2026 года был анонсирован новый релиз Smartford OS 2.0 с более улучшенным интерфейсом и дизайном, а также повышенной функциональностью и добавлением новых приложений.
            </p>
            <p className={styles.highlight}>
              Мы продолжаем активно развивать и обновлять нашу ОС, узнать об новых обновлениях нашей ос можно на{' '}
              <Link to="/news" className={styles.link}>новостной странице</Link>
            </p>
          </div>

          {}
          <div className={styles.sectionHeader}>
            <h2>Сотрудничество с TSD Company и вхождение в состав концерна</h2>
          </div>

          <div className={styles.card}>
            <p>
              В сентябре 2024 года наша компания начала сотрудничать с корпорацией TSD Corporation. Это позволило получить двум компаниям взаимовыгодные отношения при которых они будут участвовать в разработке общих проектов и идей (в том числе и в разработке Smartford OS). Мы активно работаем над разработкой единой системы аккаунтов TSD для доступа к сервисам как в TriadeOS, так и в SmartfordOS.
            </p>
          </div>

          {}
          <div className={styles.sectionHeader}>
            <h2>Современный дизайнер и разработчик в нашей команде</h2>
          </div>

          <div className={styles.card}>
            <div className={styles.developerBlock}>
              <div className={styles.avatarWrapper}>
                <M3eShape name="9-sided-cookie" className={styles.avatarShape}>
                  <img
                    src="/images/avatars/nestor.jpg"
                    alt="Нестор"
                    className={styles.avatar}
                  />
                </M3eShape>
              </div>
              <div className={styles.developerInfo}>
                <p>
                  <span className={styles.boldText}>Нестор Ващенко</span> - человек, который помог в редизайне SmartfordOS и расширении функционала системы. Помимо SmartfordOS Нестор также активно занимается разработкой NestorOS, Shindows SG и прочими проектами.
                </p>
                <p>
                  Посмотреть его творчество можно{' '}
                  <a
                    href="https://www.youtube.com/channel/UCBPLuv8Z1XEYaVcR3lydQlA/videos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    здесь
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
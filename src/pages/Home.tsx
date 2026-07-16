import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { SplitHeroHeader } from '@smartford/components/SplitHeroHeader';
import { Card } from '@smartford/components/Card';
import styles from './Home.module.css';

interface ContextType {
  isLeaving: boolean;
  handleAnimationEnd: (e: React.AnimationEvent) => void;
}

interface NewsItem {
  id: number;
  title: string;
  author: string;
  description: string;
  date: string;
  preview_url: string;
}

const CACHE_KEY = 'smartford_news_cache';
const EXPIRY_KEY = 'smartford_news_expiry';

const getExpiryDate = () => {
  const now = new Date();
  const expiry = new Date(now);
  expiry.setHours(0, 0, 0, 0);
  if (now >= expiry) {
    expiry.setDate(expiry.getDate() + 1);
  }
  return expiry;
};

export function Home() {
  const { isLeaving, handleAnimationEnd } = useOutletContext<ContextType>();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        const expiry = localStorage.getItem(EXPIRY_KEY);
        const now = new Date();

        if (cached && expiry && new Date(expiry) > now) {
          const parsed = JSON.parse(cached);
          setNews(parsed);
          setLoading(false);
          return;
        }

        const hostname = window.location.hostname;
        const isLocal = hostname === 'localhost' || hostname === 'smartfordos.vercel.app';
        let url = '/api/v1/news/get?count=3&sort_by=newest';
        if (isLocal) {
          url += '&is_it_local_host_server=true';
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error('Ошибка загрузки новостей');
        const data = await res.json();
        const newsData = data.data || [];

        localStorage.setItem(CACHE_KEY, JSON.stringify(newsData));
        const expiryDate = getExpiryDate();
        localStorage.setItem(EXPIRY_KEY, expiryDate.toISOString());

        setNews(newsData);
        setError(null);
      } catch (err) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setNews(parsed);
            setError('Не удалось обновить новости, показываем сохранённые.');
          } catch {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
          }
        } else {
          setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const firstNews = news.length > 0 ? news[0] : null;
  const restNews = news.slice(1);

return (
    <div
      id="page-home"
      className={`page-view ${isLeaving ? 'leaving' : ''}`}
      onAnimationEnd={handleAnimationEnd}
    >
      <SplitHeroHeader
        header="SmartfordOS"
        description="SmartfordOS - система от Smartford Company, с прекрасным дизайном и интерфейсом"
        buttonText="Скачать"
        onButtonClick={() => navigate('/download')}
        imageSrc="/news/4/4.png"
        imageAlt="SMOS2 Preview"
      />

      <div className="containercards">
        <h2 style={{
          fontFamily: "'Google Sans', 'Roboto', sans-serif",
          fontSize: '33px',
          marginLeft: '32px',
          lineHeight: 1
        }}>
          Актуальные новости SmartfordOS
        </h2>

        {!loading && error && <p style={{ padding: '0 24px', color: 'orange' }}>{error}</p>}
        
        {!loading && !error && news.length === 0 && (
          <p style={{ padding: '0 24px' }}>Новостей пока нет</p>
        )}

        {}
        {!loading && !error && firstNews && (
          <div className={`${styles.contentWrapper} ${styles.contentAppear}`}>
            <div className={styles.rowWrapper}>
              <Card
                key={firstNews.id}
                title={firstNews.title}
                description={firstNews.description}
                date={formatDate(firstNews.date)}
                imageSrc={firstNews.preview_url}
                variant="row"
                onClick={() => navigate(`/news/${firstNews.id}`)}
              />
            </div>

            {restNews.length > 0 && (
              <div className={styles.newsGridColumns}>
                {restNews.map((item) => (
                  <Card
                    key={item.id}
                    title={item.title}
                    description={item.description}
                    date={formatDate(item.date)}
                    imageSrc={item.preview_url}
                    variant="column"
                    onClick={() => navigate(`/news/${item.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {}
      </div>
    </div>
  );
}
import { useEffect, useState, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Card } from '@smartford/components/Card';
import { M3eFabMenu, M3eFabMenuTrigger, M3eFabMenuItem } from '@m3e/react/fab-menu';
import { M3eIcon } from '@m3e/react/icon';
import { M3eDialog } from '@m3e/react/dialog';
import { M3eButton } from '@m3e/react/button';
import { M3eFab } from '@m3e/react/fab';
import { M3eDatepicker, M3eDatepickerToggle } from '@m3e/react/datepicker';
import { M3eFormField } from '@m3e/react/form-field';
import { M3eIconButton } from '@m3e/react/icon-button';

import styles from './News.module.css';

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

interface User {
  id: number;
  username: string;
  name: string;
  avatar_url: string | null;
  is_owner: boolean;
}

const CACHE_KEY = 'smartford_news_all_cache';
const EXPIRY_KEY = 'smartford_news_all_expiry';

const getExpiryDate = () => {
  const now = new Date();
  const expiry = new Date(now);
  expiry.setHours(0, 0, 0, 0);
  if (now >= expiry) {
    expiry.setDate(expiry.getDate() + 1);
  }
  return expiry;
};

export function News() {
  const { isLeaving, handleAnimationEnd } = useOutletContext<ContextType>();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const navigate = useNavigate();
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newText, setNewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const datePickerRef = useRef<any>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const cachedUser = localStorage.getItem('cached_user');
    
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        setUser(parsed);
        setIsOwner(parsed.is_owner === true);
      } catch (e) {
        localStorage.removeItem('cached_user');
      }
    }

    if (token) {
      fetch('/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setIsOwner(data.user.is_owner === true);
          localStorage.setItem('cached_user', JSON.stringify(data.user));
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('cached_user');
        setUser(null);
        setIsOwner(false);
      });
    }
  }, []);

  
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
        let url = '/api/v1/news/get?count=50&sort_by=newest';
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

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        window.M3eSnackbar?.open('Файл слишком большой. Максимум 5MB');
        return;
      }
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleDateChange = (e: any) => {
    const picker = e.target;
    if (picker.date) {
      const date = new Date(picker.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      setNewDate(`${year}-${month}-${day}`);
    }
  };

  const handleCreateNews = async () => {
    if (!newTitle || !newDate || !newText) {
      window.M3eSnackbar?.open('Заполните все поля');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      let imageBase64 = null;
      if (coverImage) {
        const reader = new FileReader();
        imageBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(coverImage);
        });
      }

      const res = await fetch('/api/v1/news/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newTitle,
          date: newDate,
          text: newText,
          image: imageBase64
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка создания новости');
      }

      setNews(prev => [data.news, ...prev]);
      
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(EXPIRY_KEY);
      localStorage.removeItem('smartford_news_cache');
      localStorage.removeItem('smartford_news_expiry');
      localStorage.removeItem('smartford_news_all_cache');
      localStorage.removeItem('smartford_news_all_expiry');

      setShowCreateDialog(false);
      setNewTitle('');
      setNewDate('');
      setNewText('');
      setCoverImage(null);
      setCoverPreview('');

      window.M3eSnackbar?.open('Новость успешно создана!');
      navigate('/news');

    } catch (error: any) {
      window.M3eSnackbar?.open(error.message || 'Ошибка при создании новости');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="page-news"
      className={`page-view ${isLeaving ? 'leaving' : ''}`}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>
          Все новости SmartfordOS
        </h1>

        {!loading && error && <p className={styles.error}>{error}</p>}
        {!loading && !error && news.length === 0 && (
          <p className={styles.empty}>Новостей пока нет</p>
        )}

        {!loading && !error && news.length > 0 && (
          <div className={`${styles.newsGrid} ${styles.contentAppear}`}>
            {news.map((item, index) => (
              <Card
                key={item.id}
                title={item.title}
                description={item.description}
                date={formatDate(item.date)}
                imageSrc={item.preview_url}
                variant={index === 0 ? 'row' : 'column'}
                onClick={() => navigate(`/news/${item.id}`)}
              />
            ))}
          </div>
        )}

        {isOwner && (
          <>
            <M3eFab variant="primary" size="large" className={styles.fab}>
              <M3eFabMenuTrigger htmlFor="fab-menu">
                <M3eIcon variant="rounded" name="add" />
              </M3eFabMenuTrigger>
            </M3eFab>

            <M3eFabMenu id="fab-menu" variant="primary">
              <M3eFabMenuItem onClick={() => setShowCreateDialog(true)}>
                <M3eIcon slot="icon" variant="rounded" name="post_add" filled />
                Создать статью
              </M3eFabMenuItem>
            </M3eFabMenu>
          </>
        )}

        <M3eDialog 
          id="create-news-dialog" 
          open={showCreateDialog}
          dismissible
        >
          <span slot="header">Создать новую статью</span>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px 0' }}>
            <M3eFormField variant="outlined" style={{width: '100%'}}>
              <label slot="label" htmlFor="news-title">Заголовок</label>
              <input
                id="news-title"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Введите заголовок"
                required
              />
            </M3eFormField>

            <M3eFormField variant="outlined" style={{width: '100%'}}>
              <label slot="label" htmlFor="news-date">Дата</label>
              <input 
                id="news-date"
                type="text"
                value={newDate ? formatDate(newDate) : ''}
                placeholder="Выберите дату"
                readOnly
              />
              <M3eIconButton slot="suffix">
                <M3eIcon variant="rounded" name="calendar_today" />
                <M3eDatepickerToggle htmlFor="date-picker" />
              </M3eIconButton>
            </M3eFormField>
            
            <M3eDatepicker 
              id="date-picker" 
              ref={datePickerRef}
              variant="auto"
              onChange={handleDateChange}
              start-view="month"
            />

            <M3eFormField variant="outlined" style={{width: '100%'}}>
              <input
                ref={fileInputRef}
                id="news-cover"
                type="file"
                accept="image/*"
                onChange={handleCoverSelect}
                style={{ display: 'none' }}
              />
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '8px 0' }}>
                <M3eButton variant="tonal" onClick={handleUploadClick}>
                  <M3eIcon slot="icon" variant="rounded" name="upload" />
                  Выбрать обложку
                </M3eButton>
                {coverPreview && (
                  <img 
                    src={coverPreview} 
                    alt="Cover preview" 
                    style={{ 
                      width: '80px', 
                      height: '45px', 
                      objectFit: 'cover', 
                      borderRadius: '8px' 
                    }} 
                  />
                )}
              </div>
            </M3eFormField>

            <M3eFormField variant="outlined" style={{width: '100%'}}>
              <label slot="label" htmlFor="news-text">Текст</label>
              <textarea
                id="news-text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Введите текст новости"
                rows={4}
                required
              />
            </M3eFormField>
            
            {}
            {user && (
              <div style={{ 
                fontSize: '14px', 
                color: 'var(--md-sys-color-on-surface-variant)',
                padding: '4px 0'
              }}>
                Автор: <span style={{ color: 'var(--md-sys-color-on-surface)' }}>{user.name}</span>
              </div>
            )}
          </div>
          
          <div slot="actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <M3eButton variant="text" onClick={() => setShowCreateDialog(false)}>
              Отмена
            </M3eButton>
            <M3eButton 
              variant="filled" 
              onClick={handleCreateNews}
              disabled={isSubmitting}
            >
              <M3eIcon slot="icon" variant="rounded" name="check" />
              {isSubmitting ? 'Создание...' : 'Создать'}
            </M3eButton>
          </div>
        </M3eDialog>
      </div>
    </div>
  );
}
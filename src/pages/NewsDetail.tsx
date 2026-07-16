import { useEffect, useState } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { M3eFabMenu, M3eFabMenuTrigger, M3eFabMenuItem } from '@m3e/react/fab-menu';
import { M3eFab } from '@m3e/react/fab';
import { M3eIcon } from '@m3e/react/icon';
import { M3eDialog } from '@m3e/react/dialog';
import { M3eButton } from '@m3e/react/button';
import { M3eCheckbox } from '@m3e/react/checkbox';
import { M3eFormField } from '@m3e/react/form-field';
import { M3eDatepicker, M3eDatepickerToggle } from '@m3e/react/datepicker';
import { M3eIconButton } from '@m3e/react/icon-button';
import styles from './NewsDetail.module.css';

interface ContextType {
  isLeaving: boolean;
  handleAnimationEnd: (e: React.AnimationEvent) => void;
}

interface NewsDetailData {
  id: number;
  name: string;
  author: string;
  text: string;
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

export function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const { isLeaving, handleAnimationEnd } = useOutletContext<ContextType>();
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editText, setEditText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteFinal, setShowDeleteFinal] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  
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
    const fetchNewsDetail = async () => {
      setLoading(true);
      try {
        const CACHE_KEY = `news_detail_${id}`;
        const cached = localStorage.getItem(CACHE_KEY);
        
        if (cached) {
          setNews(JSON.parse(cached));
          setLoading(false);
          return;
        }

        const hostname = window.location.hostname;
        const isLocal = hostname === 'localhost' || hostname === 'smartfordos.vercel.app';
        let url = `/api/v1/news/get/${id}`;
        if (isLocal) url += '?is_it_local_host_server=true';
        
        const res = await fetch(url);
        if (!res.ok) throw new Error('Ошибка загрузки новости');
        const data = await res.json();
        
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        setNews(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchNewsDetail();
  }, [id]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderText = (text: string) => {
    return text.split('\n').map((paragraph, index) => {
      if (paragraph.trim() === '') return null;
      return <p key={index} className={styles.paragraph}>{paragraph}</p>;
    });
  };

  
  const handleEditClick = () => {
    if (news) {
      setEditTitle(news.name);
      setEditDate(news.date);
      setEditText(news.text);
      setShowEditDialog(true);
    }
  };

  
  const handleSaveEdit = async () => {
    if (!editTitle || !editDate || !editText) {
      window.M3eSnackbar?.open('Заполните все поля');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/v1/news/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editTitle,
          date: editDate,
          text: editText
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка обновления новости');
      }

      setNews(data.news);
      localStorage.removeItem(`news_detail_${id}`);
      localStorage.removeItem('smartford_news_all_cache');
      localStorage.removeItem('smartford_news_all_expiry');
      localStorage.removeItem('smartford_news_cache');
      localStorage.removeItem('smartford_news_expiry');

      setShowEditDialog(false);
      window.M3eSnackbar?.open('Новость успешно обновлена!');

    } catch (error: any) {
      window.M3eSnackbar?.open(error.message || 'Ошибка при обновлении новости');
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(false);
    setShowDeleteConfirm(true);
  };

  const handleDeleteFinal = () => {
    setShowDeleteConfirm(false);
    setShowDeleteFinal(true);
  };

  const handleDeleteExecute = async () => {
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/v1/news/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка удаления новости');
      }

      localStorage.removeItem(`news_detail_${id}`);
      localStorage.removeItem('smartford_news_all_cache');
      localStorage.removeItem('smartford_news_all_expiry');
      localStorage.removeItem('smartford_news_cache');
      localStorage.removeItem('smartford_news_expiry');

      setShowDeleteFinal(false);
      window.M3eSnackbar?.open('Новость успешно удалена!');
      navigate('/news');

    } catch (error: any) {
      window.M3eSnackbar?.open(error.message || 'Ошибка при удалении новости');
      setShowDeleteFinal(false);
    }
  };

  return (
    <div
      id="page-news-detail"
      className={`page-view ${isLeaving ? 'leaving' : ''}`}
      onAnimationEnd={handleAnimationEnd}
    >
      {error && <div className={styles.container}><p className={styles.error}>Ошибка: {error}</p></div>}

      {!loading && !error && news && (
        <div id="container" className={styles.contentAppear}>
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <div className={styles.heroDate}>{formatDate(news.date)}</div>
              <h1 className={styles.heroTitle}>{news.name}</h1>
            </div>
            <div className={styles.heroImage} style={{ backgroundImage: `url(${news.preview_url})` }} />
          </section>

          <div className={styles.container}>
            <div className={styles.authorBlock}>
              <div className={styles.authorAvatar}>
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={news.author} />
                ) : (
                  news.author.charAt(0).toUpperCase()
                )}
              </div>
              <div className={styles.authorInfo}>
                <span className={styles.authorPosted}>Авторы:</span>
                <span className={styles.authorName}>{news.author}</span>
              </div>
            </div>
            <hr className={styles.divider} />
            <article className={styles.article}>
              <div className={styles.content}>{renderText(news.text)}</div>
            </article>
          </div>

          {}
          {isOwner && (
            <>
              <M3eFab variant="primary" size="large" className={styles.fab}>
                <M3eFabMenuTrigger htmlFor="fab-menu-detail">
                  <M3eIcon variant="rounded" name="more_horiz" />
                </M3eFabMenuTrigger>
              </M3eFab>

              <M3eFabMenu id="fab-menu-detail" variant="primary">
                <M3eFabMenuItem onClick={handleEditClick}>
                  <M3eIcon slot="icon" variant="rounded" name="edit" filled />
                  Редактировать
                </M3eFabMenuItem>
                <M3eFabMenuItem onClick={handleDeleteClick} style={{ color: 'var(--md-sys-color-error)' }}>
                  <M3eIcon slot="icon" variant="rounded" name="delete" filled />
                  Удалить
                </M3eFabMenuItem>
              </M3eFabMenu>
            </>
          )}

          {}
          <M3eDialog id="edit-dialog" open={showEditDialog} dismissible>
            <span slot="header">Редактировать статью</span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px 0' }}>
              <M3eFormField variant="outlined" style={{width: '100%'}}>
                <label slot="label" htmlFor="edit-title">Заголовок</label>
                <input
                  id="edit-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Введите заголовок"
                  required
                />
              </M3eFormField>

              <M3eFormField variant="outlined" style={{width: '100%'}}>
                <label slot="label" htmlFor="edit-date">Дата</label>
                <input 
                  id="edit-date"
                  type="text"
                  value={editDate ? formatDate(editDate) : ''}
                  placeholder="Выберите дату"
                  readOnly
                />
                <M3eIconButton slot="suffix">
                  <M3eIcon variant="rounded" name="calendar_today" />
                  <M3eDatepickerToggle htmlFor="edit-date-picker" />
                </M3eIconButton>
              </M3eFormField>
              
              <M3eDatepicker 
                id="edit-date-picker"
                variant="auto"
                date={editDate ? new Date(editDate) : null}
                onChange={(e: any) => {
                  const picker = e.target;
                  if (picker.date) {
                    const date = new Date(picker.date);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    setEditDate(`${year}-${month}-${day}`);
                  }
                }}
                start-view="month"
              />

              <M3eFormField variant="outlined" style={{width: '100%'}}>
                <label slot="label" htmlFor="edit-text">Текст</label>
                <textarea
                  id="edit-text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Введите текст новости"
                  rows={6}
                  required
                />
              </M3eFormField>
            </div>
            
            <div slot="actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <M3eButton variant="text" onClick={() => setShowEditDialog(false)}>
                Отмена
              </M3eButton>
              <M3eButton 
                variant="filled" 
                onClick={handleSaveEdit}
                disabled={isSubmitting}
              >
                <M3eIcon slot="icon" variant="rounded" name="check" />
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </M3eButton>
            </div>
          </M3eDialog>

          {}
          <M3eDialog id="delete-dialog" open={showDeleteDialog} dismissible>
            <span slot="header">Вы уверены?</span>
            <div style={{ padding: '16px 0', color: 'var(--md-sys-color-on-surface-variant)' }}>
              Вы действительно хотите удалить эту новость? Это действие нельзя отменить.
            </div>
            <div slot="actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <M3eButton variant="text" onClick={() => setShowDeleteDialog(false)}>
                Нет
              </M3eButton>
              <M3eButton variant="filled" onClick={handleDeleteConfirm}>
                Да
              </M3eButton>
            </div>
          </M3eDialog>

          {}
          <M3eDialog id="delete-confirm-dialog" open={showDeleteConfirm} dismissible>
            <span slot="header">Вы ТОЧНО уверены?</span>
            <div style={{ padding: '16px 0', color: 'var(--md-sys-color-on-surface-variant)' }}>
              Это действие НЕЛЬЗЯ будет отменить. Новость будет удалена навсегда.
            </div>
            <div slot="actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <M3eButton variant="text" onClick={() => setShowDeleteConfirm(false)}>
                Нет
              </M3eButton>
              <M3eButton variant="filled" onClick={handleDeleteFinal}>
                Да, точно
              </M3eButton>
            </div>
          </M3eDialog>

          {}
          <M3eDialog id="delete-final-dialog" open={showDeleteFinal} dismissible>
            <span slot="header">Вы ТОЧНО ТОЧНО уверены?</span>
            <div style={{ padding: '16px 0' }}>
              <div style={{ color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '16px' }}>
                Подтвердите, что вы осознаете последствия.
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <M3eCheckbox 
                  checked={deleteConfirmed}
                  onChange={(e: any) => setDeleteConfirmed(e.target.checked)}
                />
                <span style={{ color: 'var(--md-sys-color-on-surface)' }}>Да, уверен</span>
              </label>
            </div>
            <div slot="actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <M3eButton variant="text" onClick={() => {
                setShowDeleteFinal(false);
                setDeleteConfirmed(false);
              }}>
                Нет
              </M3eButton>
              <M3eButton 
                variant="filled" 
                onClick={handleDeleteExecute}
                disabled={!deleteConfirmed}
                style={{ opacity: !deleteConfirmed ? 0.5 : 1 }}
              >
                Да, удалить
              </M3eButton>
            </div>
          </M3eDialog>
        </div>
      )}
    </div>
  );
}
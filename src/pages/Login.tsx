
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { M3eButton } from '@m3e/react/button';
import { M3eIcon } from '@m3e/react/icon';
import { M3eCard } from '@m3e/react/card';
import styles from './Login.module.css';

export function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/v1/auth/login' : '/api/v1/auth/register';
      const body = isLogin 
        ? { username, password }
        : { username, name: name || username, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка авторизации');
      }

      localStorage.setItem('token', data.token);
      navigate('/');
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <M3eCard variant="elevated" className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            {isLogin ? 'Вход' : 'Регистрация'}
          </h1>
          <p className={styles.subtitle}>
            {isLogin 
              ? 'Войдите в свой аккаунт Smartford' 
              : 'Создайте новый аккаунт Smartford'}
          </p>
        </div>

        {error && (
          <div className={styles.error}>
            <M3eIcon variant="rounded" name="error" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Имя пользователя</label>
            <div className={styles.inputWrapper}>
              <M3eIcon variant="rounded" name="person" className={styles.inputIcon} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите имя пользователя"
                className={styles.input}
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className={styles.field}>
              <label className={styles.label}>Отображаемое имя</label>
              <div className={styles.inputWrapper}>
                <M3eIcon variant="rounded" name="badge" className={styles.inputIcon} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше имя"
                  className={styles.input}
                />
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Пароль</label>
            <div className={styles.inputWrapper}>
              <M3eIcon variant="rounded" name="lock" className={styles.inputIcon} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className={styles.input}
                required
                minLength={6}
              />
            </div>
          </div>

          <M3eButton 
            variant="filled" 
            size="large"
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            <M3eIcon variant="rounded" slot="icon" name={isLogin ? 'login' : 'person_add'} />
            {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </M3eButton>
        </form>

        <div className={styles.footer}>
          <span>
            {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
          </span>
          <M3eButton
            variant="text"
            size="small"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className={styles.switchButton}
          >
            {isLogin ? 'Зарегистрироваться' : 'Войти'}
          </M3eButton>
        </div>
      </M3eCard>
    </div>
  );
}
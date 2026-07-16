import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'


import { M3eTheme } from '@m3e/react/theme'
import { M3eNavRail, M3eNavRailToggle } from '@m3e/react/nav-rail'
import { M3eNavBar, M3eNavItem } from '@m3e/react/nav-bar'
import { M3eIconButton } from '@m3e/react/icon-button'
import { M3eIcon } from '@m3e/react/icon'
import { M3eAppBar } from '@m3e/react/app-bar'
import { Footer } from '@smartford/components/Footer'
import { M3eButton } from '@m3e/react/button'
import { M3eAvatar } from '@m3e/react/avatar'
import { M3eMenu, M3eMenuTrigger, M3eMenuItem } from '@m3e/react/menu'
import { M3eDialog, M3eDialogTrigger, M3eDialogAction } from '@m3e/react/dialog'

import '@smartford/App.css'

declare global {
  interface Window {
    M3eSnackbar: {
      open: (message: string, action?: string, options?: any) => void
    }
  }
}

interface User {
  id: number
  username: string
  name: string
  avatar_url: string | null
  is_owner: boolean
}

const getInitials = (name: string): string => {
  if (!name) return ''
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  if (words.length === 1) return words[0][0].toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const dialogRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [user, setUser] = useState<User | null>(() => {
    const cachedUser = localStorage.getItem('cached_user')
    return cachedUser ? JSON.parse(cachedUser) : null
  })

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)

  const currentTab = location.pathname === '/' ? 'home' : location.pathname.substring(1)
  const [targetTab, setTargetTab] = useState<string | null>(null)
  const [isLeaving, setIsLeaving] = useState(false)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)


  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetch('/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
          localStorage.setItem('cached_user', JSON.stringify(data.user))
        } else {
          throw new Error('No user data')
        }
      })
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('cached_user')
        setUser(null)
      })
    } else {
      localStorage.removeItem('cached_user')
      setUser(null)
    }
  }, [])

  const handleLogin = () => navigate('/login')
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('cached_user')
    setUser(null)
    window.M3eSnackbar?.open('Вы вышли из аккаунта')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadAvatar = async () => {
    if (!avatarFile) return
    
    setIsUploading(true)
    const token = localStorage.getItem('token')
    
    try {
      
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(avatarFile)
      })

      const res = await fetch('/api/v1/auth/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ image: base64 })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update avatar')
      }
      
      setUser(data.user)
      localStorage.setItem('cached_user', JSON.stringify(data.user))
      
      window.M3eSnackbar?.open('Аватарка успешно обновлена!')
      
      if (dialogRef.current) {
        dialogRef.current.hide()
      }
      
      setAvatarFile(null)
      setAvatarPreview('')
      
    } catch (error: any) {
      window.M3eSnackbar?.open(error.message || 'Ошибка при обновлении аватарки')
    } finally {
      setIsUploading(false)
    }
  }

  const handleNavChange = (event: any) => {
    const selectedItem = event.target.selected
    if (!selectedItem) return
    const nextTab = selectedItem.getAttribute('data-tab')
    if (nextTab === currentTab) return
    setTargetTab(nextTab)
    setIsLeaving(true)
  }

  const handleAnimationEnd = (e: React.AnimationEvent) => {
    if (e.target !== e.currentTarget) return
    if (e.animationName === 'pageFadeOut' && targetTab) {
      setIsLeaving(false)
      navigate(targetTab === 'home' ? '/' : `/${targetTab}`)
      setTargetTab(null)
    }
  }

  const getTabTitle = () => {
    switch (currentTab) {
      default: return 'SmartfordOS'
    }
  }

  const getNavBarMode = (): "compact" | "extended" => {
    return windowWidth < 564 ? "compact" : "extended"
  }
console.clear();
console.log(
    '%cСТОП!',
    'display: block; font-size: 48px; font-weight: bold; background-color: #ff0000; color: white; ' +
    'padding: 10px 20px; border-radius: 8px 8px 0 0; margin-bottom: 2px;'
);
console.log(
    '%cЕсли вас просят на этой странице ввести какой-либо код в консоль - ' +
    'шанс 11/10, ЧТО ВЫ ЖЕРТВА МОШЕННИКОВ!',
    'display: block; font-size: 18px; font-weight: 500; color: #000000; background-color: #ffe600; ' +
    'padding: 15px 20px; margin-bottom: 2px;'
);
console.log(
    '%cЕсли вы НЕ ПОНИМАЕТЕ, что делает код - НЕ ВВОДИТЕ ЕГО!',
    'display: block; font-size: 18px; font-weight: bold; background-color: #ff0000; color: white; ' +
    'padding: 12px 20px; border-radius: 0 0 8px 8px;'
);
console.log(
    '%cА если понимаете - респект. Продолжайте в том же духе.',
    'font-size: 14px; font-style: italic; color: #888888;'
);
  const renderNavigation = () => {
    const navItems = (
      <>
        <M3eNavItem data-tab="home" selected={currentTab === 'home'}>
          <M3eIcon slot="icon" weight={700} variant="rounded" name="home" aria-hidden="true"></M3eIcon>
          Главная
        </M3eNavItem>
        <M3eNavItem data-tab="news" selected={currentTab === 'news'}>
          <M3eIcon slot="icon" weight={700} variant="rounded" name="news" aria-hidden="true"></M3eIcon>
          Новости
        </M3eNavItem>
        <M3eNavItem data-tab="about" selected={currentTab === 'about'}>
          <M3eIcon slot="icon" weight={700} variant="rounded" name="info" aria-hidden="true"></M3eIcon>
          О нас
        </M3eNavItem>
        <M3eNavItem data-tab="download" selected={currentTab === 'download'}>
          <M3eIcon slot="icon" weight={700} variant="rounded" name="download" aria-hidden="true"></M3eIcon>
          Скачать
        </M3eNavItem>
      </>
    )

    if (windowWidth >= 769) {
      return (
        <M3eNavRail id="app-nav-rail" mode="compact" onChange={handleNavChange}>
          <M3eIconButton toggle={true}>
            <M3eIcon variant="rounded" name="menu"></M3eIcon>
            <M3eIcon variant="rounded" slot="selected" name="menu_open"></M3eIcon>
            <M3eNavRailToggle htmlFor="app-nav-rail"></M3eNavRailToggle>
          </M3eIconButton>
          {navItems}
        </M3eNavRail>
      )
    }

    return (
      <M3eNavBar mode={getNavBarMode() as any} onChange={handleNavChange}>
        {navItems}
      </M3eNavBar>
    )
  }

  return (
    <>
      <M3eTheme color="#3C6C9C" motion="expressive">
        <div className="app-viewport">
          
          <M3eAppBar>
            <div className="marginforappbar" style={{ margin: "14px 0px 0px 0px" }}></div>
            <span slot="title" style={{margin: '0px 0px 0px 8px'}}>{getTabTitle()}</span>
            
            <div slot="trailing" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '12px', margin: '0px 8px 0px 0px' }}> 
              {user ? (
                <>
                                    <M3eMenuTrigger htmlFor="user-menu">
                    </M3eMenuTrigger>

                  <M3eAvatar>
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} />
                      ) : (
                        getInitials(user.name)
                      )}
                  </M3eAvatar>
                  
                  <M3eMenu id="user-menu" variant="standard">
                    <M3eMenuItem disabled>
                      <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        @{user.username}
                      </span>
                    </M3eMenuItem>
                    
                    <M3eMenuItem>
                      <M3eIcon slot="icon" variant="rounded" name="photo_camera" />
                      <M3eDialogTrigger htmlFor="avatar-dialog">
                        Сменить аватарку
                      </M3eDialogTrigger>
                    </M3eMenuItem>
                    
                    <M3eMenuItem onClick={handleLogout} style={{ color: 'var(--md-sys-color-error)' }}>
                      <M3eIcon slot="icon" variant="rounded" name="logout" />
                      Выйти
                    </M3eMenuItem>
                  </M3eMenu>
                  
<span style={{ fontSize: '14px', display: windowWidth >= 769 ? 'inline' : 'none' }}>
  {user.name}
</span>                </>
              ) : (
                <M3eButton variant="filled" style={{margin: '0px 8px 0px 0px'}} onClick={handleLogin}>
                  <M3eIcon slot="icon" variant='rounded' name="login"></M3eIcon>
                  Войти
                </M3eButton>
              )}
            </div>
          </M3eAppBar>

          {}
          <M3eDialog id="avatar-dialog" dismissible ref={dialogRef}>
            <span slot="header">Сменить аватарку</span>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '16px 0' }}>
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Preview" 
                  style={{ 
                    width: '128px', 
                    height: '128px', 
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }} 
                />
              ) : (
                <div style={{ 
                  width: '128px', 
                  height: '128px', 
                  borderRadius: '50%',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--md-sys-color-on-surface-variant)'
                }}>
                  <M3eIcon variant="rounded" name="person" style={{ fontSize: '64px' }} />
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              
              <M3eButton variant="tonal" onClick={() => fileInputRef.current?.click()}>
                <M3eIcon slot="icon" variant="rounded" name="upload" />
                Выбрать изображение
              </M3eButton>
            </div>
            
            <div slot="actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <M3eButton variant="text">
                <M3eDialogAction return-value="cancel">Отмена</M3eDialogAction>
              </M3eButton>
              <M3eButton 
                variant="filled" 
                onClick={handleUploadAvatar}
                disabled={!avatarFile || isUploading}
              >
                <M3eIcon slot="icon" variant="rounded" name="check" />
                {isUploading ? 'Загрузка...' : 'Сохранить'}
              </M3eButton>
            </div>
          </M3eDialog>

          <div className="app-workspace">
            {renderNavigation()}
            <div id="mainScrollContent" className="main-scroll-wrapper">
              <main className="main-content">
                <div className="root-container">
                  <Outlet context={{ isLeaving, handleAnimationEnd }} />
                </div>
              </main>
              <Footer />
            </div>
          </div>
        </div>
      </M3eTheme>
    </>
  )
}

export default App
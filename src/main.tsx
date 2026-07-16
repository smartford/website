import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import '@smartford/index.css'
import App from '@smartford/App.tsx'


import { Home } from '@smartford/pages/Home'
import { News } from '@smartford/pages/News'
import { NewsDetail } from '@smartford/pages/NewsDetail'
import { About } from '@smartford/pages/About'
import { Download } from '@smartford/pages/Download'
import { NotFound } from './pages/NotFound'
import { Login } from '@smartford/pages/Login'


import "@m3e/icons/rounded/home";
import "@m3e/icons/rounded/news";
import "@m3e/icons/rounded/download";
import "@m3e/icons/rounded/menu";
import "@m3e/icons/rounded/menu_open";
import "@m3e/icons/rounded/info";
import "@m3e/icons/rounded/login";
import "@m3e/icons/rounded/person";
import "@m3e/icons/rounded/badge";
import "@m3e/icons/rounded/lock";
import "@m3e/icons/rounded/person_add";
import "@m3e/icons/rounded/error";
import "@m3e/icons/rounded/photo_camera";
import "@m3e/icons/rounded/calendar_today";
import "@m3e/icons/rounded/logout";
import "@m3e/icons/rounded/add";
import "@m3e/icons/rounded/post_add";
import "@m3e/icons/rounded/upload";
import "@m3e/icons/rounded/check";
import "@m3e/icons/rounded/more_horiz";
import "@m3e/icons/rounded/edit";
import "@m3e/icons/rounded/delete";

console.clear();



const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'news',
        element: <News />
      },
      {
        path: 'news/:id',
        element: <NewsDetail />
      },
      {
        path: 'about',
        element: <About />
      },
      {
        path: 'download',
        element: <Download />
      },
      {
        path: 'login',
        element: <Login />
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
])

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />
)
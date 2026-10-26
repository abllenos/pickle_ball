/* oxlint-disable react/only-export-components -- route table, not a component module */
import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import NotFoundPage from '../pages/NotFoundPage'

const OrganizerLayout = lazy(() => import('../features/organizer/OrganizerLayout'))
const CourtsPage = lazy(() => import('../features/organizer/pages/CourtsPage'))
const PlayersPage = lazy(() => import('../features/organizer/pages/PlayersPage'))
const UpNextPage = lazy(() => import('../features/organizer/pages/UpNextPage'))
const SessionPage = lazy(() => import('../features/organizer/pages/SessionPage'))
const SetupPage = lazy(() => import('../features/organizer/pages/SetupPage'))

const DisplayPage = lazy(() => import('../features/display/DisplayPage'))

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },

  { path: '/organizer/setup', element: <SetupPage /> },

  {
    path: '/organizer',
    element: <OrganizerLayout />,
    children: [
      { index: true, element: <CourtsPage /> },
      { path: 'players', element: <PlayersPage /> },
      { path: 'up-next', element: <UpNextPage /> },
      { path: 'session', element: <SessionPage /> },
    ],
  },
  { path: '/display', element: <DisplayPage /> },
  { path: '*', element: <NotFoundPage /> },
])

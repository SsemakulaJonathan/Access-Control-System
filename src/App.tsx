import { useState } from 'react'
import Settings from './components/access/Settings'
import AccessDashboard from './components/access/AccessDashboard'
import RegisterUser from './components/access/RegisterUser'

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard')

  // Navigation Icons
  const cameraIcon = (
    <svg className="mr-2 h-4 w-4" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )

  const userPlusIcon = (
    <svg className="mr-2 h-4 w-4" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
      <path d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )

  const settingsIcon = (
    <svg className="mr-2 h-4 w-4" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
      <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )

  const renderContent = () => {
    switch (currentView) {
      case 'register':
        return <RegisterUser />
      case 'settings':
        return <Settings />
      default:
        return <AccessDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow fixed w-full top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'dashboard' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setCurrentView('dashboard')}
              >
                {cameraIcon}
                Access Control
              </button>
              <button
                className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'register' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setCurrentView('register')}
              >
                {userPlusIcon}
                Register User
              </button>
              <button
                className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'settings' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setCurrentView('settings')}
              >
                {settingsIcon}
                Settings
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="bg-gray-50 min-h-screen pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
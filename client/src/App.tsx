import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from '@/routes/AppRoutes'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthInitializer } from '@/components/AuthInitializer'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthInitializer>
          <AppRoutes />
        </AuthInitializer>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

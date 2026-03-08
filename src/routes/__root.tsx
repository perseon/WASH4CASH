import { HeadContent, Link, Outlet, Scripts, createRootRouteWithContext, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import Footer from '../components/Footer'
import Header from '../components/Header'
import { Toaster } from '../components/ui/sonner'

import appCss from '../styles.css?url'

import { commService } from '../services/comm.service'
import '../i18n'

interface MyRouterContext {
  commService: typeof commService
}

//const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
  errorComponent: GlobalErrorComponent,
  notFoundComponent: NotFoundComponent,
})

function RootComponent() {
  const { location } = useRouterState()
  const isIndexPage = location.pathname === '/'

  return (
    <>
      {!isIndexPage && <Header />}
      <main>
        <Outlet />
      </main>
      {!isIndexPage && <Footer />}
    </>
  )
}

function GlobalErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-destructive/20 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="text-destructive w-10 h-10" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight">APPLICATION ERROR</CardTitle>
          <CardDescription className="text-sm font-medium">
            Something went wrong while processing your request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-xl font-mono text-xs overflow-auto max-h-32 border border-muted-foreground/10">
            {error.message}
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button variant="outline" className="flex-1 font-bold h-12 rounded-xl" onClick={() => window.location.href = '/'}>
            <Home className="mr-2 h-4 w-4" /> HOME
          </Button>
          <Button className="flex-1 font-bold h-12 rounded-xl" onClick={() => reset()}>
            <RefreshCw className="mr-2 h-4 w-4" /> RETRY
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

function NotFoundComponent() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 text-center">
      <div className="space-y-6">
        <h1 className="text-9xl font-black text-muted/20 select-none">404</h1>
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight">PAGE NOT FOUND</h2>
          <p className="text-muted-foreground font-medium">The page you are looking for doesn't exist or has been moved.</p>
        </div>
        <Button render={<Link to="/" />} size="lg" className="font-black h-14 px-8 rounded-2xl">
          BACK TO DASHBOARD
        </Button>
      </div>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} /> */}
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster />
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}

"use client"

import Link from "next/link"
import { Github, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { router } from "better-auth/api"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"



function SyncTime() {
  const [time, setTime] = useState<string | null>(null);
  

  useEffect(() => {
    const updateTime = () => {
      const formatted = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(new Date())
      setTime(formatted)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!time) {
    return <span className="tabular-nums">--:--:-- --</span>
  }

  return (
    <time dateTime={new Date().toISOString()} className="tabular-nums">
      {time}
    </time>
  )
}

export default function LoginPage() {

  const router = useRouter();

  async function handleGithubSignIn() {
    const {error} = await authClient.signIn.social({
      provider: "github",
      callbackURL: "/habits"
    });


  }

  return (
    <div className="flex min-h-screen flex-col font-display bg-background">
      <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
        <div className="h-16 px-6 border-b border-border flex flex-row items-center">
          <span className="w-3 h-3 bg-foreground mr-3" aria-hidden="true" />
          <h1 className="text-lg font-bold tracking-widest font-display">
            CHRONO_OS // AUTH_SYSTEM
          </h1>
        </div>
        <span className="text-xs text-muted-foreground border border-border px-2 py-1 font-display uppercase flex items-center gap-2">
          <Clock className="size-3" aria-hidden="true" />
          <SyncTime />
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-24 ">
        <div className="text-center space-y-8 max-w-sm w-full tech-full-border border border-border p-8">
          <div className="shrink-0 flex items-center justify-between text-left">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-0.5 font-display">
                eyo hru?
              </p>
              <h1 className="text-xl font-bold text-foreground font-display ">
                Login to your account
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button variant="outline" className="w-full justify-start" 
              onClick={() => handleGithubSignIn()}
              >
                <Github className="mr-2 h-4 w-4" />
                Github
            </Button>

            <Link href="/schedule" className="w-full">
              <Button variant="outline" className="w-full justify-start">
                <svg
                  className="mr-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="p-6 border-t border-zinc-200 dark:border-zinc-900 flex flex-col md:flex-row justify-between md:justify-end items-center gap-4 text-right text-[10px]">
        
        <span>Made with &lt;3 By <Link href="https://juanastonitas.is-a.dev/" className="text-zinc-500 hover:text-zinc-300">NeoRise</Link></span>
      </footer>
    </div>
  )
}

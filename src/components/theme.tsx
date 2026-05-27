import { createContext, 
         useContext, 
         useEffect, 
         useState,
        type ReactNode } from "react"

// only dark, light and system (laptop) themes allowed
type Theme = "dark" | "light" | "system"

// Properties:
// include children the theme will cover (App.tsx), 
// default theme, and name for local storage to remember simple pref (hard drive)
// Note: Can use Supabase to save preferences but slower and guest mode suffers 
// Local storage is built in API,
// ensures choices will kick in immediately on loading browser
type ThemeProps = {
    children: ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

// State:
// current theme and function to set it as usual
type ThemeState = {
    theme: Theme
    setTheme: (theme: Theme) => void
}

// Initialize State
const initialState: ThemeState = {
    theme: "system",
    setTheme: () => null,
}

// Context acts as a broadcast tower to control entire app theme
const ThemeContext = createContext<ThemeState>(initialState)


// MAIN FUNCTION - arguments handled in layout
export function Theme({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  ...props
}: ThemeProps) {
    // handle state, use hard drive's preferences or default theme
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  // Every time theme changes, this will run and refresh the theme
  // root is the very absolute beginning <html> encapsulating all UI
  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    // if no preference, follow user's laptop color scheme
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"
    
      // all UI in the root are subject to the theme
      root.classList.add(systemTheme)
      return
    }

    // otherwise, just use the theme they selected
    root.classList.add(theme)
  }, [theme])

  // save to local storage functionality using setTheme
  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeContext.Provider {...props} value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// code reusability (MOVED FROM SETTINGS TO HERE)
export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
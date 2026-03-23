import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Use React.ComponentProps to infer the props type
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
} 
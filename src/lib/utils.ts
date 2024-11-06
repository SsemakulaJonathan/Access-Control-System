import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { Toast, ToastProvider, ToastViewport } from "../components/ui/toast"
export { ToastAction } from "../components/ui/toast"
export { ToastClose } from "../components/ui/toast"
export { ToastTitle } from "../components/ui/toast"
export { ToastDescription } from "../components/ui/toast"

"use client"
import React, { createContext, useContext, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { CheckCircle, XCircle, X } from "lucide-react"

interface Toast {
  id: string
  message: string
  type: "success" | "error"
}

interface ToastContextType {
  showToast: (message: string, type?: "success" | "error") => void
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium",
              "animate-in slide-in-from-bottom-2 duration-300",
              toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
            )}
          >
            {toast.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {toast.message}
            <button onClick={() => setToasts((p) => p.filter((t) => t.id !== toast.id))}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

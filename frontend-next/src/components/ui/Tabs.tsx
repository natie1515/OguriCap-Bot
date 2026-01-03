'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
}>({
  value: '',
  onValueChange: () => {}
})

interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ defaultValue, value, onValueChange, children, className, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || '')
    
    const currentValue = value !== undefined ? value : internalValue
    const handleValueChange = onValueChange || setInternalValue

    return (
      <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
        <div ref={ref} className={cn('w-full', className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = 'Tabs'

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, forwardedRef) => {
    const { value: selectedValue } = React.useContext(TabsContext)
    const localRef = React.useRef<HTMLDivElement | null>(null)
    const [indicator, setIndicator] = React.useState<{ x: number; w: number; o: number }>({
      x: 0,
      w: 0,
      o: 0,
    })

    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        localRef.current = node
        if (!forwardedRef) return
        if (typeof forwardedRef === 'function') forwardedRef(node)
        else (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node
      },
      [forwardedRef]
    )

    const updateIndicator = React.useCallback(() => {
      const root = localRef.current
      if (!root) return

      const triggers = Array.from(root.querySelectorAll<HTMLElement>('[data-tabs-trigger="true"]'))
      const active = triggers.find(t => t.dataset.value === selectedValue)
      if (!active) {
        setIndicator(prev => ({ ...prev, o: 0 }))
        return
      }

      const listRect = root.getBoundingClientRect()
      const activeRect = active.getBoundingClientRect()
      const x = Math.max(0, activeRect.left - listRect.left)
      const w = Math.max(0, activeRect.width)
      setIndicator({ x, w, o: 1 })
    }, [selectedValue])

    React.useLayoutEffect(() => {
      updateIndicator()
    }, [updateIndicator, children])

    React.useEffect(() => {
      const root = localRef.current
      if (!root) return

      const ro = new ResizeObserver(() => updateIndicator())
      ro.observe(root)
      window.addEventListener('resize', updateIndicator)
      return () => {
        ro.disconnect()
        window.removeEventListener('resize', updateIndicator)
      }
    }, [updateIndicator])

    return (
      <div
        ref={setRefs}
        role="tablist"
        className={cn('relative flex items-center gap-2 border-b border-white/10', className)}
        {...props}
      >
        {children}
        <span
          aria-hidden="true"
          className="tabs-indicator"
          style={
            {
              ['--x' as any]: `${indicator.x}px`,
              ['--w' as any]: `${indicator.w}px`,
              ['--o' as any]: String(indicator.o),
            } as React.CSSProperties
          }
        />
      </div>
    )
  }
)
TabsList.displayName = 'TabsList'

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = React.useContext(TabsContext)
    
    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={selectedValue === value}
        data-tabs-trigger="true"
        data-value={value}
        className={cn(
          'tab press-scale focus-ring-animated',
          selectedValue === value && 'tab-active',
          'disabled:pointer-events-none disabled:opacity-50',
          className
        )}
        onClick={() => (selectedValue === value ? null : onValueChange(value))}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = 'TabsTrigger'

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const { value: selectedValue } = React.useContext(TabsContext)
    
    if (selectedValue !== value) return null
    
    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn(
          'mt-4 slide-up-fade',
          className
        )}
        {...props}
      />
    )
  }
)
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent }

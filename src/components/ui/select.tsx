import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { cn } from '@/lib/utils'

export const Select = SelectPrimitive.Root

export const SelectGroup = SelectPrimitive.Group

export const SelectValue = SelectPrimitive.Value

export function SelectTrigger({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className='ml-2'>
        <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export function SelectContent({ className, children, position = 'popper', ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & { position?: 'item-aligned' | 'popper' }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          'relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
          position === 'popper' && 'translate-y-1',
          className
        )}
        position={position}
        {...props}
      >
        <SelectPrimitive.Viewport className={cn('p-1', position === 'popper' && 'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]')}>
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    >
      <span className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
        <SelectPrimitive.ItemIndicator>
          <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><polyline points='20 6 9 17 4 12'></polyline></svg>
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

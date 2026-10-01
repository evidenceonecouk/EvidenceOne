import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Slot } from 'radix-ui'

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg text-base font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out outline-none select-none active:scale-[0.98] focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.125rem]",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm hover:bg-graphite-soft',
        destructive: 'bg-decline text-white shadow-sm hover:bg-decline/90',
        outline:
          'border border-line bg-paper text-ink shadow-xs hover:border-silver hover:bg-mist',
        secondary: 'bg-mist text-ink hover:bg-line-soft',
        ghost: 'text-ink hover:bg-mist',
        link: 'text-ink underline underline-offset-4 decoration-silver hover:decoration-ink',
        inverse: 'bg-paper text-ink shadow-sm hover:bg-mist',
      },
      size: {
        default: 'h-11 px-5 has-[>svg]:px-4',
        xs: "h-8 gap-1 rounded-md px-2.5 text-sm has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3.5",
        sm: 'h-10 gap-1.5 px-4 text-[0.9375rem] has-[>svg]:px-3',
        lg: 'h-13 px-7 text-lg has-[>svg]:px-6',
        icon: 'size-11',
        'icon-xs': "size-8 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        'icon-sm': 'size-10',
        'icon-lg': 'size-13',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

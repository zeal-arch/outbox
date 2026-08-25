import * as React from "react"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
  {
    variants: {
      variant: {
        solid: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-full",
        outline: "border border-primary text-primary hover:bg-primary/10 rounded-full",
        brand: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-full",
        gradient: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-full",
        "creative-liquid": "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-full",
        "creative-halo": "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-full",
        "creative-glass": "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-full",
        popup: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-full",
        bounce: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-full",
        "cartoony-pop": "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-full",
        "premium-pill-glass": "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-full",
        "cyber-radar": "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-full",
        ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md",
        destructive: "bg-red-500 text-white hover:bg-red-600 rounded-md",
        unstyled: "", // for keeping exact classes from before
      },
      size: {
        default: "h-12 px-6 py-3 text-sm",
        sm: "h-9 px-3 text-sm",
        lg: "h-14 px-8 text-base",
        icon: "h-10 w-10",
        none: "", // unstyled size
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  href?: string
}

export default function Button({
  className,
  variant,
  size,
  href,
  type = "button",
  ...props
}: ButtonProps) {
  const compClasses = cn(buttonVariants({ variant, size, className }))

  if (href) {
    return (
      <Link href={href} className={compClasses}>
        {props.children}
      </Link>
    )
  }

  return (
    <button type={type} className={compClasses} {...props} />
  )
}


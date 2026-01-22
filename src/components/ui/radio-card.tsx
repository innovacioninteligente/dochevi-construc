import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface RadioCardProps extends React.ComponentPropsWithoutRef<typeof RadioGroupItem> {
    children?: React.ReactNode
    icon?: React.ReactNode
    label: string
    description?: string
    className?: string
}

const RadioCard = React.forwardRef<React.ElementRef<typeof RadioGroupItem>, RadioCardProps>(
    ({ className, children, icon, label, description, ...props }, ref) => {
        return (
            <Label
                className={cn(
                    "relative flex cursor-pointer flex-col gap-2 rounded-xl border-2 border-muted bg-popover p-4 transition-all hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5 [&:has([data-state=checked])]:text-primary [&:has([data-state=checked])]:hover:bg-primary/10 [&:has([data-state=checked])]:hover:text-primary",
                    className
                )}
            >
                <RadioGroupItem ref={ref} {...props} className="sr-only" />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {icon && <div className="text-primary/80">{icon}</div>}
                        <div className="font-semibold">{label}</div>
                    </div>
                    <div className="h-4 w-4 rounded-full border border-primary opacity-0 [&:has([data-state=checked])]:opacity-100 transition-opacity">
                        <div className="h-full w-full rounded-full bg-primary" />
                    </div>
                </div>
                {description && <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>}
                {children}
                <div className="absolute right-4 top-4 h-4 w-4 shrink-0 rounded-full border border-primary opacity-0 ring-offset-background transition-opacity data-[state=checked]:opacity-100">
                    <Check className="h-3 w-3 text-primary" />
                </div>
            </Label>
        )
    }
)
RadioCard.displayName = "RadioCard"

export { RadioCard }

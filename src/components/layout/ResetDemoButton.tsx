import { RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { personaById } from '@/store/personas'
import { useDemoStore } from '@/store/DemoStore'

export function ResetDemoButton({ className }: { className?: string }) {
  const { state, reset } = useDemoStore()
  const navigate = useNavigate()

  return (
    <AlertDialog>
      <AlertDialogTrigger
        className={cn(
          'inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-3 text-[0.9375rem] font-medium text-paper/85 hover:bg-white/10 hover:text-paper',
          className,
        )}
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        Reset demo
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">
            Reset the demo?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-slate">
            Every company, case, invite and audit entry goes back to its
            starting point. Timers restart from now.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 text-base">
            Keep my progress
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-11 text-base"
            onClick={() => {
              reset()
              navigate(personaById(state.persona).home)
            }}
          >
            Reset demo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

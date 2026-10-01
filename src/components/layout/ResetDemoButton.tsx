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
import { personaById } from '@/store/personas'
import { useDemoStore } from '@/store/DemoStore'

export function ResetDemoButton() {
  const { state, reset } = useDemoStore()
  const navigate = useNavigate()

  return (
    <AlertDialog>
      <AlertDialogTrigger className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-[0.9375rem] font-medium text-paper/85 hover:bg-white/10 hover:text-paper">
        <RotateCcw className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Reset demo</span>
        <span className="sr-only sm:hidden">Reset demo</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">Reset the demo?</AlertDialogTitle>
          <AlertDialogDescription className="text-base text-slate">
            Every company, case, invite and audit entry goes back to its starting point. Timers restart from now.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 text-base">Keep my progress</AlertDialogCancel>
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

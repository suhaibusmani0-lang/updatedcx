import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const buttonLoading = ({
  type = 'button',
  text = 'Submit',
  loading = false,
  className = 'w-full bg-ring text-white p-2 rounded hover:bg-ring/80 disabled:bg-gray-300 disabled:text-gray-500',
  onClick = null,
  ...props
 
}) => {
  return (
    <Button
      type={type}
      disabled={loading}
      onClick={onClick}
      className={cn("",className, "w-full")}
      {...props}
      
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading ? 'Please wait...' : text}
    </Button>
  )
}

export default buttonLoading
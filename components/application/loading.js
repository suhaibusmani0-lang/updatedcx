import React from 'react'
import Image from 'next/image'

const loading = () => {
  return (
    <div className="flex items-center justify-center h-screen hidden">
        <Image src="/assets/images/loading.gif" alt="Loading..." height={80} width={80} unoptimized />
    </div>
  )
}

export default loading
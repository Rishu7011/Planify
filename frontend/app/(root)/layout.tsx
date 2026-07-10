
import React from 'react'

const layout =  async ({children}: {children:React.ReactNode}) => {
  
  return (
    <main className='min-h-screen text-gray-600'>
        <div className='container py-10'>
            {children}
        </div>
    </main>
  )
}

export default layout
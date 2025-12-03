"use client"
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import React from 'react'

const ExplorePageLayout = ({ children }) => {
    const pathname = usePathname()
    const router = useRouter()
    const isMainExplore = pathname === "/explore"
    return (
        <div className='pb-16 min-h-screen'>
            <div className="max-w-7xl mx-auto px-6">{!isMainExplore && (
                <div className="mb-6">
                    <Button variant={"ghost"} className={"gap-2 -ml-2"} onClick={() => router.push("/explore")}>
                        <ArrowLeft className='h-4 w-4' />
                        Back to Explore
                    </Button>
                </div>
            )}
                {children}
            </div>
        </div>
    )
}

export default ExplorePageLayout

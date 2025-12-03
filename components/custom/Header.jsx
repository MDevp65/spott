"use client"
import { SignInButton, useAuth, UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Authenticated, Unauthenticated } from 'convex/react'
import { BarLoader } from "react-spinners"
import { useStoreUser } from '@/hooks/useStoreUserEffect'
import { Building, Crown, Plus, Ticket } from 'lucide-react'
import OnboardingModal from './OnboardingModal'
import { useOnboarding } from '@/hooks/useOnboarding'
import SearchLocationBar from './SearchLocationBar'
import { Badge } from '../ui/badge'
import UpgradeModal from './UpgradeModal'

const Header = () => {
    const { isLoading } = useStoreUser();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)

    const { showOnboarding, handleOnboardingComplete, handleOnboardingSkip } = useOnboarding()

    const { has } = useAuth()
    const hasPro = has?.({ plan: "pro" });

    return (
        <>
            <nav className='fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-xl z-20 border-b'>
                <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
                    {/* logo */}
                    <Link href={"/"} className='flex items-center'>
                        <Image
                            src={"/spott.png"}
                            alt='Spott Logo'
                            width={500}
                            height={500}
                            className='w-full h-11'
                            priority
                        />

                        {/* Pro Badge */}
                        {
                            hasPro && (
                                <Badge className={"bg-linear-to-r from-pink-500 to to-orange-500 gap-1 text-white ml-3 "}>
                                    <Crown className='w-3 h-3' />
                                    Pro
                                </Badge>
                            )
                        }
                    </Link>

                    {/* search and location - for desktop only */}
                    <div className="hidden md:flex flex-1 justify-center">
                        <SearchLocationBar />
                    </div>

                    {/* right side actions */}
                    <div className="flex items-center">
                        {
                            !hasPro && (
                                <Button variant={"ghost"} size={"sm"} onClick={() => setShowUpgradeModal(true)} >Pricing</Button>
                            )
                        }

                        <Button variant={"ghost"} size={"sm"} className={"mr-2"} asChild>
                            <Link href={"/explore"}>Explore</Link>
                        </Button>
                        <Authenticated>
                            {/* Create Event Button */}
                            <Button size="sm" asChild className="flex gap-2 mr-4">
                                <Link href="/create-event">
                                    <Plus className="w-4 h-4" />
                                    <span className="hidden sm:inline">Create Event</span>
                                </Link>
                            </Button>

                            {/* User Button */}
                            <UserButton
                                afterSignOutUrl="/"
                                appearance={{
                                    elements: {
                                        avatarBox: "w-9 h-9",
                                    },
                                }}
                            >
                                <UserButton.MenuItems>
                                    <UserButton.Link
                                        label="My Tickets"
                                        labelIcon={<Ticket size={16} />}
                                        href="/my-tickets"
                                    />
                                    <UserButton.Link
                                        label="My Events"
                                        labelIcon={<Building size={16} />}
                                        href="/my-events"
                                    />
                                    <UserButton.Action label="manageAccount" />
                                </UserButton.MenuItems>
                            </UserButton>
                        </Authenticated>

                        <Unauthenticated>
                            <SignInButton mode='modal'>
                                <Button size={"sm"}>Sign In</Button>
                            </SignInButton>
                        </Unauthenticated>

                    </div>

                </div>

                {/* Mobile search and location for mobile */}
                <div className="md:hidden border-t px-3 py-3">
                    <SearchLocationBar />
                </div>

                {/* loader */}
                {
                    isLoading && <div className='absolute bottom-0 left-0 w-full'>
                        <BarLoader width={"100%"} color='#a855f7' />
                    </div>
                }
            </nav>

            {/* Modals */}
            <OnboardingModal isOpen={showOnboarding} onClose={handleOnboardingSkip} onComplete={handleOnboardingComplete} />
            <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} trigger="header" />
        </>
    )
}

export default Header

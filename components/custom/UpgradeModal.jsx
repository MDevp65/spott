import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Sparkles } from 'lucide-react'
import { PricingTable } from '@clerk/nextjs'
import { Button } from '../ui/button'

const UpgradeModal = ({ isOpen, onClose, trigger = 'limit' }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-6 h-6 text-purple-500" />
                        <DialogTitle className="text-2xl">Upgrade to Pro</DialogTitle>
                    </div>
                    <DialogDescription>
                        {trigger === "header" && "Create Unlimited Events with Pro! "}
                        {trigger === "limit" && "You've reached your free event limit. "}
                        {trigger === "color" && "Custom theme colors are a Pro feature. "}
                        Unlock unlimited events and premium features!
                    </DialogDescription>
                </DialogHeader>

                {/* Pricing Cards */}
                <PricingTable
                    checkoutProps={{
                        appearance: {
                            elements: {
                                drawerRoot: {
                                    zIndex: 2000,
                                },
                            },
                        },
                    }}
                />

                {/* Footer */}
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Maybe Later
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default UpgradeModal

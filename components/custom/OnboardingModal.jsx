"use client"
import React, { useMemo, useState } from 'react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { ArrowLeft, ArrowRight, Heart, MapPin } from 'lucide-react'
import { CATEGORIES } from '@/lib/data'
import { Badge } from '../ui/badge'
import { toast } from 'sonner'
import { useConvexMutation } from '@/hooks/useConvexQuery'
import { api } from '@/convex/_generated/api'
import { City, State } from 'country-state-city'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Input } from '../ui/input'

const OnboardingModal = ({ isOpen, onClose, onComplete }) => {

    const { mutate: completeonBoarding, isLoading } = useConvexMutation(api.users.completeOnBoarding)

    const [selectedInterests, setSelectedIntreests] = useState([])
    const [location, setLocation] = useState({
        state: "",
        city: "",
        country: "",
    })

    const [step, setStep] = useState(1)
    const progress = (step / 2) * 100

    const toggleInterest = (categoryId) => {
        setSelectedIntreests((prev) =>
            prev.includes(categoryId)
                ? prev.filter((id) => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleComplete = async () => {
        try {
            await completeonBoarding({
                location: {
                    city: location.city,
                    state: location.state,
                    country: location.country
                },
                interests: selectedInterests
            })
            toast.success("Welcome to Spott! 🎉")
            onComplete();
        } catch (error) {
            toast.error("Failed to complete onboarding");
            console.error(error);
        }
    }

    const handleNext = () => {
        if (step === 1 && selectedInterests.length < 3) {
            toast.warning("Please select at least 3 interests");
            return;
        }
        if (step === 2 && (!location.city || !location.state)) {
            toast.warning("Please select both state and city");
            return;
        }
        if (step < 2) {
            setStep(step + 1);
        } else {
            handleComplete();
        }
    };

    const handleClose = () => {
        onClose()
        setStep(1)
        setSelectedIntreests([])
        setLocation({ state: "", city: "", country: "" })
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <div className='mb-4 mx-2'>
                        <Progress value={progress} className={"h-1"} />
                    </div>
                    <DialogTitle className={"flex items-center text-2xl gap-2"}>
                        {
                            step === 1 ? (
                                <>
                                    <Heart className='w-6 h6 text-purple-500' />
                                    What interests you?
                                </>
                            ) : (
                                <>
                                    <MapPin className='w-6 h-6 text-purple-500' />
                                    Where are you located?
                                </>
                            )
                        }
                    </DialogTitle>
                    <DialogDescription>
                        {
                            step === 1
                                ? "Select at least 3 categories to personalize your experience"
                                : "We'll show you events happening near you"
                        }
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {
                        step === 1 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-2">
                                    {
                                        CATEGORIES.map((cat) => (
                                            <button key={cat.id}
                                                onClick={() => toggleInterest(cat.id)}
                                                className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${selectedInterests.includes(cat.id)
                                                    ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                                                    : "border-border hover:border-purple-300"
                                                    }`}
                                            >
                                                <div className="text-2xl mb-2">{cat.icon}</div>
                                                <div className="text-sm font-medium">{cat.label}</div>
                                            </button>
                                        ))
                                    }
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={
                                            selectedInterests.length >= 3 ? "default" : "secondary"
                                        }
                                    >
                                        {selectedInterests.length} selected
                                    </Badge>
                                    {selectedInterests.length >= 3 && (
                                        <span className="text-sm text-green-500">
                                            ✓ Ready to continue
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    }

                    {/* Step 2: Location */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Input
                                        onChange={(e) => setLocation((prev) => ({
                                            ...prev,
                                            country: e.target.value
                                        }))}
                                        placeholder="Enter Country Name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input
                                        onChange={(e) => setLocation((prev) => ({
                                            ...prev,
                                            state: e.target.value
                                        }))}
                                        placeholder="Enter Country Name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        onChange={(e) => setLocation((prev) => ({
                                            ...prev,
                                            city: e.target.value
                                        }))}
                                        placeholder="Enter Country Name"
                                    />
                                </div>
                            </div>

                            {location.city && location.state && (
                                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-purple-500 mt-0.5" />
                                        <div>
                                            <p className="font-medium">Your location</p>
                                            <p className="text-sm text-muted-foreground">
                                                {location.city}, {location.state}, {location.country}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    {step > 1 && (
                        <Button
                            variant="outline"
                            onClick={() => setStep(step - 1)}
                            className="gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                    )}
                    <Button
                        onClick={handleNext}
                        disabled={isLoading}
                        className="flex-1 gap-2"
                    >
                        {isLoading
                            ? "Completing..."
                            : step === 2
                                ? "Complete Setup"
                                : "Continue"
                        }
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
                {/* </div> */}
            </DialogContent>
        </Dialog >
    )
}

export default OnboardingModal

"use client"
import { api } from '@/convex/_generated/api';
import { useConvexMutation, useConvexQuery } from '@/hooks/useConvexQuery';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form';
import z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import UpgradeModal from '@/components/custom/UpgradeModal';
import Image from 'next/image';
import UnsplashImagePicker from '@/components/custom/UnsplashImagePicker';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Crown, Loader2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES } from '@/lib/data';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import AIEventCreator from './_components/AIEventCreater';

// HH:MM in 24h
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const eventSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    description: z.string().min(20, "Description must be at least 20 characters"),
    category: z.string().min(1, "Please select a category"),
    startDate: z.date({ required_error: "Start date is required" }),
    endDate: z.date({ required_error: "End date is required" }),
    startTime: z.string().regex(timeRegex, "Start time must be HH:MM"),
    endTime: z.string().regex(timeRegex, "End time must be HH:MM"),
    locationType: z.enum(["physical", "online"]).default("physical"),
    venue: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    address: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().optional(),
    capacity: z.number().min(1, "Capacity must be at least 1"),
    ticketType: z.enum(["free", "paid"]).default("free"),
    ticketPrice: z.number().optional(),
    coverImage: z.string().optional(),
    themeColor: z.string().default("#1e3a8a"),
})

const CreateEvent = () => {
    const router = useRouter();

    const [showImagePicker, setShowImagePicker] = useState(false);
    const [upgradeModal, setShowUpgradeModal] = useState(false);
    const [UpgradeReason, setUpgradeReason] = useState("limit"); // "limit" or "color"

    // check if user has pro plan
    const { has } = useAuth()
    const hasPro = has?.({ plan: "pro" })

    // get current user
    const { data: currentUser } = useConvexQuery(api.users.getCurrentUser)

    // mutation to create event
    const { mutate: createEvent, isLoading: isCreating } = useConvexMutation(api.events.createEvent)

    const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            locationType: "physical",
            ticketType: "free",
            capacity: 50,
            themeColor: "#1e3a8a",
            category: "",
            state: "",
            city: "",
            startTime: "",
            endTime: "",
        }
    })

    const themeColor = watch("themeColor");
    const ticketType = watch("ticketType");
    const startDate = watch("startDate");
    const endDate = watch("endDate");
    const coverImage = watch("coverImage");

    useEffect(() => {
        if (!currentUser) return;
        const userState = currentUser?.location?.state ?? "";
        const userCity = currentUser?.location?.city ?? "";
        if (userState) setValue("state", userState);
        if (userCity) setValue("city", userCity);
    }, [currentUser, setValue]);

    // Color presets - show all for Pro, only default for Free
    const colorPresets = [
        "#1e3a8a", // Default color (always available)
        ...(hasPro ? ["#4c1d95", "#065f46", "#92400e", "#7f1d1d", "#831843"] : []),
    ];

    const handleColorClick = (color) => {
        // If not default color and user does not have pro plan
        if (color !== '#1e3a8a' && !hasPro) {
            setUpgradeReason('color');
            setShowUpgradeModal(true);
            return;
        }
        setValue("themeColor", color);
    }

    const combineDateTime = (date, time) => {
        if (!date || !time) return null;
        const [hh, mm] = time.split(":").map(Number);
        const d = new Date(date);
        d.setHours(hh, mm, 0, 0);
        return d;
    };

    const onSubmit = async (data) => {
        try {
            const start = combineDateTime(data.startDate, data.startTime);
            const end = combineDateTime(data.endDate, data.endTime);

            if (!start || !end) {
                toast.error("Please select both date and time for start and end.");
                return;
            }
            if (end.getTime() <= start.getTime()) {
                toast.error("End date/time must be after start date/time.");
                return;
            }

            // Check event limit for Free users
            if (!hasPro && currentUser?.freeEventsCreated >= 1) {
                setUpgradeReason("limit");
                setShowUpgradeModal(true);
                return;
            }

            // Check if trying to use custom color without Pro
            if (data.themeColor !== "#1e3a8a" && !hasPro) {
                setUpgradeReason("color");
                setShowUpgradeModal(true);
                return;
            }

            await createEvent({
                title: data.title,
                description: data.description,
                category: data.category,
                tags: [data.category],
                startDate: start.getTime(),
                endDate: end.getTime(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                locationType: data.locationType,
                venue: data.venue || undefined,
                address: data.address || undefined,
                city: data.city,
                state: data.state || undefined,
                country: currentUser?.location.country,
                capacity: data.capacity,
                ticketType: data.ticketType,
                ticketPrice: data.ticketPrice || undefined,
                coverImage: data.coverImage || undefined,
                themeColor: data.themeColor,
                hasPro,
            });

            toast.success("Event created successfully! 🎉");
            router.push("/my-events");
        } catch (error) {
            toast.error(error.message || "Failed to create event");
        }
    };

    const handleAIGenerate = (generatedData) => {
        setValue("title", generatedData.title);
        setValue("description", generatedData.description);
        setValue("category", generatedData.category);
        setValue("capacity", generatedData.suggestedCapacity);
        setValue("ticketType", generatedData.suggestedTicketType);
        toast.success("Event details filled! Customize as needed.");
    }

    return (
        <div style={{ backgroundColor: themeColor }}
            className='min-h-screen transition-colors duration-300 px-6 py-8 -mt-6 md:-mt-16 lg:-mt-5 lg:rounded-md'
        >
            <div className='max-w-6xl mx-auto flex flex-col gap-5 md:flex-row justify-between mb-10'>
                <div>
                    <h1 className='text-4xl font-bold'>Create Event</h1>
                    {
                        !hasPro && (
                            <p className="text-xs mt-2 text-muted-foreground">
                                Free: {currentUser?.freeEventCreated || 0}/1 events created
                            </p>
                        )
                    }
                </div>

                {/* AI event generator */}
                {
                    !hasPro ? (
                        <Button onClick={() => setShowUpgradeModal(true)}>
                            <Crown className='h- w-4' />
                            Generate with AI
                        </Button>
                    ) : (
                        <AIEventCreator onEventGenerated={handleAIGenerate} />
                    )
                }
            </div>

            <div className='max-w-6xl mx-auto grid md:grid-cols-[320px_1fr] gap-10'>
                {/* LEFT: Image + Theme */}
                <div className='space-y-6'>
                    <div className="aspect-square w-full rounded-xl overflow-hidden flex items-center justify-center cursor-pointer border" onClick={() => setShowImagePicker(true)}>
                        {
                            coverImage ? (
                                <Image
                                    src={coverImage}
                                    alt='Cover Image'
                                    className='w-full h-full object-cover'
                                    width={500}
                                    height={500}
                                />
                            ) : (
                                <span className="opacity-60 text-sm">
                                    Click to add cover image
                                </span>
                            )
                        }
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className={"text-sm"}>Theme Color</Label>
                            {!hasPro && (
                                <Badge variant={"secondary"} className={"text-xs gap-1"}>
                                    <Crown className='h-3 w-3' />
                                    Pro
                                </Badge>
                            )}
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            {
                                colorPresets.map((clr) => (
                                    <button key={clr} type='button'
                                        className={`w-10 h-10 rounded-full border-2 transition-all ${!hasPro && clr !== "#1e3a8a"
                                            ? "opacity-40 cursor-not-allowed"
                                            : "hover:scale-110"
                                            }`}
                                        style={{
                                            backgroundColor: clr,
                                            borderColor: themeColor === clr ? "white" : "transparent",
                                        }}
                                        onClick={() => handleColorClick(clr)}
                                        title={
                                            !hasPro && clr !== "#1e3a8a"
                                                ? "Upgrade to Pro for custom colors"
                                                : ""
                                        }
                                    />
                                ))
                            }
                            {!hasPro && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUpgradeReason("color");
                                        setShowUpgradeModal(true);
                                    }}
                                    className="w-10 h-10 rounded-full border-2 border-dashed border-purple-300 flex items-center justify-center hover:border-purple-500 transition-colors"
                                    title="Unlock more colors with Pro"
                                >
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                </button>
                            )}
                        </div>
                        {!hasPro && (
                            <p className="text-xs text-muted-foreground">
                                Upgrade to pro to unlock custom theme colors.
                            </p>
                        )}
                    </div>
                </div>

                {/* RIGHT: Form */}
                <form onSubmit={handleSubmit(onSubmit)} className='space-y-8'>
                    {/* Title */}
                    <div>
                        <Input
                            {...register("title")}
                            placeholder="Event Name"
                            className="text-3xl font-semibold bg-transparent border-none focus-visible:ring-0"
                        />
                        {errors.title && (
                            <p className="text-sm text-red-400 mt-1">
                                {errors.title.message}
                            </p>
                        )}
                    </div>

                    {/* Start Date */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className={"text-sm"}>Start</Label>

                            <div className="grid grid-cols-[1fr_auto] gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between"
                                        >
                                            {startDate ? format(startDate, "PPP") : "Pick date"}
                                            <CalendarIcon className="w-4 h-4 opacity-60" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0">
                                        <Calendar
                                            mode="single"
                                            selected={startDate}
                                            onSelect={(date) => setValue("startDate", date)}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <Input
                                    type="time"
                                    {...register("startTime")}
                                    placeholder="hh:mm"
                                />
                            </div>
                            {(errors.startDate || errors.startTime) && (
                                <p className="text-sm text-red-400">
                                    {errors.startDate?.message || errors.startTime?.message}
                                </p>
                            )}
                        </div>

                        {/* End */}
                        <div className="space-y-2">
                            <Label className="text-sm">End</Label>
                            <div className="grid grid-cols-[1fr_auto] gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between"
                                        >
                                            {endDate ? format(endDate, "PPP") : "Pick date"}
                                            <CalendarIcon className="w-4 h-4 opacity-60" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0">
                                        <Calendar
                                            mode="single"
                                            selected={endDate}
                                            onSelect={(date) => setValue("endDate", date)}
                                            disabled={(date) => date < (startDate || new Date())}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <Input
                                    type="time"
                                    {...register("endTime")}
                                    placeholder="hh:mm"
                                />
                            </div>
                            {(errors.endDate || errors.endTime) && (
                                <p className="text-sm text-red-400">
                                    {errors.endDate?.message || errors.endTime?.message}
                                </p>
                            )}
                        </div>

                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label className="text-sm">Category</Label>
                        <Controller
                            control={control}
                            name="category"
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.icon} {cat.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.category && (
                            <p className="text-sm text-red-400">{errors.category.message}</p>
                        )}
                    </div>

                    {/* Location */}
                    <div className="space-y-3">
                        <Label className="text-sm">Location</Label>
                        <div className="grid grid-cols-2 gap-4">

                            <Input
                                type="text"
                                {...register("state")}
                                placeholder="Enter State..."
                            />

                            <Input
                                type="text"
                                {...register("city")}
                                placeholder="Enter city..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2 mt-6">
                        <Label className="text-sm">Venue Details</Label>

                        <Input
                            {...register("venue")}
                            placeholder="Venue link (Google Maps Link)"
                            type="url"
                        />
                        {errors.venue && (
                            <p className="text-sm text-red-400">{errors.venue.message}</p>
                        )}

                        <Input
                            {...register("address")}
                            placeholder="Full address / street / building (optional)"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            {...register("description")}
                            placeholder="Tell people about your event..."
                            rows={4}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-400">
                                {errors.description.message}
                            </p>
                        )}
                    </div>

                    {/* Ticketing */}
                    <div className="space-y-3">
                        <Label className="text-sm">Tickets</Label>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    value="free"
                                    {...register("ticketType")}
                                    defaultChecked
                                />{" "}
                                Free
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="radio" value="paid" {...register("ticketType")} />{" "}
                                Paid
                            </label>
                        </div>

                        {ticketType === "paid" && (
                            <Input
                                type="number"
                                placeholder="Ticket price ₹"
                                {...register("ticketPrice", { valueAsNumber: true })}
                            />
                        )}
                    </div>

                    {/* Capacity */}
                    <div className="space-y-2">
                        <Label className="text-sm">Capacity</Label>
                        <Input
                            type="number"
                            {...register("capacity", { valueAsNumber: true })}
                            placeholder="Ex: 100"
                        />
                        {errors.capacity && (
                            <p className="text-sm text-red-400">{errors.capacity.message}</p>
                        )}
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        disabled={isCreating}
                        className="w-full py-6 text-lg rounded-xl"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                            </>
                        ) : (
                            "Create Event"
                        )}
                    </Button>
                </form>
            </div >

            {/* UNSPLASH: Image Picker */}
            {
                showImagePicker && (
                    <UnsplashImagePicker isOpen={showImagePicker} onClose={() => setShowImagePicker(false)} onSelect={(url) => {
                        setValue("coverImage", url);
                        setShowImagePicker(false);
                    }} />
                )
            }

            {/* Upgrade Modal */}
            <UpgradeModal
                isOpen={upgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                trigger={UpgradeReason}
            />
        </div >
    )
}

export default CreateEvent

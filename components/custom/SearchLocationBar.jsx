"use client"
import { api } from '@/convex/_generated/api';
import { useConvexMutation, useConvexQuery } from '@/hooks/useConvexQuery';
import { City, State } from 'country-state-city';
import { Calendar, Loader2, MapPin, Search } from 'lucide-react';
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '../ui/input';
import { debounce } from 'lodash';
import { getCategoryIcon } from '@/lib/data';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { createLocationSlug } from '@/lib/location-utils';

const SearchLocationBar = () => {
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState("");
    const [showSearchResult, setShowSearchResult] = useState(false);
    const searchRef = useRef(null);

    const [selectedState, setSelectedState] = useState("")
    const [selectedCity, setSelectedCity] = useState("")

    const { data: currentUser, isLoading } = useConvexQuery(api.users.getCurrentUser)

    const { mutate: updateLocation } = useConvexMutation(api.users.completeOnBoarding)

    const { data: searchedResults, isLoading: searchLoading } = useConvexQuery(api.search.searchEvents, searchQuery.trim().length >= 2 ? { query: searchQuery, limit: 5 } : "skip")

    const indianStates = State.getStatesOfCountry("IN");

    // Get cities based on selected state
    const cities = useMemo(() => {
        if (!selectedState) return [];
        const state = indianStates.find((s) => s.name === selectedState);
        if (!state) return [];
        return City.getCitiesOfState("IN", state.isoCode);
    }, [selectedState, indianStates]);


    useEffect(() => {
        if (currentUser?.location) {
            setSelectedState(currentUser.location.state || "");
            setSelectedCity(currentUser.location.city || "");
        }
    }, [currentUser, isLoading])

    const debouncedSearchQuery = useRef(
        debounce((value) => setSearchQuery(value), 300)
    ).current

    const handleSearchInput = (e) => {
        const value = e.target.value;
        debouncedSearchQuery(value)
        setShowSearchResult(value.length >= 2)
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchResult(false)
            }
        };
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    })

    const handleLocationSelect = async (city, state) => {
        try {
            if (currentUser?.interests && currentUser?.location) {
                await updateLocation({
                    location: { city, state, country: "India" },
                    interests: currentUser.interests,
                });
            }
            const slug = createLocationSlug(city, state);
            router.push(`/explore/${slug}`);
        } catch (error) {
            console.error("Failed to update location:", error);
        }
    };    

    return (
        <div className='flex items-center'>
            <div className="relative flex w-full" ref={searchRef}>
                <div className="flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search events..."
                        onChange={handleSearchInput}
                        onFocus={() => {
                            if (searchQuery.length >= 2) setShowSearchResult(true);
                        }}
                        className="pl-10 w-full h-9"
                    />
                </div>

                {
                    showSearchResult && (
                        <div className="absolute top-full mt-2 w-96 bg-background border rounded-lg shadow-lg z-50 overflow-y-auto max-h-[400px]">
                            {
                                searchLoading ? (
                                    <div className="p-4 flex items-center justify-center">
                                        <Loader2 className='w-5 h-5 animate-spin text-purple-500' />
                                    </div>
                                ) : searchedResults && searchedResults.length > 0 ? (
                                    <div className='py-2'>
                                        <p className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                                            SEARCH RESULTS
                                        </p>
                                        {
                                            searchedResults.map((res) => (
                                                <button key={res._id} className='w-full px-4 py-3 hover:bg-muted/50 text-left transition-colors' onClick={() => {
                                                    setShowSearchResult(false)
                                                    setSearchQuery("")
                                                    router.push(`/events/${res.slug}`)
                                                }}>
                                                    <div className="flex items-start gap-3">
                                                        <div className="text-2xl mt-0.5">
                                                            {getCategoryIcon(res.category)}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium mb-1 line-clamp-1">
                                                                {res.title}
                                                            </p>
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {format(res.startDate, "MMM dd")}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3" />
                                                                    {res.city}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {res.ticketType === "free" && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Free
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </button>
                                            ))
                                        }
                                    </div>
                                ) : null
                            }
                        </div>
                    )
                }
            </div>

            {/* State Select */}
            

            {/* City Select */}
            
        </div>
    )
}

export default SearchLocationBar

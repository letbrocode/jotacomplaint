"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, MapPin, Plus, Navigation } from "lucide-react";

// Dynamic import for the map picker
const LocationPickerMap = dynamic(
  () => import("~/components/maps/LocationPickerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted flex h-[300px] w-full items-center justify-center rounded-lg">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    ),
  },
);

const locationSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters"),
  type: z.enum(["GARBAGE_BIN", "DUMP_SITE", "COLLECTION_POINT"]),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  latitude: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= -90 && num <= 90;
  }, "Latitude must be between -90 and 90"),
  longitude: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= -180 && num <= 180;
  }, "Longitude must be between -180 and 180"),
});

type LocationFormValues = z.infer<typeof locationSchema>;

type AddLocationDialogProps = {
  onSuccess: () => void;
};

export default function AddLocationDialog({
  onSuccess,
}: AddLocationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: "",
      type: "GARBAGE_BIN",
      description: "",
      latitude: "",
      longitude: "",
    },
  });

  const handleMapChange = (coords: { latitude: number; longitude: number }) => {
    form.setValue("latitude", coords.latitude.toString());
    form.setValue("longitude", coords.longitude.toString());
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue("latitude", position.coords.latitude.toString());
        form.setValue("longitude", position.coords.longitude.toString());
        toast.success("Location captured successfully");
        setIsGettingLocation(false);
      },
      (error) => {
        toast.error("Unable to get location", {
          description: error.message,
        });
        setIsGettingLocation(false);
      },
    );
  };

  const onSubmit = async (data: LocationFormValues) => {
    setIsSubmitting(true);

    try {
      const payload = {
        name: data.name,
        type: data.type,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        description: data.description ?? null,
      };

      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMessage = "Failed to add location";
        try {
          const error = (await res.json()) as {
            error?: string;
            message?: string;
          };
          errorMessage =
            error.error ?? error.message ?? res.statusText ?? errorMessage;
        } catch {
          errorMessage = res.statusText ?? errorMessage;
        }
        throw new Error(errorMessage);
      }

      const location = (await res.json()) as { name: string };

      toast.success("Location added successfully!", {
        description: `${location.name} has been added to the map`,
      });

      form.reset();
      setOpen(false);
      onSuccess();
    } catch (err) {
      console.error("Error adding location:", err);
      toast.error("Failed to add location", {
        description: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="relative z-10">
          <Plus className="mr-2 h-4 w-4" />
          Add Public Location
        </Button>
      </DialogTrigger>
      <DialogContent className="z-[100] max-h-[90vh] overflow-y-auto sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Add Public Location</DialogTitle>
          <DialogDescription>
            Add a new garbage bin, collection point, or dump site to the map
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Dadar Station Garbage Bin"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Give this location a descriptive name
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[110]">
                      <SelectItem value="GARBAGE_BIN">
                        🗑️ Garbage Bin
                      </SelectItem>
                      <SelectItem value="COLLECTION_POINT">
                        📦 Collection Point
                      </SelectItem>
                      <SelectItem value="DUMP_SITE">🏭 Dump Site</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details about this location..."
                      className="min-h-[80px] resize-none"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length ?? 0}/500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Section with Tabs */}
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Location Coordinates *</h3>
                  <p className="text-muted-foreground text-sm">
                    Choose your preferred method to set location
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation || isSubmitting}
                >
                  {isGettingLocation ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="mr-2 h-4 w-4" />
                  )}
                  Current Location
                </Button>
              </div>

              <Tabs defaultValue="map" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="map">
                    <MapPin className="mr-2 h-4 w-4" />
                    Map Picker
                  </TabsTrigger>
                  <TabsTrigger value="manual">📍 Enter Manually</TabsTrigger>
                </TabsList>

                {/* Map Tab */}
                <TabsContent value="map" className="space-y-3">
                  <p className="text-muted-foreground text-sm">
                    Click on the map to pin the exact location
                  </p>

                  <LocationPickerMap
                    value={
                      form.watch("latitude") && form.watch("longitude")
                        ? {
                            latitude: Number(form.watch("latitude")),
                            longitude: Number(form.watch("longitude")),
                          }
                        : undefined
                    }
                    onChange={handleMapChange}
                    height="300px"
                  />

                  {form.watch("latitude") && form.watch("longitude") && (
                    <div className="bg-muted rounded p-2 text-xs">
                      <span className="font-semibold">Coordinates:</span>{" "}
                      {parseFloat(form.watch("latitude")).toFixed(6)},{" "}
                      {parseFloat(form.watch("longitude")).toFixed(6)}
                    </div>
                  )}
                </TabsContent>

                {/* Manual Entry Tab */}
                <TabsContent value="manual" className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="font-medium">Mumbai Coordinate Ranges:</p>
                    <p className="text-muted-foreground">
                      Latitude: 18.89 to 19.27 • Longitude: 72.77 to 72.98
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="any"
                              placeholder="e.g., 19.0760"
                              {...field}
                              disabled={isSubmitting}
                              onChange={(e) => {
                                field.onChange(e);
                                // Update map when coordinates change
                                const lat = parseFloat(e.target.value);
                                const lng = parseFloat(form.watch("longitude"));
                                if (!isNaN(lat) && !isNaN(lng)) {
                                  handleMapChange({
                                    latitude: lat,
                                    longitude: lng,
                                  });
                                }
                              }}
                            />
                          </FormControl>
                          <FormDescription>Range: -90 to 90</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="any"
                              placeholder="e.g., 72.8777"
                              {...field}
                              disabled={isSubmitting}
                              onChange={(e) => {
                                field.onChange(e);
                                // Update map when coordinates change
                                const lat = parseFloat(form.watch("latitude"));
                                const lng = parseFloat(e.target.value);
                                if (!isNaN(lat) && !isNaN(lng)) {
                                  handleMapChange({
                                    latitude: lat,
                                    longitude: lng,
                                  });
                                }
                              }}
                            />
                          </FormControl>
                          <FormDescription>Range: -180 to 180</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Preview coordinates */}
                  {form.watch("latitude") && form.watch("longitude") && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Preview:</p>
                      <LocationPickerMap
                        value={{
                          latitude: Number(form.watch("latitude")),
                          longitude: Number(form.watch("longitude")),
                        }}
                        onChange={handleMapChange}
                        height="200px"
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {(form.formState.errors.latitude ??
                form.formState.errors.longitude) && (
                <p className="text-destructive text-sm font-medium">
                  {form.formState.errors.latitude?.message ??
                    form.formState.errors.longitude?.message}
                </p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setOpen(false);
                }}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Location
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

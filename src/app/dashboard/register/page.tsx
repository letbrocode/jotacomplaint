"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
import { toast } from "sonner";
import { Loader2, MapPin, Camera, ArrowLeft, CheckCircle } from "lucide-react";
import Dropzone from "~/components/dropzone";
import Link from "next/link";

// Validation schema
const complaintSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be less than 100 characters"),
  details: z
    .string()
    .min(20, "Please provide more details (at least 20 characters)")
    .max(1000, "Details must be less than 1000 characters"),
  category: z.enum(["ROADS", "WATER", "ELECTRICITY", "SANITATION", "OTHER"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  location: z.string().max(200).optional().or(z.literal("")),
  latitude: z.string().optional().or(z.literal("")),
  longitude: z.string().optional().or(z.literal("")),
  photoUrl: z.string().url().optional().or(z.literal("")),
});

type ComplaintFormValues = z.infer<typeof complaintSchema>;

export default function RegisterComplaint() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const form = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      title: "",
      details: "",
      category: "SANITATION",
      priority: "MEDIUM",
      location: "",
      latitude: "",
      longitude: "",
      photoUrl: "",
    },
  });

  // Get current location
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
  const onSubmit = async (data: ComplaintFormValues) => {
    setIsSubmitting(true);

    try {
      const payload = {
        title: data.title,
        details: data.details,
        category: data.category,
        priority: data.priority,
        location: data.location || null,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        photoUrl: photoUrl || null,
      };

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Try to parse error message, fallback to status text
        let errorMessage = "Failed to register complaint";
        try {
          const error = await res.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use status text
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const complaint = await res.json();

      toast.success("Complaint submitted successfully!", {
        description: "We'll keep you updated on the progress",
      });

      // Redirect to complaint details page
      setTimeout(() => {
        router.push(`/dashboard/complaints/${complaint.id}`);
      }, 1500);
    } catch (err) {
      console.error("Error submitting complaint:", err);
      toast.error("Failed to submit complaint", {
        description: err instanceof Error ? err.message : "Please try again",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Submit a Complaint
          </h2>
          <p className="text-muted-foreground">
            Report an issue in your area and we'll take care of it
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Complaint Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Broken street light on Main Street"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a brief, descriptive title for your complaint
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Details */}
              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the issue in detail..."
                        className="min-h-[120px] resize-none"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide as much detail as possible to help us understand
                      the issue ({field.value.length}/1000 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category and Priority */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ROADS">Roads</SelectItem>
                          <SelectItem value="WATER">Water</SelectItem>
                          <SelectItem value="ELECTRICITY">
                            Electricity
                          </SelectItem>
                          <SelectItem value="SANITATION">Sanitation</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LOW">Low - Not urgent</SelectItem>
                          <SelectItem value="MEDIUM">
                            Medium - Moderate issue
                          </SelectItem>
                          <SelectItem value="HIGH">
                            High - Urgent attention needed
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Location Section */}
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Location (Optional)</h3>
                    <p className="text-muted-foreground text-sm">
                      Help us locate the issue
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
                      <MapPin className="mr-2 h-4 w-4" />
                    )}
                    Get Current Location
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address/Landmark</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Near City Hall, Main Street"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 40.7128"
                            type="number"
                            step="any"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., -74.0060"
                            type="number"
                            step="any"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  <div>
                    <h3 className="font-semibold">Photo (Optional)</h3>
                    <p className="text-muted-foreground text-sm">
                      Add a photo to help illustrate the issue
                    </p>
                  </div>
                </div>

                <Dropzone
                  onUploadComplete={(url) => {
                    setPhotoUrl(url ?? "");
                    form.setValue("photoUrl", url ?? "");
                  }}
                />

                {photoUrl && (
                  <div className="relative h-48 w-full overflow-hidden rounded-lg border">
                    <img
                      src={photoUrl}
                      alt="Uploaded complaint"
                      className="h-full w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setPhotoUrl("");
                        form.setValue("photoUrl", "");
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Submit Complaint
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

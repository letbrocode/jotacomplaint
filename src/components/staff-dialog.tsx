"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { User, Department } from "@prisma/client";

// Validation schema
const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
  role: z.enum(["ADMIN", "STAFF", "USER"]),
  isActive: z.boolean(),
  departmentIds: z.array(z.number()).optional(),
});

type StaffFormValues = z.infer<typeof staffSchema>;

type StaffWithRelations = User & {
  departments?: Department[];
};

interface StaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffWithRelations | null;
  departments: Department[];
  onSave: (staff: StaffWithRelations) => void;
}

export default function StaffDialog({
  open,
  onOpenChange,
  staff,
  departments,
  onSave,
}: StaffDialogProps) {
  const isEditing = !!staff;
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "STAFF",
      isActive: true,
      departmentIds: [],
    },
  });

  // Reset form when dialog opens/closes or staff changes
  useEffect(() => {
    if (open) {
      if (staff) {
        const deptIds = staff.departments?.map((d) => d.id) || [];
        setSelectedDepartments(deptIds);
        form.reset({
          name: staff.name || "",
          email: staff.email || "",
          password: "",
          role: staff.role,
          isActive: staff.isActive,
          departmentIds: deptIds,
        });
      } else {
        setSelectedDepartments([]);
        form.reset({
          name: "",
          email: "",
          password: "",
          role: "STAFF",
          isActive: true,
          departmentIds: [],
        });
      }
    }
  }, [open, staff, form]);

  const toggleDepartment = (deptId: number) => {
    setSelectedDepartments((prev) => {
      if (prev.includes(deptId)) {
        return prev.filter((id) => id !== deptId);
      } else {
        return [...prev, deptId];
      }
    });
  };

  const onSubmit = async (values: StaffFormValues) => {
    try {
      const url = isEditing ? `/api/staff/${staff.id}` : "/api/staff";
      const method = isEditing ? "PATCH" : "POST";

      // Prepare payload
      const payload = {
        ...values,
        departmentIds: selectedDepartments,
        // Only include password if it's provided
        ...(values.password ? { password: values.password } : {}),
      };

      // Remove password field if empty (for editing)
      if (isEditing && !values.password) {
        delete payload.password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save staff member");
      }

      const savedStaff = await res.json();

      toast.success(
        isEditing
          ? "Staff member updated successfully"
          : "Staff member created successfully",
      );

      onSave(savedStaff);
      form.reset();
      setSelectedDepartments([]);
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to save staff member",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Staff Member" : "Create New Staff Member"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the staff member information below."
              : "Fill in the details to create a new staff member."}
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
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john.doe@municipality.gov"
                      {...field}
                      disabled={isEditing} // Don't allow email change on edit
                    />
                  </FormControl>
                  {isEditing && (
                    <FormDescription>Email cannot be changed</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password {!isEditing && "*"}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={
                        isEditing
                          ? "Leave blank to keep current password"
                          : "Minimum 8 characters"
                      }
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  {isEditing && (
                    <FormDescription>
                      Leave blank to keep current password
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="USER">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Admin: Full access | Staff: Department management | User:
                    Submit complaints
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Departments */}
            <FormItem>
              <FormLabel>Department Assignment</FormLabel>
              <FormDescription>
                Select departments this staff member belongs to
              </FormDescription>
              <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                {departments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No departments available
                  </p>
                ) : (
                  departments.map((dept) => (
                    <div
                      key={dept.id}
                      className="hover:bg-muted flex items-center space-x-2 rounded-md p-2"
                    >
                      <Checkbox
                        id={`dept-${dept.id}`}
                        checked={selectedDepartments.includes(dept.id)}
                        onCheckedChange={() => toggleDepartment(dept.id)}
                      />
                      <label
                        htmlFor={`dept-${dept.id}`}
                        className="flex-1 cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {dept.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
              {selectedDepartments.length > 0 && (
                <p className="text-muted-foreground mt-2 text-sm">
                  {selectedDepartments.length} department(s) selected
                </p>
              )}
            </FormItem>

            {/* Active Status */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <FormDescription>
                      Inactive staff cannot log in
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

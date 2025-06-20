"use client";
import { useMutation } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar as CalendarIcon,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { countryToEmoji } from "@/lib/country-emojis";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { useUserContext } from "@/app/_contexts/User";
import { backendApiURL } from "@/config/endpoints";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  country: z.string().min(1, "Country is required"),
  short_description: z
    .string()
    .min(1, "Short description is required")
    .max(200, "Short description must be less than 200 characters"),
  long_description: z
    .string()
    .min(100, "Long description must be at least 100 characters"),
  start_date: z.date({
    required_error: "Start date is required",
  }),
  website: z
    .string()
    .url("Must be a valid URL")
    .or(z.string().length(0))
    .nullable(),
  objective: z.string().min(1, "Objective is required"),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export type Project = {
  project_id: string;
  name: string;
  country?: string;
  short_description?: string;
  long_description: string;
  start_date: string; // YYYY-MM-DD
  website: string | null;
  objective: string;
};

interface ProjectFormProps {
  initialProjectData: Project;
  onSuccess?: () => void;
  resetKey?: number; // Optional key to trigger form reset
  mode?: "edit" | "new";
}

const ProjectForm = ({
  initialProjectData,
  onSuccess,
  resetKey = 0,
  mode = "edit",
}: ProjectFormProps) => {
  const {
    privy: { accessToken },
    refetch,
  } = useUserContext();

  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailure, setShowFailure] = useState(false);

  // Transform initial project data to form data format
  const transformProjectToFormData = (project: Project): ProjectFormData => ({
    name: project.name,
    country: project.country || "",
    short_description: project.short_description || "",
    long_description: project.long_description,
    start_date: new Date(project.start_date),
    website: project.website,
    objective: project.objective,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: transformProjectToFormData(initialProjectData),
  });

  // Watch all form fields for changes
  const formValues = watch();

  // Compare current form values with initial data
  const hasNoChanges = React.useMemo(() => {
    const currentData = {
      ...formValues,
      start_date: formValues.start_date
        ? format(formValues.start_date, "yyyy-MM-dd")
        : "",
    };

    const initialFormData = {
      ...initialProjectData,
      country: initialProjectData.country || "",
      short_description: initialProjectData.short_description || "",
    };

    return JSON.stringify(currentData) === JSON.stringify(initialFormData);
  }, [formValues, initialProjectData]);

  // Reset form when resetKey changes
  useEffect(() => {
    reset(transformProjectToFormData(initialProjectData));
  }, [resetKey, initialProjectData, reset]);

  const updateProject = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      if (!accessToken) throw new Error("No token available");

      const formattedData = {
        ...data,
        start_date: format(data.start_date, "yyyy-MM-dd"),
        // project id is not allowed to be updated
      };

      const baseURL = `${backendApiURL}/projects`;
      const endpoint =
        mode === "edit" ? `/${initialProjectData.project_id}` : "/";

      const res = await fetch(`${baseURL}${endpoint}`, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formattedData),
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ message: "Unknown error occurred" }));
        console.error("API Error:", errorData);
        throw new Error("Failed to update project");
      }
      return res.json();
    },
    onSuccess: () => {
      setShowSuccess(true);
      setShowFailure(false);
      refetch();
      onSuccess?.();
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      setShowFailure(true);
      setShowSuccess(false);
      setTimeout(() => {
        setShowFailure(false);
      }, 5000);
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    updateProject.mutate(data);
  };

  const countryOptions = Object.entries(countryToEmoji).map(
    ([code, details]) => ({
      value: code,
      label: `${details.emoji} ${details.name}`,
    })
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-[1fr,1.5fr] gap-6">
        {/* Left Section - Basic Details */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm text-muted-foreground font-medium mb-1"
            >
              Project Name
            </label>
            <Input
              id="name"
              {...register("name")}
              className={errors.name ? "border-destructive" : ""}
              disabled={mode === "edit"}
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="country"
              className="block text-sm text-muted-foreground font-medium mb-1"
            >
              Country
            </label>
            <Controller
              control={control}
              name="country"
              render={({ field }) => (
                <Combobox
                  options={countryOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select a country"
                  className={cn(
                    "w-full",
                    errors.country ? "border-destructive" : ""
                  )}
                  disabled={mode === "edit"}
                />
              )}
            />
            {errors.country && (
              <p className="text-sm text-destructive mt-1">
                {errors.country.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="start_date"
              className="block text-sm text-muted-foreground font-medium mb-1"
            >
              Start Date
            </label>
            <Controller
              control={control}
              name="start_date"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground",
                        errors.start_date && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.start_date && (
              <p className="text-sm text-destructive mt-1">
                {errors.start_date.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="website"
              className="block text-sm text-muted-foreground font-medium mb-1"
            >
              Website
            </label>
            <div className="relative">
              <Globe className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="website"
                type="url"
                placeholder="https://"
                {...register("website")}
                className={cn(
                  "pl-8",
                  errors.website ? "border-destructive" : ""
                )}
              />
            </div>
            {errors.website && (
              <p className="text-sm text-destructive mt-1">
                {errors.website.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="objective"
              className="block text-sm text-muted-foreground font-medium mb-1"
            >
              Objective
            </label>
            <Textarea
              id="objective"
              {...register("objective")}
              rows={3}
              className={errors.objective ? "border-destructive" : ""}
            />
            {errors.objective && (
              <p className="text-sm text-destructive mt-1">
                {errors.objective.message}
              </p>
            )}
          </div>
        </div>

        {/* Right Section - Descriptions */}
        <div className="space-y-6">
          <div>
            <label
              htmlFor="short_description"
              className="block text-sm text-muted-foreground font-medium mb-1"
            >
              Short Description
            </label>
            <Textarea
              id="short_description"
              {...register("short_description")}
              rows={3}
              className={errors.short_description ? "border-destructive" : ""}
            />
            {errors.short_description && (
              <p className="text-sm text-destructive mt-1">
                {errors.short_description.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="long_description"
              className="block text-sm text-muted-foreground font-medium mb-1"
            >
              Long Description
            </label>
            <Textarea
              id="long_description"
              {...register("long_description")}
              rows={12}
              className={errors.long_description ? "border-destructive" : ""}
            />
            {errors.long_description && (
              <p className="text-sm text-destructive mt-1">
                {errors.long_description.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button
          type="submit"
          disabled={
            updateProject.isPending ||
            showSuccess ||
            showFailure ||
            hasNoChanges
          }
        >
          {updateProject.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {mode === "edit" ? "Saving..." : "Creating..."}
            </>
          ) : showSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              {mode === "edit"
                ? "Saved successfully!"
                : "Project created successfully!"}
            </>
          ) : showFailure ? (
            <>
              <AlertCircle className="w-4 h-4" />
              {mode === "edit"
                ? "Error saving changes"
                : "Error creating project"}
            </>
          ) : (
            <>{mode === "edit" ? "Save Changes" : "Create Project"}</>
          )}
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;

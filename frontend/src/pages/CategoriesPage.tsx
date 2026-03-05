import { Loader2 } from "lucide-react";
import React from "react";
import { FileImage, Plus } from "lucide-react";
import { useOverlayTriggerState } from "react-stately";
import { Button } from "@/components/ui/button";
import { CategoryForm } from "@/components/categories/category-form";
import SheetDrawer from "@/components/ui/sheet-drawer";
import { Category } from "@/schema/category";
import CategoryAction from "@/components/categories/category-actions";
import { ZeroState } from "@/components/ZeroState";
import { fetchApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function CategoriesPage() {
    const addState = useOverlayTriggerState({});
    const { data: categories, isLoading } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => await fetchApi<Category[]>("/categories/"),
    });
    console.log("🚀 ~ file: CategoriesPage.tsx:17 ~ data:", categories)
    // TODO: Implement categories page
    // get categories from API
    // display categories in a table
    // allow adding new categories
    // allow editing categories
    // allow deleting categories

    return (
        <div>
            {isLoading ? (
                <div className="h-[80vh] flex items-center justify-center bg-background">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <React.Fragment>
                    <div className="w-full max-w-6xl mx-auto p-2 md:p-4 space-y-6">
                        <div className="bg-linear-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-2xl py-8">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Product Categories</h1>
                                    <p className="text-muted-foreground text-lg">Organize and manage your product categories with ease</p>
                                    <div className="flex items-center gap-4 mt-4 text-sm">
                                        <span className="bg-white/20 px-3 py-1 rounded-full">{categories?.length || 0} Categories</span>
                                    </div>
                                </div>
                                <SheetDrawer
                                    open={addState.isOpen}
                                    title="Create Category"
                                    trigger={
                                        <Button
                                            className="bg-white text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 shadow-lg"
                                            size="lg"
                                        >
                                            <Plus className="w-5 h-5" />
                                            Add New Category
                                        </Button>
                                    }
                                    onOpenChange={addState.setOpen}
                                >
                                    <CategoryForm type="create" onClose={addState.close} />
                                </SheetDrawer>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {(categories || []).map((category: Category, idx: number) => (
                                <div
                                    key={idx}
                                    className="bg-card p-4 rounded-2xl shadow-sm border border-input overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-xl font-semibold mb-2 truncate line-clamp-1">{category.name}</h3>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <CategoryAction category={category} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {(!categories || categories.length === 0) && (
                            <ZeroState
                                title="No categories yet"
                                description="Start organizing your products by creating your first category. You can add images and subcategories to make navigation easier."
                                icon={<FileImage className="w-8 h-8 text-gray-400" />}
                            />
                        )}
                    </div>
                </React.Fragment>
            )}
        </div>
    );
}

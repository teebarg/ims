import { Loader2, FileImage, Plus } from "lucide-react";
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

    return (
        <div className="w-full max-w-6xl mx-auto p-2 md:p-4 space-y-6">
            <div className="bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-md">
                <div>
                    <h1 className="text-3xl font-bold mb-1">Product Categories</h1>
                    <p className="text-muted-foreground text-lg">Organize and manage your product categories</p>
                    <div className="mt-4 flex items-center gap-2 text-sm">
                        <span className="bg-white/20 px-3 py-1 rounded-full font-medium">{categories?.length || 0} Categories</span>
                    </div>
                </div>

                <SheetDrawer
                    open={addState.isOpen}
                    title="Create Category"
                    trigger={
                        <Button
                            className="bg-white text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 shadow-lg flex items-center gap-2"
                            size="lg"
                        >
                            <Plus className="w-5 h-5" />
                            Add Category
                        </Button>
                    }
                    onOpenChange={addState.setOpen}
                >
                    <CategoryForm type="create" onClose={addState.close} />
                </SheetDrawer>
            </div>

            {isLoading && (
                <div className="h-[60vh] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            {!isLoading && categories && categories.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="bg-card p-4 rounded-2xl shadow hover:shadow-lg border border-input transition flex flex-col justify-between"
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-semibold truncate">{category.name}</h3>
                                <CategoryAction category={category} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!isLoading && (!categories || categories.length === 0) && (
                <ZeroState
                    title="No categories yet"
                    description="Start organizing your products by creating your first category. Add images and subcategories to improve navigation."
                    icon={<FileImage className="w-12 h-12 text-gray-400" />}
                />
            )}
        </div>
    );
}

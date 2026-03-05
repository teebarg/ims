import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, AdminUser } from "@/lib/admin-api";
import { useAuth } from "@/contexts/AuthContext";
import { Search, UserPlus, Shield, ShieldCheck, MoreHorizontal, Ban, Trash2, RefreshCw, Loader2, Mail, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function UserManagementPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

    // Create user form state
    const [newEmail, setNewEmail] = useState("");
    const [newRole, setNewRole] = useState<string>("staff");
    const [newPassword, setNewPassword] = useState("");
    const [createMethod, setCreateMethod] = useState<"invite" | "password">("invite");

    const {
        data: users = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["admin-users"],
        queryFn: adminApi.listUsers,
    });

    const createMutation = useMutation({
        mutationFn: () => adminApi.createUser(newEmail, newRole, createMethod === "password" ? newPassword : undefined),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            setCreateOpen(false);
            setNewEmail("");
            setNewPassword("");
            setNewRole("staff");
            toast({ title: "User created", description: createMethod === "invite" ? "Invite email sent" : "Account created" });
        },
        onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });

    const roleMutation = useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: string }) => adminApi.updateRole(userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            toast({ title: "Role updated" });
        },
        onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });

    const toggleMutation = useMutation({
        mutationFn: ({ userId, ban }: { userId: string; ban: boolean }) => adminApi.toggleStatus(userId, ban),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            toast({ title: "Status updated" });
        },
        onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: (userId: string) => adminApi.deleteUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            setDeleteTarget(null);
            toast({ title: "User deleted" });
        },
        onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });

    const filtered = users.filter((u) => u.email?.toLowerCase().includes(search.toLowerCase()));

    if (error) {
        return (
            <div className="space-y-4">
                <h1 className="page-header">User Management</h1>
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
                    <Shield className="h-10 w-10 mx-auto text-destructive mb-3" />
                    <p className="font-medium text-foreground">Admin access required</p>
                    <p className="text-sm text-muted-foreground mt-1">You need admin privileges to manage users.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-header">User Management</h1>
                    <p className="page-subtitle">Manage in-house staff accounts and roles</p>
                </div>
                <Button onClick={() => setCreateOpen(true)} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add User
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            {/* Users Table */}
            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="hidden md:table-cell">Last Sign In</TableHead>
                            <TableHead className="hidden md:table-cell">Created</TableHead>
                            <TableHead className="w-12" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((u) => {
                                const isSelf = u.id === user?.id;
                                return (
                                    <TableRow key={u.id} className={u.banned ? "opacity-60" : ""}>
                                        <TableCell className="font-medium">{u.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={u.role === "admin" ? "default" : "secondary"} className="gap-1">
                                                {u.role === "admin" ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                                                {u.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {u.banned ? (
                                                <Badge variant="destructive">Deactivated</Badge>
                                            ) : (
                                                <Badge className="bg-success text-success-foreground hover:bg-success/80">Active</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                            {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "Never"}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {!isSelf && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                roleMutation.mutate({
                                                                    userId: u.id,
                                                                    role: u.role === "admin" ? "staff" : "admin",
                                                                })
                                                            }
                                                        >
                                                            <ShieldCheck className="h-4 w-4 mr-2" />
                                                            {u.role === "admin" ? "Demote to Staff" : "Promote to Admin"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => toggleMutation.mutate({ userId: u.id, ban: !u.banned })}>
                                                            {u.banned ? (
                                                                <>
                                                                    <RefreshCw className="h-4 w-4 mr-2" />
                                                                    Reactivate
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Ban className="h-4 w-4 mr-2" />
                                                                    Deactivate
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => setDeleteTarget(u)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                            {isSelf && (
                                                <Badge variant="outline" className="text-xs">
                                                    You
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create User Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>Invite by email or create with a temporary password.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Method toggle */}
                        <div className="flex gap-2">
                            <Button
                                variant={createMethod === "invite" ? "default" : "outline"}
                                size="sm"
                                className="flex-1 gap-2"
                                onClick={() => setCreateMethod("invite")}
                            >
                                <Mail className="h-4 w-4" />
                                Invite
                            </Button>
                            <Button
                                variant={createMethod === "password" ? "default" : "outline"}
                                size="sm"
                                className="flex-1 gap-2"
                                onClick={() => setCreateMethod("password")}
                            >
                                <KeyRound className="h-4 w-4" />
                                With Password
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input type="email" placeholder="user@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                        </div>

                        {createMethod === "password" && (
                            <div className="space-y-2">
                                <Label>Temporary Password</Label>
                                <Input
                                    type="password"
                                    placeholder="Min 6 characters"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={newRole} onValueChange={setNewRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => createMutation.mutate()}
                            disabled={!newEmail || createMutation.isPending || (createMethod === "password" && newPassword.length < 6)}
                        >
                            {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {createMethod === "invite" ? "Send Invite" : "Create User"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete user?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete <strong>{deleteTarget?.email}</strong> and all their data. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                        >
                            {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

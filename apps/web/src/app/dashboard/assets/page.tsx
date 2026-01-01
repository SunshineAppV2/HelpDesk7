"use client";

import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { Plus, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Asset {
    id: string;
    name: string;
    type: string;
    model: string;
    serialNumber: string;
    location: string;
}

export default function AssetsPage() {
    const { orgId } = useAuth();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) return;

        async function fetchAssets() {
            try {
                const q = query(
                    collection(db, "assets"),
                    where("orgId", "==", orgId),
                    orderBy("createdAt", "desc")
                );
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
                setAssets(data);
            } catch (error) {
                console.error("Error fetching assets:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchAssets();
    }, [orgId]);

    if (loading) return <div className="p-8">Carregando ativos...</div>;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Ativos</h2>
                <Link href="/dashboard/assets/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Novo Ativo
                    </Button>
                </Link>
            </div>

            <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Nome</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Modelo</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Série</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Local</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {assets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                        Nenhum ativo cadastrado.
                                    </td>
                                </tr>
                            ) : (
                                assets.map((asset) => (
                                    <tr key={asset.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 font-medium">{asset.name}</td>
                                        <td className="p-4">{asset.model}</td>
                                        <td className="p-4">{asset.serialNumber}</td>
                                        <td className="p-4">{asset.location}</td>
                                        <td className="p-4">
                                            <Link href={`/dashboard/assets/${asset.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <Printer className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

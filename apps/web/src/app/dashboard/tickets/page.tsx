"use client";

import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Ticket {
    id: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
    requesterName?: string;
    assetId?: string;
}

export default function TicketsPage() {
    const { orgId } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) return;

        async function fetchTickets() {
            try {
                const q = query(
                    collection(db, "tickets"),
                    where("orgId", "==", orgId),
                    orderBy("createdAt", "desc"),
                    limit(50)
                );
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
                setTickets(data);
            } catch (error) {
                console.error("Error fetching tickets:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchTickets();
    }, [orgId]);

    const statusMap: Record<string, string> = {
        open: "Aberto",
        in_progress: "Em Andamento",
        resolved: "Resolvido",
        closed: "Fechado"
    };

    const priorityMap: Record<string, string> = {
        low: "Baixa",
        medium: "Média",
        high: "Alta",
        critical: "Crítica"
    };

    if (loading) return <div className="p-8">Carregando chamados...</div>;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Chamados</h2>
                <Link href="/open-ticket">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Novo Chamado
                    </Button>
                </Link>
            </div>

            <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Título</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Prioridade</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Solicitante</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Data</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                        Nenhum chamado encontrado.
                                    </td>
                                </tr>
                            ) : (
                                tickets.map((ticket) => (
                                    <tr key={ticket.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 font-medium">{ticket.title}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                                                    ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                                        ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                }`}>
                                                {statusMap[ticket.status] || ticket.status}
                                            </span>
                                        </td>
                                        <td className="p-4">{priorityMap[ticket.priority] || ticket.priority}</td>
                                        <td className="p-4">{ticket.requesterName || "N/A"}</td>
                                        <td className="p-4 text-muted-foreground">
                                            {ticket.createdAt ? format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm") : "-"}
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

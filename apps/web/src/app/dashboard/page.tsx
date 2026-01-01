"use client";

import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { DashboardService, DashboardStats } from "@/lib/dashboard";
import { OverviewCharts } from "@/components/dashboard/overview-charts";

export default function DashboardPage() {
    const { user, orgId, loading: authLoading } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            if (authLoading) return; // Wait for auth to finish

            if (!orgId) {
                // Not stuck loading, just no data/org
                setLoading(false);
                return;
            }

            try {
                const data = await DashboardService.getStats(orgId);
                setStats(data);
                setError(null);
            } catch (error: any) {
                console.error("Failed to fetch dashboard stats", error);
                // Check for common permission errors
                if (error.code === 'permission-denied') {
                    setError("Permissão negada. Verifique se o banco de dados está ativado no Firebase.");
                } else if (error.code === 'failed-precondition') {
                    setError("Erro de índice. Verifique o console para o link de criação.");
                } else {
                    setError("Erro ao carregar dados: " + (error.message || "Desconhecido"));
                }
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, [orgId, authLoading]);

    if (authLoading) return <div className="p-8">Verificando autenticação...</div>;
    if (loading) return <div className="p-8">Carregando painel...</div>;

    if (!orgId) return (
        <div className="p-8 text-yellow-600">
            <h2 className="text-xl font-bold mb-2">Atenção</h2>
            <p>Seu usuário não está vinculado a uma organização.</p>
        </div>
    );
    if (error) return (
        <div className="p-8 text-red-500">
            <h2 className="text-xl font-bold mb-2">Erro</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-100 rounded">Tentar Novamente</button>
        </div>
    );

    // Default empty state if no stats
    const safeStats = stats || {
        totalTickets: 0,
        openTickets: 0,
        resolvedTickets: 0,
        lateTickets: 0,
        ticketsByMonth: []
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Chamados Abertos</h3>
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                    </div>
                    <div className="pt-2">
                        <div className="text-2xl font-bold">{safeStats.openTickets}</div>
                        <p className="text-xs text-muted-foreground">Em atendimento</p>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Resolvidos</h3>
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                    </div>
                    <div className="pt-2">
                        <div className="text-2xl font-bold">{safeStats.resolvedTickets}</div>
                        <p className="text-xs text-muted-foreground">Total acumulado</p>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">SLA Atrasados</h3>
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                    </div>
                    <div className="pt-2">
                        <div className="text-2xl font-bold">{safeStats.lateTickets}</div>
                        <p className="text-xs text-muted-foreground">Abertos há +48h</p>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Total Geral</h3>
                    </div>
                    <div className="pt-2">
                        <div className="text-2xl font-bold">{safeStats.totalTickets}</div>
                        <p className="text-xs text-muted-foreground">Tickets recebidos</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6">
                        <h3 className="font-semibold mb-4">Volume de Tickets (Simulado)</h3>
                        <div className="pl-2">
                            <OverviewCharts data={safeStats.ticketsByMonth} />
                        </div>
                    </div>
                </div>

                <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6">
                        <h3 className="font-semibold mb-4">Ações Rápidas</h3>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500">
                                Utilize este painel para monitorar o desempenho.
                                O gráfico e outras métricas serão refinados com dados históricos.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

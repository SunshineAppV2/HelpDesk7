import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { agentAudit } from "./api"; // Import the API function

admin.initializeApp();
const db = admin.firestore();

/**
 * Maintenance Engine
 * Runs automatically on the 1st of every month at 00:00.
 * Generates preventive maintenance tickets based on Maintenance Plans.
 */
export const generatePreventiveTickets = functions.pubsub
    .schedule("0 0 1 * *")
    .timeZone("America/Sao_Paulo")
    .onRun(async (context: functions.EventContext) => {
        console.log("Starting Monthly Maintenance Generation...");

        // 1. Get all active Maintenance Plans
        const plansSnap = await db.collection("maintenance_plans").where("status", "==", "active").get();

        if (plansSnap.empty) {
            console.log("No active maintenance plans found.");
            return null;
        }

        const batch = db.batch();
        let count = 0;

        for (const planDoc of plansSnap.docs) {
            const plan = planDoc.data();

            // 2. Find eligible assets for this plan (e.g., based on type or tag)
            // Assuming plan has 'targetAssetType' or we fetch all assets of org
            const assetsQuery = await db.collection("assets")
                .where("orgId", "==", plan.orgId)
                .where("type", "==", plan.targetAssetType) // e.g. "desktop"
                .where("status", "==", "active")
                .get();

            for (const assetDoc of assetsQuery.docs) {
                const asset = assetDoc.data();

                // 3. Create Ticket
                const ticketRef = db.collection("tickets").doc();
                batch.set(ticketRef, {
                    orgId: plan.orgId,
                    assetId: assetDoc.id,
                    assetName: asset.name,
                    requesterName: "System (Preventive)",
                    description: `Manutenção Preventiva Mensal: ${plan.name}`,
                    status: "open",
                    priority: "medium",
                    type: "preventive",
                    createdAt: new Date().toISOString(),
                    checklist: plan.tasks || [] // Copy tasks from plan to ticket
                });
                count++;
            }
        }

        // 4. Commit batch
        await batch.commit();
        console.log(`Generated ${count} preventive tickets.`);
        return null;
    });

/**
 * KPI Calculator Trigger
 * Updates Organization Stats when a ticket is closed.
 */
export const onTicketUpdate = functions.firestore
    .document("tickets/{ticketId}")
    .onUpdate(async (change: functions.Change<functions.firestore.QueryDocumentSnapshot>, context: functions.EventContext) => {
        const newData = change.after.data();
        const oldData = change.before.data();

        // If status changed to closed/resolved
        if (newData.status !== oldData.status && (newData.status === 'resolved' || newData.status === 'closed')) {
            // Recalculate KPIs for the Org (Simplified)
            // In a real scenario, we might increment counters instead of full recalculation
            const orgRef = db.collection("organizations").doc(newData.orgId);
            await orgRef.update({
                ticketsClosedTotal: admin.firestore.FieldValue.increment(1)
            });
        }
    });

// Export the Agent API
export { agentAudit };

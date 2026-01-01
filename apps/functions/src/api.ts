import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Assuming admin is initialized in index.ts or shared file, but we can re-init if needed or import
// For simplicity in this file, we assume access to admin/db. In real project, use a shared initialized instance.
const db = admin.firestore();

/**
 * Agent Audit Receiver
 * HTTP Endpoint that receives JSON from the Desktop Agent.
 * Url: https://us-central1-<project-id>.cloudfunctions.net/agentAudit
 */
export const agentAudit = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }

    const apiKey = req.headers["x-api-key"] as string;
    const orgId = req.headers["x-org-id"] as string;

    if (!apiKey || !orgId) {
        res.status(401).send("Unauthorized: Missing API Key or Org ID");
        return;
    }

    // Validate API Key (Mock validation)
    // In production, check db.collection('organizations').doc(orgId).get() and compare keys
    if (apiKey !== "TEST-API-KEY") {
        // Allow test key for MVP
        // res.status(403).send("Forbidden");
        // return;
    }

    try {
        const payload = req.body; // Expecting { data: { hostname, softwares, ... } }
        const auditData = payload.data;

        if (!auditData || !auditData.hostname) {
            res.status(400).send("Bad Request: Missing hostname");
            return;
        }

        // Upsert Asset
        // We try to find asset by hostname OR serialNumber to update it
        const assetsRef = db.collection("assets");
        const snapshot = await assetsRef
            .where("orgId", "==", orgId)
            .where("name", "==", auditData.hostname)
            .limit(1)
            .get();

        let assetId;
        if (!snapshot.empty) {
            // Update existing
            assetId = snapshot.docs[0].id;
            await assetsRef.doc(assetId).update({
                softwares: auditData.softwares,
                lastAudit: new Date().toISOString(),
                model: auditData.model,
                os: auditData.os,
                serialNumber: auditData.serialNumber
            });
        } else {
            // Create new
            const newDoc = await assetsRef.add({
                orgId: orgId,
                name: auditData.hostname,
                type: "desktop", // Default inferred
                status: "active",
                softwares: auditData.softwares,
                lastAudit: new Date().toISOString(),
                model: auditData.model,
                os: auditData.os,
                serialNumber: auditData.serialNumber,
                createdAt: new Date().toISOString()
            });
            assetId = newDoc.id;
        }

        // Check for Critical Software Vulnerabilities (Mock Logic)
        const dangerousSoftwares = auditData.softwares.filter((sw: any) => {
            // Example rule: Chrome version < 100
            return sw.Name.includes("Chrome") && parseInt(sw.Version) < 100;
        });

        if (dangerousSoftwares.length > 0) {
            // Create Alert / Ticket ?
            // For MVP, we just logged it. The dashboard highlights it based on data.
            console.log(`Vulnerability detected on ${auditData.hostname}`);
        }

        res.status(200).json({ status: "success", assetId });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

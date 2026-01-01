"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentAudit = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Assuming admin is initialized in index.ts or shared file, but we can re-init if needed or import
// For simplicity in this file, we assume access to admin/db. In real project, use a shared initialized instance.
const db = admin.firestore();
/**
 * Agent Audit Receiver
 * HTTP Endpoint that receives JSON from the Desktop Agent.
 * Url: https://us-central1-<project-id>.cloudfunctions.net/agentAudit
 */
exports.agentAudit = functions.https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const apiKey = req.headers["x-api-key"];
    const orgId = req.headers["x-org-id"];
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
        }
        else {
            // Create new
            const newDoc = await assetsRef.add({
                orgId: orgId,
                name: auditData.hostname,
                type: "desktop",
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
        const dangerousSoftwares = auditData.softwares.filter((sw) => {
            // Example rule: Chrome version < 100
            return sw.Name.includes("Chrome") && parseInt(sw.Version) < 100;
        });
        if (dangerousSoftwares.length > 0) {
            // Create Alert / Ticket ?
            // For MVP, we just logged it. The dashboard highlights it based on data.
            console.log(`Vulnerability detected on ${auditData.hostname}`);
        }
        res.status(200).json({ status: "success", assetId });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});
//# sourceMappingURL=api.js.map
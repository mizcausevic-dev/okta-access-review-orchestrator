import { accessRisks, reviewLane, summary } from "../src/services/oktaAccessReviewOrchestratorService.js";

console.log("okta-access-review-orchestrator demo");
console.log(JSON.stringify(summary(), null, 2));
console.log(JSON.stringify(reviewLane().map((lane) => ({ reviewName: lane.reviewName, owner: lane.owner, status: lane.status })), null, 2));
console.log(JSON.stringify(accessRisks().slice(0, 3), null, 2));

import { setGlobalOptions } from "firebase-functions/v2";

/** Co-located with Firestore and Storage (asia-south1 / Mumbai). See docs/ARCHITECTURE.md §8. */
export const REGION = "asia-south1";

setGlobalOptions({
  region: REGION,
  maxInstances: 10,
  memory: "256MiB",
  timeoutSeconds: 60,
});

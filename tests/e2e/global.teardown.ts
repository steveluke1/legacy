import { cleanupGeneratedState, resetLocalState } from "../unit/helpers/reset-local-state";

export default function globalTeardown() {
  resetLocalState({ stdio: "inherit" });
  cleanupGeneratedState({ stdio: "inherit" });
}
